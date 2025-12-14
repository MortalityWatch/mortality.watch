import { sql, eq, gte } from 'drizzle-orm'
import { db } from '../../utils/db'
import { users, savedCharts, subscriptions } from '../../../db/schema'

/**
 * GET /api/admin/stats
 * Returns dashboard statistics for the admin panel
 */
export default defineEventHandler(async (event) => {
  // Verify admin access
  const user = event.context.user
  if (!user || user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Admin access required'
    })
  }

  // Get today's date at midnight for filtering
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTimestamp = Math.floor(today.getTime() / 1000)

  // Run all queries in parallel for efficiency
  const [
    totalUsersResult,
    signupsTodayResult,
    proSubscribersResult,
    savedChartsResult
  ] = await Promise.all([
    // Total users
    db.select({ count: sql<number>`count(*)` }).from(users),

    // Signups today (createdAt is stored as unix timestamp)
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.createdAt, new Date(todayTimestamp * 1000))),

    // Pro subscribers (tier 2 OR active subscription)
    db
      .select({ count: sql<number>`count(distinct ${users.id})` })
      .from(users)
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .where(
        sql`${users.tier} = 2 OR ${subscriptions.status} = 'active'`
      ),

    // Saved charts count
    db.select({ count: sql<number>`count(*)` }).from(savedCharts)
  ])

  return {
    totalUsers: totalUsersResult[0]?.count || 0,
    signupsToday: signupsTodayResult[0]?.count || 0,
    proSubscribers: proSubscribersResult[0]?.count || 0,
    savedCharts: savedChartsResult[0]?.count || 0
  }
})
