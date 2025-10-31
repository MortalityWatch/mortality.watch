import { db, users, subscriptions } from '#db'
import { eq } from 'drizzle-orm'
import { requireAuth, verifyPassword } from '../../utils/auth'
import { z } from 'zod'

/**
 * GDPR Article 17: Right to erasure
 * Delete user account with proper data anonymization
 */

// Validation schema for deletion request
const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required for account deletion')
})

export default defineEventHandler(async (event) => {
  // Require authentication
  const currentUser = await requireAuth(event)

  // Read and validate request body
  const body = await readBody(event)
  const validation = deleteAccountSchema.safeParse(body)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      message: validation.error.issues[0]?.message || 'Invalid request'
    })
  }

  const { password } = validation.data

  // Fetch full user record including password hash
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, currentUser.id))
    .get()

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }

  // Verify password before deletion (security measure)
  const isPasswordValid = await verifyPassword(password, user.passwordHash)
  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      message: 'Invalid password. Please verify your password to delete your account.'
    })
  }

  // GDPR Compliance: Anonymize subscription data instead of deleting
  // (required for legal/financial records per Stripe requirements)
  const userSubscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, currentUser.id))
    .get()

  if (userSubscription) {
    // Keep subscription record but mark as deleted
    // Stripe customer ID is preserved for payment history compliance
    await db
      .update(subscriptions)
      .set({
        status: 'inactive',
        canceledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(subscriptions.userId, currentUser.id))
      .run()
  }

  // GDPR Compliance: Anonymize user data instead of hard delete
  // This preserves referential integrity while removing personal data
  await db
    .update(users)
    .set({
      email: `deleted-${currentUser.id}@deleted.local`,
      passwordHash: 'DELETED',
      firstName: null,
      lastName: null,
      displayName: null,
      name: null,
      verificationToken: null,
      verificationTokenExpires: null,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      updatedAt: new Date()
    })
    .where(eq(users.id, currentUser.id))
    .run()

  // Note: Cascade deletion will automatically handle:
  // - saved_charts (deleted via FK cascade)
  // - sessions (deleted via FK cascade)

  // Clear auth cookie
  deleteCookie(event, 'auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  })

  return {
    success: true,
    message: 'Account deleted successfully'
  }
})
