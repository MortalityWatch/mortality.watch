import { z } from 'zod'
import { db, users } from '#db'
import { eq } from 'drizzle-orm'
import { generateRandomToken } from '../../utils/auth'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

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

  // Find user by email
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
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
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Update user with reset token
  await db
    .update(users)
    .set({
      passwordResetToken: resetToken,
      passwordResetTokenExpires: resetTokenExpires
    })
    .where(eq(users.id, user.id))

  // TODO: Send password reset email
  // For now, we'll just log the token (remove this in production)
  console.log(`Password reset token for ${email}: ${resetToken}`)

  return {
    success: true,
    message: 'If an account exists, a password reset email will be sent',
    // TODO: Remove this in production - only for testing
    ...(process.env.NODE_ENV === 'development' && { resetToken })
  }
})
