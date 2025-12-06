import { db, users, savedCharts, subscriptions, sessions, charts } from '#db'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'

/**
 * GDPR Article 15: Right to data portability
 * Export all user data in a machine-readable format (JSON)
 */
export default defineEventHandler(async (event) => {
  // Require authentication
  const currentUser = await requireAuth(event)

  // Fetch user profile data
  const userProfile = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      displayName: users.displayName,
      name: users.name,
      role: users.role,
      tier: users.tier,
      emailVerified: users.emailVerified,
      tosAcceptedAt: users.tosAcceptedAt,
      lastLogin: users.lastLogin,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    })
    .from(users)
    .where(eq(users.id, currentUser.id))
    .get()

  // Fetch saved charts with their configs
  const userCharts = await db
    .select({
      id: savedCharts.id,
      chartId: savedCharts.chartId,
      name: savedCharts.name,
      description: savedCharts.description,
      thumbnailUrl: savedCharts.thumbnailUrl,
      isFeatured: savedCharts.isFeatured,
      isPublic: savedCharts.isPublic,
      slug: savedCharts.slug,
      viewCount: savedCharts.viewCount,
      createdAt: savedCharts.createdAt,
      updatedAt: savedCharts.updatedAt,
      chart: {
        config: charts.config,
        page: charts.page
      }
    })
    .from(savedCharts)
    .leftJoin(charts, eq(savedCharts.chartId, charts.id))
    .where(eq(savedCharts.userId, currentUser.id))
    .all()

  // Fetch subscription history
  const subscription = await db
    .select({
      id: subscriptions.id,
      stripeCustomerId: subscriptions.stripeCustomerId,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      status: subscriptions.status,
      plan: subscriptions.plan,
      planPriceId: subscriptions.planPriceId,
      currentPeriodStart: subscriptions.currentPeriodStart,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      canceledAt: subscriptions.canceledAt,
      trialEnd: subscriptions.trialEnd,
      createdAt: subscriptions.createdAt,
      updatedAt: subscriptions.updatedAt
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, currentUser.id))
    .get()

  // Fetch active sessions
  const userSessions = await db
    .select({
      id: sessions.id,
      expiresAt: sessions.expiresAt,
      createdAt: sessions.createdAt
    })
    .from(sessions)
    .where(eq(sessions.userId, currentUser.id))
    .all()

  // Compile all data into export format
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      dataVersion: '2.0', // Updated version for new schema
      userId: currentUser.id,
      exportType: 'GDPR Article 15 - Right to Data Portability'
    },
    profile: userProfile,
    savedCharts: userCharts.map(chart => ({
      id: chart.id,
      chartId: chart.chartId,
      name: chart.name,
      description: chart.description,
      chartType: chart.chart?.page || 'explorer',
      chartConfig: chart.chart?.config || '',
      thumbnailUrl: chart.thumbnailUrl,
      isFeatured: chart.isFeatured,
      isPublic: chart.isPublic,
      slug: chart.slug,
      viewCount: chart.viewCount,
      createdAt: chart.createdAt,
      updatedAt: chart.updatedAt
    })),
    subscription: subscription || null,
    sessions: userSessions,
    summary: {
      totalCharts: userCharts.length,
      totalSessions: userSessions.length,
      accountAge: userProfile?.createdAt
        ? Math.floor(
            (Date.now() - new Date(userProfile.createdAt).getTime())
            / (1000 * 60 * 60 * 24)
          )
        : 0
    }
  }

  // Set headers for JSON download
  setHeader(event, 'Content-Type', 'application/json')
  setHeader(
    event,
    'Content-Disposition',
    `attachment; filename="mortality-watch-data-export-${currentUser.id}-${Date.now()}.json"`
  )

  return exportData
})
