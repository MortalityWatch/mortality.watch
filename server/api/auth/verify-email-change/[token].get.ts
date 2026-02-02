import { db, users } from '#db'
import { eq, and, gt, or, ne } from 'drizzle-orm'
import { generateToken, setAuthToken, hashToken } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    throw createError({
      statusCode: 400,
      message: 'Verification token is required'
    })
  }

  // Hash the incoming token to compare with stored hash
  const hashedToken = hashToken(token)

  // Find user with this hashed pending email token
  const user = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.pendingEmailToken, hashedToken),
        gt(users.pendingEmailTokenExpires, new Date())
      )
    )
    .get()

  if (!user || !user.pendingEmail) {
    throw createError({
      statusCode: 400,
      message: 'Invalid or expired verification token'
    })
  }

  // Check if the new email is still available (race condition protection)
  // Check both primary email and pending email of other users
  const existingUser = await db
    .select()
    .from(users)
    .where(
      and(
        or(
          eq(users.email, user.pendingEmail),
          eq(users.pendingEmail, user.pendingEmail)
        ),
        ne(users.id, user.id)
      )
    )
    .get()

  if (existingUser) {
    // Clear the pending email since it's no longer available
    await db
      .update(users)
      .set({
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailTokenExpires: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id))
      .run()

    throw createError({
      statusCode: 400,
      message: 'This email address is no longer available'
    })
  }

  // Update user email and clear pending fields
  await db
    .update(users)
    .set({
      email: user.pendingEmail,
      emailVerified: true,
      pendingEmail: null,
      pendingEmailToken: null,
      pendingEmailTokenExpires: null,
      updatedAt: new Date()
    })
    .where(eq(users.id, user.id))
    .run()

  // Generate new JWT with updated email
  const authToken = generateToken({
    userId: user.id,
    email: user.pendingEmail,
    tier: user.tier,
    role: user.role
  })

  setAuthToken(event, authToken)

  return {
    success: true,
    message: 'Email address updated successfully'
  }
})
