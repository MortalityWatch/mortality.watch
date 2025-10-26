import { z } from 'zod'
import { db, users } from '#db'
import { eq } from 'drizzle-orm'
import {
  hashPassword,
  generateToken,
  setAuthToken,
  generateRandomToken
} from '../../utils/auth'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long')
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

  const { email, password, firstName, lastName } = result.data

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

  // Create full name for legacy compatibility
  const fullName = `${firstName} ${lastName}`

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
      verificationTokenExpires
    })
    .returning()
    .get()

  // Generate JWT token
  const token = generateToken({
    userId: newUser.id,
    email: newUser.email,
    tier: newUser.tier,
    role: newUser.role
  })

  // Set cookie
  setAuthToken(event, token)

  // Return user without password hash
  const { passwordHash: _passwordHash, ...userWithoutPassword } = newUser

  return {
    success: true,
    user: userWithoutPassword,
    message: 'Account created successfully'
  }
})
