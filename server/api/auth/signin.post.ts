import { z } from 'zod'
import { db, users } from '#db'
import { eq } from 'drizzle-orm'
import {
  verifyPassword,
  generateToken,
  setAuthToken
} from '../../utils/auth'

const signinSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  // Parse and validate request body
  const body = await readBody(event)
  const result = signinSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]!.message
    })
  }

  const { email, password, remember = false } = result.data

  // Find user by email
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .get()

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password'
    })
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.passwordHash)

  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password'
    })
  }

  // Check if email is verified
  if (!user.emailVerified) {
    throw createError({
      statusCode: 403,
      message: 'Please verify your email address before signing in. Check your inbox for the verification link.'
    })
  }

  // Update last login
  await db
    .update(users)
    .set({ lastLogin: new Date() })
    .where(eq(users.id, user.id))

  // Generate JWT token with appropriate expiry
  // Remember me: 90 days, otherwise: 7 days
  const expiresIn = remember ? '90d' : '7d'
  const token = generateToken({
    userId: user.id,
    email: user.email,
    tier: user.tier,
    role: user.role
  }, expiresIn)

  // Set cookie with matching maxAge (in seconds)
  const maxAge = remember ? (60 * 60 * 24 * 90) : (60 * 60 * 24 * 7)
  setAuthToken(event, token, maxAge)

  // Return user without password hash
  const { passwordHash: _passwordHash, ...userWithoutPassword } = user

  return {
    success: true,
    user: userWithoutPassword,
    message: 'Signed in successfully'
  }
})
