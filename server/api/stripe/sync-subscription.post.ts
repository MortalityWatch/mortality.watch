import { requireAuth } from '../../utils/auth'
import { getStripe } from '../../utils/stripe'
import { db, subscriptions } from '#db'
import { eq } from 'drizzle-orm'

/**
 * Manually sync subscription from Stripe
 * Useful for debugging or when webhook events are missed
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  try {
    // Get subscription from database
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .get()

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw createError({
        statusCode: 404,
        message: 'No subscription found'
      })
    }

    // Fetch latest data from Stripe
    const stripe = getStripe()
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    )

    // Access with snake_case as Stripe returns
    const sub = stripeSubscription as unknown as {
      id: string
      status: string
      cancel_at_period_end: boolean
      cancel_at: number | null
      canceled_at: number | null
      current_period_end: number
    }

    // Check if subscription is scheduled to cancel
    // Either via cancel_at_period_end flag OR cancel_at timestamp
    const isCanceling = sub.cancel_at_period_end || (sub.cancel_at && sub.status === 'active')

    // Update database with latest Stripe data
    await db
      .update(subscriptions)
      .set({
        status: sub.status as 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'trialing' | 'inactive',
        cancelAtPeriodEnd: isCanceling || false,
        canceledAt: sub.canceled_at
          ? new Date(sub.canceled_at * 1000)
          : null,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.userId, user.id))

    return {
      success: true,
      message: 'Subscription synced successfully',
      subscription: {
        status: sub.status,
        cancelAtPeriodEnd: isCanceling,
        cancel_at: sub.cancel_at,
        cancel_at_period_end: sub.cancel_at_period_end
      }
    }
  } catch (error) {
    console.error('Error syncing subscription:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to sync subscription'
    })
  }
})
