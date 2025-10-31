import { db, users, savedCharts, subscriptions, sessions } from '#db'
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

  // Fetch saved charts
  const charts = await db
    .select({
      id: savedCharts.id,
      name: savedCharts.name,
      description: savedCharts.description,
      chartState: savedCharts.chartState,
      chartType: savedCharts.chartType,
      thumbnailUrl: savedCharts.thumbnailUrl,
      isFeatured: savedCharts.isFeatured,
      isPublic: savedCharts.isPublic,
      slug: savedCharts.slug,
      viewCount: savedCharts.viewCount,
      createdAt: savedCharts.createdAt,
      updatedAt: savedCharts.updatedAt
    })
    .from(savedCharts)
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
      dataVersion: '1.0',
      userId: currentUser.id,
      exportType: 'GDPR Article 15 - Right to Data Portability'
    },
    profile: userProfile,
    savedCharts: charts,
    subscription: subscription || null,
    sessions: userSessions,
    summary: {
      totalCharts: charts.length,
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
