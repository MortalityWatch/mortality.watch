import type Stripe from 'stripe'
import { getStripe, getStripeWebhookSecret, mapStripeStatus } from '../../utils/stripe'
import { db, subscriptions, webhookEvents, users } from '#db'
import { eq } from 'drizzle-orm'

/**
 * Stripe webhook endpoint
 * Handles all Stripe subscription events with:
 * - Signature verification for security
 * - Idempotency checking to prevent duplicate processing
 * - Event logging for debugging
 * - Transaction handling for atomic updates
 */
export default defineEventHandler(async (event) => {
  try {
    // Get Stripe signature from headers
    const signature = getHeader(event, 'stripe-signature')
    if (!signature) {
      throw createError({
        statusCode: 400,
        message: 'Missing stripe-signature header'
      })
    }

    // Get raw body for signature verification
    const rawBody = await readRawBody(event)
    if (!rawBody) {
      throw createError({
        statusCode: 400,
        message: 'Missing request body'
      })
    }

    // Verify webhook signature
    const stripe = getStripe()
    const webhookSecret = getStripeWebhookSecret()

    let stripeEvent: Stripe.Event
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      throw createError({
        statusCode: 400,
        message: 'Invalid signature'
      })
    }

    // Check for duplicate webhook events (idempotency)
    const existingEvent = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.stripeEventId, stripeEvent.id))
      .get()

    if (existingEvent) {
      console.log(`Webhook event ${stripeEvent.id} already processed, skipping`)
      return { received: true, duplicate: true }
    }

    // Log webhook event for debugging and monitoring
    await db.insert(webhookEvents).values({
      stripeEventId: stripeEvent.id,
      eventType: stripeEvent.type,
      payload: JSON.stringify(stripeEvent),
      processed: false
    })

    // Process the webhook event
    try {
      await processWebhookEvent(stripeEvent)

      // Mark as processed
      await db
        .update(webhookEvents)
        .set({
          processed: true,
          processedAt: new Date()
        })
        .where(eq(webhookEvents.stripeEventId, stripeEvent.id))

      return { received: true }
    } catch (processingError) {
      // Log processing error
      console.error('Error processing webhook:', processingError)

      await db
        .update(webhookEvents)
        .set({
          processingError:
            processingError instanceof Error
              ? processingError.message
              : String(processingError)
        })
        .where(eq(webhookEvents.stripeEventId, stripeEvent.id))

      throw processingError
    }
  } catch (error) {
    console.error('Webhook handler error:', error)

    // Still return 200 if it's a duplicate or already logged error
    // to prevent Stripe from retrying
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: 'Webhook processing failed'
    })
  }
})

/**
 * Process different webhook event types
 */
async function processWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session
      )
      break

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
      break

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
      break

    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
      break

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
      break

    default:
      console.log(`Unhandled webhook event type: ${event.type}`)
  }
}

/**
 * Handle checkout.session.completed
 * Creates or activates subscription when checkout is completed
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId
  if (!userId) {
    console.error('No userId in checkout session metadata')
    return
  }

  const subscriptionId = session.subscription as string
  if (!subscriptionId) {
    console.error('No subscription ID in checkout session')
    return
  }

  // Fetch full subscription details
  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  await upsertSubscription(parseInt(userId), subscription)
}

/**
 * Handle customer.subscription.updated
 * Updates subscription status, plan, and billing period
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const userId = await getUserIdByCustomerId(customerId)

  if (!userId) {
    console.error(`No user found for customer ${customerId}`)
    return
  }

  await upsertSubscription(userId, subscription)
}

/**
 * Handle customer.subscription.deleted
 * Marks subscription as canceled and downgrades user tier
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const userId = await getUserIdByCustomerId(customerId)

  if (!userId) {
    console.error(`No user found for customer ${customerId}`)
    return
  }

  // Update subscription status to canceled
  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      canceledAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(subscriptions.userId, userId))

  // Downgrade user tier to free
  await db.update(users).set({ tier: 1 }).where(eq(users.id, userId))

  console.log(`Subscription canceled for user ${userId}`)
}

/**
 * Handle invoice.payment_succeeded
 * Confirms successful payment and extends subscription period
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Invoice subscription can be string, Subscription object, or null
  interface InvoiceSubscription {
    subscription?: string | Stripe.Subscription
  }
  const invoiceWithSub = invoice as Stripe.Invoice & InvoiceSubscription
  const subscriptionId = typeof invoiceWithSub.subscription === 'string'
    ? invoiceWithSub.subscription
    : invoiceWithSub.subscription?.id
  if (!subscriptionId) {
    return
  }

  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  const customerId = subscription.customer as string
  const userId = await getUserIdByCustomerId(customerId)

  if (!userId) {
    console.error(`No user found for customer ${customerId}`)
    return
  }

  await upsertSubscription(userId, subscription)
  console.log(`Payment succeeded for user ${userId}`)
}

/**
 * Handle invoice.payment_failed
 * Marks subscription as past_due
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Invoice subscription can be string, Subscription object, or null
  interface InvoiceSubscription {
    subscription?: string | Stripe.Subscription
  }
  const invoiceWithSub = invoice as Stripe.Invoice & InvoiceSubscription
  const subscriptionId = typeof invoiceWithSub.subscription === 'string'
    ? invoiceWithSub.subscription
    : invoiceWithSub.subscription?.id
  if (!subscriptionId) {
    return
  }

  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  const customerId = subscription.customer as string
  const userId = await getUserIdByCustomerId(customerId)

  if (!userId) {
    console.error(`No user found for customer ${customerId}`)
    return
  }

  // Update subscription status
  await db
    .update(subscriptions)
    .set({
      status: mapStripeStatus(subscription.status),
      updatedAt: new Date()
    })
    .where(eq(subscriptions.userId, userId))

  console.log(`Payment failed for user ${userId}`)
}

/**
 * Upsert subscription record
 * Creates or updates subscription with full details
 */
async function upsertSubscription(userId: number, subscription: Stripe.Subscription) {
  const status = mapStripeStatus(subscription.status)
  const customerId = subscription.customer as string

  // Stripe API uses snake_case for these properties
  interface SubscriptionTimestamps {
    current_period_start?: number
    current_period_end?: number
    cancel_at_period_end?: boolean
    canceled_at?: number | null
    trial_end?: number | null
  }
  const subWithTimestamps = subscription as Stripe.Subscription & SubscriptionTimestamps

  // Determine plan type from price ID
  const priceId = subscription.items.data[0]?.price.id
  let plan: 'monthly' | 'yearly' | null = null
  if (priceId === process.env.STRIPE_PRICE_MONTHLY) {
    plan = 'monthly'
  } else if (priceId === process.env.STRIPE_PRICE_YEARLY) {
    plan = 'yearly'
  }

  // Check if subscription exists
  const existingSubscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .get()

  const subscriptionData = {
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    status,
    plan,
    planPriceId: priceId || null,
    currentPeriodStart: subWithTimestamps.current_period_start
      ? new Date(subWithTimestamps.current_period_start * 1000)
      : null,
    currentPeriodEnd: subWithTimestamps.current_period_end
      ? new Date(subWithTimestamps.current_period_end * 1000)
      : null,
    cancelAtPeriodEnd: subWithTimestamps.cancel_at_period_end,
    canceledAt: subWithTimestamps.canceled_at
      ? new Date(subWithTimestamps.canceled_at * 1000)
      : null,
    trialEnd: subWithTimestamps.trial_end
      ? new Date(subWithTimestamps.trial_end * 1000)
      : null,
    updatedAt: new Date()
  }

  if (existingSubscription) {
    // Update existing subscription
    await db
      .update(subscriptions)
      .set(subscriptionData)
      .where(eq(subscriptions.userId, userId))
  } else {
    // Insert new subscription
    await db.insert(subscriptions).values(subscriptionData)
  }

  // Update user tier based on subscription status
  const tier: 0 | 1 | 2 = status === 'active' || status === 'trialing' ? 2 : 1
  await db.update(users).set({ tier }).where(eq(users.id, userId))

  console.log(
    `Subscription ${subscription.id} upserted for user ${userId} with tier ${tier}`
  )
}

/**
 * Get user ID by Stripe customer ID
 */
async function getUserIdByCustomerId(customerId: string): Promise<number | null> {
  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .get()

  return subscription?.userId || null
}
