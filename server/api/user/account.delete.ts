import { db, users } from '#db'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // Require authentication
  const currentUser = await requireAuth(event)

  // Delete user - cascade will handle related records (saved_charts, subscriptions, sessions)
  await db
    .delete(users)
    .where(eq(users.id, currentUser.id))
    .run()

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
