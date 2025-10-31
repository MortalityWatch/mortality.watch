import { z } from 'zod'
import { db, users } from '#db'
import { eq } from 'drizzle-orm'
import { generateRandomToken } from '../../utils/auth'
import { sendVerificationEmail } from '../../utils/email'

const resendSchema = z.object({
  email: z.string().email('Invalid email address')
})

// Simple in-memory rate limiter: 3 resends per hour per email
const rateLimitMap = new Map<string, { count: number, resetAt: number }>()
const MAX_RESENDS = 3
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(email)

  if (!record || now > record.resetAt) {
    // Reset or create new record
    rateLimitMap.set(email, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= MAX_RESENDS) {
    return false
  }

  record.count++
  return true
}

export default defineEventHandler(async (event) => {
  // Parse and validate request body
  const body = await readBody(event)
  const result = resendSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]!.message
    })
  }

  const { email } = result.data

  // Check rate limit
  if (!checkRateLimit(email.toLowerCase())) {
    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please try again in an hour.'
    })
  }

  // Find user by email
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .get()

  // Don't reveal if user exists or not (security best practice)
  // Always return success even if user doesn't exist
  if (!user) {
    return {
      success: true,
      message: 'If an account exists with this email, a verification link has been sent'
    }
  }

  // Check if already verified
  if (user.emailVerified) {
    throw createError({
      statusCode: 400,
      message: 'Email is already verified'
    })
  }

  // Generate new verification token
  const verificationToken = generateRandomToken()
  const verificationTokenExpires = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ) // 24 hours

  // Update user with new token
  await db
    .update(users)
    .set({
      verificationToken,
      verificationTokenExpires,
      updatedAt: new Date()
    })
    .where(eq(users.id, user.id))
    .run()

  // Send verification email
  await sendVerificationEmail(user.email, verificationToken)

  return {
    success: true,
    message: 'Verification email sent'
  }
})
