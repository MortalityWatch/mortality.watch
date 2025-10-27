import { loadStripe, type Stripe } from '@stripe/stripe-js'

/**
 * Composable for Stripe integration
 * Provides methods to create checkout sessions, manage subscriptions, and check status
 */
export function useStripe() {
  const config = useRuntimeConfig()
  let stripePromise: Promise<Stripe | null> | null = null

  /**
   * Get Stripe instance (singleton)
   */
  const getStripe = () => {
    if (!stripePromise) {
      stripePromise = loadStripe(config.public.stripePublishableKey || '')
    }
    return stripePromise
  }

  /**
   * Create a checkout session and redirect to Stripe Checkout
   */
  const createCheckoutSession = async (
    plan: 'monthly' | 'yearly',
    options?: {
      successUrl?: string
      cancelUrl?: string
    }
  ) => {
    const baseUrl = window.location.origin
    const successUrl = options?.successUrl || `${baseUrl}/account?success=true`
    const cancelUrl = options?.cancelUrl || `${baseUrl}/pricing?canceled=true`

    try {
      const response = await $fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        body: {
          plan,
          successUrl,
          cancelUrl
        }
      })

      // Redirect to Stripe Checkout URL
      if (response.url) {
        window.location.href = response.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw error
    }
  }

  /**
   * Create a customer portal session and redirect to Stripe Portal
   */
  const createPortalSession = async (returnUrl?: string) => {
    const baseUrl = window.location.origin
    const url = returnUrl || `${baseUrl}/account`

    try {
      const response = await $fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        body: {
          returnUrl: url
        }
      })

      // Redirect to Stripe Customer Portal
      window.location.href = response.url
    } catch (error) {
      console.error('Error creating portal session:', error)
      throw error
    }
  }

  /**
   * Get subscription status
   */
  const getSubscriptionStatus = async () => {
    try {
      const response = await $fetch('/api/stripe/subscription-status')
      return response
    } catch (error) {
      console.error('Error fetching subscription status:', error)
      throw error
    }
  }

  /**
   * Subscribe to a plan (creates checkout session and redirects)
   */
  const subscribe = async (plan: 'monthly' | 'yearly') => {
    return createCheckoutSession(plan)
  }

  /**
   * Manage subscription (opens customer portal)
   */
  const manageSubscription = async () => {
    return createPortalSession()
  }

  return {
    getStripe,
    createCheckoutSession,
    createPortalSession,
    getSubscriptionStatus,
    subscribe,
    manageSubscription
  }
}
