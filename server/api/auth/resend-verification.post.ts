import { db, users } from '#db'
import { eq } from 'drizzle-orm'
import { requireAuth, generateRandomToken } from '../../utils/auth'
import { sendVerificationEmail } from '../../utils/email'

export default defineEventHandler(async (event) => {
  // Require authentication
  const currentUser = await requireAuth(event)

  // Check if already verified
  if (currentUser.emailVerified) {
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
    .where(eq(users.id, currentUser.id))
    .run()

  // Send verification email
  await sendVerificationEmail(currentUser.email, verificationToken)

  return {
    success: true,
    message: 'Verification email sent'
  }
})
