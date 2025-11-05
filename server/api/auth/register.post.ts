import { z } from 'zod'
import { db, users } from '#db'
import { eq } from 'drizzle-orm'
import {
  hashPassword,
  generateRandomToken
} from '../../utils/auth'
import { sendVerificationEmail } from '../../utils/email'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
  firstName: z.string().max(50, 'First name is too long').optional().default(''),
  lastName: z.string().max(50, 'Last name is too long').optional().default(''),
  tosAccepted: z.boolean().refine(val => val === true, {
    message: 'You must accept the Terms of Service and Privacy Policy'
  })
})

export default defineEventHandler(async (event) => {
  // Parse and validate request body
  const body = await readBody(event)
  const result = registerSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]!.message
    })
  }

  const { email, password, firstName, lastName, tosAccepted } = result.data

  // Verify TOS acceptance (should already be validated by schema, but double-check for security)
  if (!tosAccepted) {
    throw createError({
      statusCode: 400,
      message: 'You must accept the Terms of Service and Privacy Policy to create an account'
    })
  }

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .get()

  if (existingUser) {
    throw createError({
      statusCode: 400,
      message: 'An account with this email already exists'
    })
  }

  // Hash password
  const passwordHash = await hashPassword(password)

  // Generate verification token (optional - can be used later)
  const verificationToken = generateRandomToken()
  const verificationTokenExpires = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ) // 24 hours

  // Create full name for legacy compatibility (empty if no names provided)
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null

  // Create user with tier 1 (registered, free)
  const newUser = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      name: fullName, // Legacy field for backward compatibility
      role: 'user',
      tier: 1, // Default to tier 1 (registered, free)
      emailVerified: false,
      verificationToken,
      verificationTokenExpires,
      tosAcceptedAt: new Date() // Store TOS acceptance timestamp for legal compliance
    })
    .returning()
    .get()

  // Send verification email - await to ensure it succeeds
  // Note: Auth token is not generated until email is verified
  try {
    await sendVerificationEmail(newUser.email, verificationToken)
  } catch (error) {
    logger.error('Failed to send verification email:', error instanceof Error ? error : new Error(String(error)))
    // User is created but can use resend functionality from check-email page
    // Still return success so they get to check-email page
  }

  // Return user without password hash
  const { passwordHash: _passwordHash, ...userWithoutPassword } = newUser

  return {
    success: true,
    user: userWithoutPassword,
    message: 'Account created successfully. Please check your email to verify your account.',
    requiresVerification: true
  }
})
