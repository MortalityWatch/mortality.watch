import { sql, gte } from 'drizzle-orm'
import { db } from '../../utils/db'
import { users, savedCharts, subscriptions } from '../../../db/schema'
import { requireAdmin } from '../../utils/auth'

/**
 * GET /api/admin/stats
 * Returns dashboard statistics for the admin panel
 */
export default defineEventHandler(async (event) => {
  // Verify admin access (handles auth and role check)
  await requireAdmin(event)

  // Get start of this week (Monday) for filtering
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - daysToMonday)
  weekStart.setHours(0, 0, 0, 0)

  // Run all queries in parallel for efficiency
  const [
    totalUsersResult,
    signupsThisWeekResult,
    proSubscribersResult,
    savedChartsResult
  ] = await Promise.all([
    // Total users
    db.select({ count: sql<number>`count(*)` }).from(users),

    // Signups this week (since Monday)
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.createdAt, weekStart)),

    // Paying subscribers (active Stripe subscription only)
    db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(
        sql`${subscriptions.status} = 'active' AND ${subscriptions.stripeSubscriptionId} IS NOT NULL`
      ),

    // Saved charts count
    db.select({ count: sql<number>`count(*)` }).from(savedCharts)
  ])

  return {
    totalUsers: totalUsersResult[0]?.count || 0,
    signupsThisWeek: signupsThisWeekResult[0]?.count || 0,
    proSubscribers: proSubscribersResult[0]?.count || 0,
    savedCharts: savedChartsResult[0]?.count || 0
  }
})
