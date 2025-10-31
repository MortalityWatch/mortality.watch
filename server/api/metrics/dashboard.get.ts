import { db, users, subscriptions, savedCharts } from '#db'
import { sql, eq, and, gte, ne } from 'drizzle-orm'
import { requireAdmin } from '../../utils/auth'

/**
 * Admin API: Get business metrics dashboard data
 * GET /api/metrics/dashboard
 *
 * Requires admin authentication
 *
 * Returns:
 * - Total users by tier (Public/Free/Pro)
 * - User registrations over time (last 30 days)
 * - MRR (Monthly Recurring Revenue)
 * - ARR (Annual Recurring Revenue)
 * - Conversion rates (Free → Pro)
 * - Churn rate
 * - Feature usage statistics
 */
export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  try {
    // Get current timestamp (Date objects for Drizzle timestamp comparison)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))

    // 1. Total users by tier
    const usersByTier = await db
      .select({
        tier: users.tier,
        count: sql<number>`count(*)`.as('count')
      })
      .from(users)
      .groupBy(users.tier)
      .all()

    const tierCounts = {
      free: usersByTier.find(u => u.tier === 1)?.count || 0,
      pro: usersByTier.find(u => u.tier === 2)?.count || 0
    }

    // 2. User registrations over time (last 30 days, grouped by day)
    const registrations = await db
      .select({
        date: sql<number>`date(created_at, 'unixepoch')`.as('date'),
        count: sql<number>`count(*)`.as('count')
      })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo))
      .groupBy(sql`date(created_at, 'unixepoch')`)
      .orderBy(sql`date(created_at, 'unixepoch')`)
      .all()

    // 3. Recent signups (last 7 days)
    const recentSignups = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(users)
      .where(gte(users.createdAt, sevenDaysAgo))
      .get()

    // 4. Active subscriptions (for MRR/ARR calculation)
    const activeSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          ne(subscriptions.cancelAtPeriodEnd, true)
        )
      )
      .all()

    // Calculate MRR and ARR
    // Monthly: $9.99, Yearly: $99
    const monthlyPrice = 9.99
    const yearlyPrice = 99

    const monthlySubscribers = activeSubscriptions.filter(s => s.plan === 'monthly').length
    const yearlySubscribers = activeSubscriptions.filter(s => s.plan === 'yearly').length

    const mrr = (monthlySubscribers * monthlyPrice) + (yearlySubscribers * (yearlyPrice / 12))
    const arr = mrr * 12

    // 5. Canceled subscriptions (for churn calculation)
    const canceledSubscriptions = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          eq(subscriptions.cancelAtPeriodEnd, true)
        )
      )
      .get()

    const churnedCount = canceledSubscriptions?.count || 0
    const totalActiveSubscriptions = activeSubscriptions.length
    const churnRate = totalActiveSubscriptions > 0
      ? (churnedCount / totalActiveSubscriptions) * 100
      : 0

    // 6. Conversion rate (Free → Pro)
    const totalFreeUsers = tierCounts.free
    const totalProUsers = tierCounts.pro
    const conversionRate = totalFreeUsers > 0
      ? (totalProUsers / (totalFreeUsers + totalProUsers)) * 100
      : 0

    // 7. Feature usage statistics
    const totalCharts = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(savedCharts)
      .get()

    const publicCharts = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(savedCharts)
      .where(eq(savedCharts.isPublic, true))
      .get()

    const featuredCharts = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(savedCharts)
      .where(eq(savedCharts.isFeatured, true))
      .get()

    // Charts created in last 30 days
    const recentCharts = await db
      .select({ count: sql<number>`count(*)`.as('count') })
      .from(savedCharts)
      .where(gte(savedCharts.createdAt, thirtyDaysAgo))
      .get()

    // Chart views
    const totalViews = await db
      .select({
        totalViews: sql<number>`sum(view_count)`.as('totalViews')
      })
      .from(savedCharts)
      .get()

    // Top charts by views
    const topCharts = await db
      .select({
        id: savedCharts.id,
        name: savedCharts.name,
        viewCount: savedCharts.viewCount,
        isPublic: savedCharts.isPublic,
        isFeatured: savedCharts.isFeatured
      })
      .from(savedCharts)
      .orderBy(sql`view_count DESC`)
      .limit(10)
      .all()

    // 8. User growth metrics
    const allUsers = await db
      .select({
        createdAt: users.createdAt,
        tier: users.tier
      })
      .from(users)
      .orderBy(users.createdAt)
      .all()

    // Calculate cumulative user counts
    let cumulativeFree = 0
    let cumulativePro = 0
    const growthData = allUsers.map((user) => {
      if (user.tier === 1) cumulativeFree++
      if (user.tier === 2) cumulativePro++

      return {
        date: user.createdAt,
        free: cumulativeFree,
        pro: cumulativePro,
        total: cumulativeFree + cumulativePro
      }
    })

    // Return metrics
    return {
      success: true,
      data: {
        users: {
          total: tierCounts.free + tierCounts.pro,
          free: tierCounts.free,
          pro: tierCounts.pro,
          recentSignups: recentSignups?.count || 0
        },
        registrations: registrations.map(r => ({
          date: r.date,
          count: r.count
        })),
        revenue: {
          mrr: Math.round(mrr * 100) / 100,
          arr: Math.round(arr * 100) / 100,
          activeSubscriptions: totalActiveSubscriptions,
          monthlySubscribers,
          yearlySubscribers
        },
        conversion: {
          rate: Math.round(conversionRate * 100) / 100,
          totalFreeUsers,
          totalProUsers
        },
        churn: {
          rate: Math.round(churnRate * 100) / 100,
          churnedCount,
          totalActiveSubscriptions
        },
        features: {
          totalCharts: totalCharts?.count || 0,
          publicCharts: publicCharts?.count || 0,
          featuredCharts: featuredCharts?.count || 0,
          recentCharts: recentCharts?.count || 0,
          totalViews: totalViews?.totalViews || 0,
          topCharts: topCharts.map(c => ({
            id: c.id,
            name: c.name,
            views: c.viewCount,
            isPublic: c.isPublic,
            isFeatured: c.isFeatured
          }))
        },
        growth: growthData.slice(-30) // Last 30 data points for chart
      }
    }
  } catch (err) {
    console.error('Error getting metrics dashboard:', err)
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : 'Failed to get metrics'
    })
  }
})
