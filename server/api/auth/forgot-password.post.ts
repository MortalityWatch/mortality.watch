import { z } from 'zod'
import { db, users } from '#db'
import { eq } from 'drizzle-orm'
import { generateRandomToken, hashToken } from '../../utils/auth'
import { sendPasswordResetEmail } from '../../utils/email'
import { RequestThrottle } from '../../utils/requestQueue'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

// Rate limiting: 3 attempts per hour per email
const forgotPasswordRateLimit = new RequestThrottle(
  60 * 60 * 1000, // 1 hour
  3 // 3 attempts
)

export default defineEventHandler(async (event) => {
  // Parse and validate request body
  const body = await readBody(event)
  const result = forgotPasswordSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]!.message
    })
  }

  const { email } = result.data
  const normalizedEmail = email.toLowerCase()

  // Rate limit by email address to prevent spam
  if (!forgotPasswordRateLimit.check(normalizedEmail)) {
    const retryAfter = forgotPasswordRateLimit.getSecondsUntilReset(normalizedEmail)
    setResponseHeader(event, 'Retry-After', retryAfter)
    logger.warn(`Rate limit exceeded for forgot-password: ${normalizedEmail.substring(0, 3)}***`)
    throw createError({
      statusCode: 429,
      message: 'Too many password reset requests. Please try again later.'
    })
  }

  // Find user by email
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .get()

  // Always return success to avoid email enumeration
  // Even if user doesn't exist, we return success
  if (!user) {
    return {
      success: true,
      message: 'If an account exists, a password reset email will be sent'
    }
  }

  // Generate password reset token
  const resetToken = generateRandomToken()
  const hashedResetToken = hashToken(resetToken)
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Update user with hashed reset token (security: store hash, not plain token)
  await db
    .update(users)
    .set({
      passwordResetToken: hashedResetToken,
      passwordResetTokenExpires: resetTokenExpires
    })
    .where(eq(users.id, user.id))

  // Send password reset email with unhashed token (don't await - send in background)
  sendPasswordResetEmail(user.email, resetToken).catch((error) => {
    logger.error('Failed to send password reset email:', error instanceof Error ? error : new Error(String(error)))
    // Don't throw error - we don't want to reveal if user exists
  })

  return {
    success: true,
    message: 'If an account exists, a password reset email will be sent'
  }
})
