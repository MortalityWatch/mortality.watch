import { z } from 'zod'
import { db, users } from '#db'
import { eq } from 'drizzle-orm'
import { requireAuth, hashPassword } from '../../utils/auth'

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
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
      message: result.error.errors[0].message
    })
  }

  const { name, currentPassword, newPassword } = result.data

  // Prepare update object
  const updates: {
    updatedAt: Date
    name?: string
    passwordHash?: string
  } = {
    updatedAt: new Date()
  }

  // Update name if provided
  if (name) {
    updates.name = name
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
    updates.passwordHash = await hashPassword(newPassword)
  }

  // Update user
  const updatedUser = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, currentUser.id))
    .returning()
    .get()

  // Return user without password hash
  const { passwordHash: _passwordHash, ...userWithoutPassword } = updatedUser

  return {
    success: true,
    user: userWithoutPassword,
    message: 'Profile updated successfully'
  }
})
