import { db, users } from '#db'
import { eq, and, gt } from 'drizzle-orm'
import { generateToken, setAuthToken, hashToken } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Verification token is required'
    })
  }

  // Hash the incoming token to compare with stored hash (security: tokens are stored hashed)
  const hashedToken = hashToken(token)

  // Find user with this hashed verification token
  const user = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.verificationToken, hashedToken),
        gt(users.verificationTokenExpires, new Date())
      )
    )
    .get()

  if (!user) {
    throw createError({
      statusCode: 400,
      message: 'Invalid or expired verification token'
    })
  }

  // Check if already verified
  if (user.emailVerified) {
    return {
      success: true,
      message: 'Email already verified',
      alreadyVerified: true
    }
  }

  // Update user to mark email as verified
  await db
    .update(users)
    .set({
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
      updatedAt: new Date()
    })
    .where(eq(users.id, user.id))
    .run()

  // Auto-login: Generate JWT token and set cookie
  const authToken = generateToken({
    userId: user.id,
    email: user.email,
    tier: user.tier,
    role: user.role
  })

  setAuthToken(event, authToken)

  return {
    success: true,
    message: 'Email verified successfully',
    autoLogin: true
  }
})
