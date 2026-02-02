import { z } from 'zod'
import { db, users } from '#db'
import { eq } from 'drizzle-orm'
import { requireAuth, hashUserPassword, generateRandomToken, hashToken } from '../../utils/auth'
import { ProfileUpdateResponseSchema } from '../../schemas'
import { sendEmailChangeVerification } from '../../utils/email'

const updateProfileSchema = z.object({
  firstName: z.string().max(50, 'First name is too long').optional(),
  lastName: z.string().max(50, 'Last name is too long').optional(),
  displayName: z.string().max(50, 'Display name is too long').optional(),
  email: z.string().email('Invalid email address').optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .optional()
})

export default defineEventHandler(async (event) => {
  // Require authentication
  const currentUser = await requireAuth(event)

  // Parse and validate request body
  const body = await readBody(event)
  const result = updateProfileSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]!.message
    })
  }

  const { firstName, lastName, displayName, email, currentPassword, newPassword } = result.data

  // Prepare update object
  const updates: {
    updatedAt: Date
    firstName?: string
    lastName?: string
    displayName?: string | null
    name?: string
    passwordHash?: string
    pendingEmail?: string
    pendingEmailToken?: string
    pendingEmailTokenExpires?: Date
  } = {
    updatedAt: new Date()
  }

  // Track if we need to send verification email
  let pendingEmailChange: { email: string; token: string } | null = null

  // Update firstName if provided
  if (firstName !== undefined) {
    updates.firstName = firstName
  }

  // Update lastName if provided
  if (lastName !== undefined) {
    updates.lastName = lastName
  }

  // Update displayName if provided (allow empty string to clear it)
  if (displayName !== undefined) {
    updates.displayName = displayName || null
  }

  // Update legacy name field for backward compatibility
  if (firstName && lastName) {
    updates.name = `${firstName} ${lastName}`
  } else if (firstName) {
    // If only firstName is provided, keep existing lastName
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUser.id))
      .get()
    if (existingUser?.lastName) {
      updates.name = `${firstName} ${existingUser.lastName}`
    }
  } else if (lastName) {
    // If only lastName is provided, keep existing firstName
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUser.id))
      .get()
    if (existingUser?.firstName) {
      updates.name = `${existingUser.firstName} ${lastName}`
    }
  }

  // Handle email change if provided
  if (email) {
    const normalizedEmail = email.toLowerCase()

    // Check if email is different from current
    if (normalizedEmail !== currentUser.email.toLowerCase()) {
      // Check if email is already taken by another user
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .get()

      if (existingUser) {
        throw createError({
          statusCode: 400,
          message: 'This email address is already in use'
        })
      }

      // Generate verification token for the new email
      const verificationToken = generateRandomToken()
      const hashedToken = hashToken(verificationToken)

      updates.pendingEmail = normalizedEmail
      updates.pendingEmailToken = hashedToken
      updates.pendingEmailTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      pendingEmailChange = { email: normalizedEmail, token: verificationToken }
    }
  }

  // Update password if provided
  if (newPassword) {
    if (!currentPassword) {
      throw createError({
        statusCode: 400,
        message: 'Current password is required to set a new password'
      })
    }

    // Get current user with password hash
    const userWithPassword = await db
      .select()
      .from(users)
      .where(eq(users.id, currentUser.id))
      .get()

    if (!userWithPassword) {
      throw createError({
        statusCode: 404,
        message: 'User not found'
      })
    }

    // Verify current password
    const bcrypt = await import('bcryptjs')
    const isValid = await bcrypt.compare(
      currentPassword,
      userWithPassword.passwordHash
    )

    if (!isValid) {
      throw createError({
        statusCode: 401,
        message: 'Current password is incorrect'
      })
    }

    // Hash new password
    updates.passwordHash = await hashUserPassword(newPassword)
  }

  // Update user
  const updatedUser = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, currentUser.id))
    .returning()
    .get()

  // Send verification email if email change was requested
  if (pendingEmailChange) {
    await sendEmailChangeVerification(pendingEmailChange.email, pendingEmailChange.token)
  }

  // Return user without password hash
  const { passwordHash: _passwordHash, ...userWithoutPassword } = updatedUser

  const response = {
    success: true as const,
    user: userWithoutPassword,
    message: pendingEmailChange
      ? 'A verification email has been sent to your new email address'
      : 'Profile updated successfully'
  }
  return ProfileUpdateResponseSchema.parse(response)
})
