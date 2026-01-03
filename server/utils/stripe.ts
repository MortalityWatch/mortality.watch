import Stripe from 'stripe'

/**
 * Get Stripe instance
 * Singleton pattern to reuse the same Stripe instance
 */
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required')
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true
    })
  }

  return stripeInstance
}

/**
 * Get Stripe publishable key
 */
export function getStripePublishableKey(): string {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw new Error('STRIPE_PUBLISHABLE_KEY environment variable is required')
  }

  return publishableKey
}

/**
 * Get Stripe webhook secret
 */
export function getStripeWebhookSecret(): string {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required')
  }

  return webhookSecret
}

/**
 * Price IDs for subscription plans
 * These should match the price IDs created in Stripe Dashboard
 */
export const STRIPE_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || '',
  yearly: process.env.STRIPE_PRICE_YEARLY || ''
} as const

/**
 * Map Stripe subscription status to our internal status
 */
export function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'trialing' | 'inactive' {
  const statusMap: Record<Stripe.Subscription.Status, 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'trialing' | 'inactive'> = {
    active: 'active',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'inactive',
    past_due: 'past_due',
    trialing: 'trialing',
    unpaid: 'unpaid',
    paused: 'inactive'
  }

  return statusMap[stripeStatus] || 'inactive'
}
