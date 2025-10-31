import { z } from 'zod'
import { db, users } from '#db'
import { eq } from 'drizzle-orm'
import { generateRandomToken } from '../../utils/auth'
import { sendVerificationEmail } from '../../utils/email'

const resendSchema = z.object({
  email: z.string().email('Invalid email address')
})

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
