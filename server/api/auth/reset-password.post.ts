import { z } from 'zod'
import { db, users } from '../../../../db'
import { eq } from 'drizzle-orm'
import { hashPassword, generateToken, setAuthToken } from '../../utils/auth'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
})

export default defineEventHandler(async (event) => {
  // Parse and validate request body
  const body = await readBody(event)
  const result = resetPasswordSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.errors[0].message
    })
  }

  const { token, password } = result.data

  // Find user by reset token
  const user = await db
    .select()
    .from(users)
    .where(eq(users.passwordResetToken, token))
    .get()

  if (!user) {
    throw createError({
      statusCode: 400,
      message: 'Invalid or expired reset token'
    })
  }

  // Check if token is expired
  if (
    user.passwordResetTokenExpires
    && user.passwordResetTokenExpires < new Date()
  ) {
    throw createError({
      statusCode: 400,
      message: 'Reset token has expired'
    })
  }

  // Hash new password
  const passwordHash = await hashPassword(password)

  // Update user password and clear reset token
  await db
    .update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetTokenExpires: null
    })
    .where(eq(users.id, user.id))

  // Generate JWT token for automatic sign-in
  const authToken = generateToken({
    userId: user.id,
    email: user.email,
    tier: user.tier,
    role: user.role
  })

  // Set cookie
  setAuthToken(event, authToken)

  return {
    success: true,
    message: 'Password reset successfully'
  }
})
