import { z } from 'zod'
import { requireAuth } from '../../utils/auth'
import { getStripe, STRIPE_PRICE_IDS } from '../../utils/stripe'
import { db, subscriptions } from '#db'
import { eq } from 'drizzle-orm'
import { CheckoutSessionResponseSchema } from '../../schemas'

const requestSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
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

  const { plan, successUrl, cancelUrl } = result.data

  // Get price ID based on plan
  const priceId = STRIPE_PRICE_IDS[plan]
  if (!priceId) {
    throw createError({
      statusCode: 500,
      message: `Price ID not configured for ${plan} plan`
    })
  }

  try {
    const stripe = getStripe()

    // Check if user already has a subscription
    const existingSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .get()

    let customerId = existingSubscription?.stripeCustomerId || undefined

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id.toString()
        }
      })
      customerId = customer.id
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        userId: user.id.toString(),
        plan
      }
    })

    const response = {
      sessionId: session.id,
      url: session.url
    }
    return CheckoutSessionResponseSchema.parse(response)
  } catch (error) {
    logger.error('Error creating checkout session:', error instanceof Error ? error : new Error(String(error)))
    throw createError({
      statusCode: 500,
      message: 'Failed to create checkout session'
    })
  }
})
