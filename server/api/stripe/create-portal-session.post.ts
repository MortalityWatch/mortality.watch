import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { getStripe } from '../../utils/stripe'
import { db, subscriptions } from '#db'
import { eq } from 'drizzle-orm'
import { PortalSessionResponseSchema } from '../../schemas'

const requestSchema = z.object({
  returnUrl: z.string().url()
})

export default defineEventHandler(async (event) => {
  // Require authentication
  const user = await requireAuth(event)

  // Parse request body
  const body = await readBody(event)
  const result = requestSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request body',
      data: result.error.issues
    })
  }

  const { returnUrl } = result.data

  try {
    // Get user's subscription to find their Stripe customer ID
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .get()

    if (!subscription?.stripeCustomerId) {
      throw createError({
        statusCode: 404,
        message: 'No active subscription found'
      })
    }

    const stripe = getStripe()

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl
    })

    const response = {
      url: session.url
    }
    return PortalSessionResponseSchema.parse(response)
  } catch (error) {
    logger.error('Error creating portal session:', error instanceof Error ? error : new Error(String(error)))

    // Re-throw if it's already an H3 error
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to create portal session'
    })
  }
})
