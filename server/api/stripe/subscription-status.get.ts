import { requireAuth } from '../../utils/auth'
import { db, subscriptions } from '#db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Require authentication
  const user = await requireAuth(event)

  try {
    // Get user's subscription
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .get()

    if (!subscription) {
      return {
        hasSubscription: false,
        subscription: null,
        tier: user.tier
      }
    }

    // Check if subscription is active or trialing
    const isActive
      = subscription.status === 'active' || subscription.status === 'trialing'

    // Calculate days remaining if active
    let daysRemaining: number | null = null
    if (isActive && subscription.currentPeriodEnd) {
      const now = new Date()
      const endDate = new Date(subscription.currentPeriodEnd)
      daysRemaining = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
    }

    return {
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan,
        isActive,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        daysRemaining,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
        trialEnd: subscription.trialEnd
      },
      tier: user.tier
    }
  } catch (error) {
    logger.error('Error fetching subscription status:', error instanceof Error ? error : new Error(String(error)))
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch subscription status'
    })
  }
})
