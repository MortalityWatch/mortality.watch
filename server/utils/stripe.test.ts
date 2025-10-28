import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Stripe Utilities', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('mapStripeStatus', () => {
    it('should map active status', async () => {
      const { mapStripeStatus } = await import('./stripe')
      expect(mapStripeStatus('active')).toBe('active')
    })

    it('should map canceled status', async () => {
      const { mapStripeStatus } = await import('./stripe')
      expect(mapStripeStatus('canceled')).toBe('canceled')
    })

    it('should map incomplete status', async () => {
      const { mapStripeStatus } = await import('./stripe')
      expect(mapStripeStatus('incomplete')).toBe('incomplete')
    })

    it('should map incomplete_expired to inactive', async () => {
      const { mapStripeStatus } = await import('./stripe')
      expect(mapStripeStatus('incomplete_expired')).toBe('inactive')
    })

    it('should map past_due status', async () => {
      const { mapStripeStatus } = await import('./stripe')
      expect(mapStripeStatus('past_due')).toBe('past_due')
    })

    it('should map trialing status', async () => {
      const { mapStripeStatus } = await import('./stripe')
      expect(mapStripeStatus('trialing')).toBe('trialing')
    })

    it('should map unpaid status', async () => {
      const { mapStripeStatus } = await import('./stripe')
      expect(mapStripeStatus('unpaid')).toBe('unpaid')
    })

    it('should map paused to inactive', async () => {
      const { mapStripeStatus } = await import('./stripe')
      expect(mapStripeStatus('paused')).toBe('inactive')
    })

    it('should default to inactive for unknown status', async () => {
      const { mapStripeStatus } = await import('./stripe')
      // @ts-expect-error - testing unknown status
      expect(mapStripeStatus('unknown_status')).toBe('inactive')
    })
  })

  describe('getStripe', () => {
    it('should throw error when STRIPE_SECRET_KEY is not set', async () => {
      delete process.env.STRIPE_SECRET_KEY

      const { getStripe } = await import('./stripe')

      expect(() => getStripe()).toThrow('STRIPE_SECRET_KEY environment variable is required')
    })

    it('should create Stripe instance with correct config', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const { getStripe } = await import('./stripe')
      const stripe = getStripe()

      expect(stripe).toBeDefined()
      // Just verify it's an object with the expected structure
      expect(typeof stripe).toBe('object')
    })

    it('should reuse the same Stripe instance (singleton)', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const { getStripe } = await import('./stripe')
      const stripe1 = getStripe()
      const stripe2 = getStripe()

      expect(stripe1).toBe(stripe2)
    })
  })

  describe('getStripePublishableKey', () => {
    it('should throw error when STRIPE_PUBLISHABLE_KEY is not set', async () => {
      delete process.env.STRIPE_PUBLISHABLE_KEY

      const { getStripePublishableKey } = await import('./stripe')

      expect(() => getStripePublishableKey()).toThrow('STRIPE_PUBLISHABLE_KEY environment variable is required')
    })

    it('should return publishable key when set', async () => {
      process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123'

      const { getStripePublishableKey } = await import('./stripe')

      expect(getStripePublishableKey()).toBe('pk_test_123')
    })
  })

  describe('getStripeWebhookSecret', () => {
    it('should throw error when STRIPE_WEBHOOK_SECRET is not set', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET

      const { getStripeWebhookSecret } = await import('./stripe')

      expect(() => getStripeWebhookSecret()).toThrow('STRIPE_WEBHOOK_SECRET environment variable is required')
    })

    it('should return webhook secret when set', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'

      const { getStripeWebhookSecret } = await import('./stripe')

      expect(getStripeWebhookSecret()).toBe('whsec_test_123')
    })
  })

  describe('STRIPE_PRICE_IDS', () => {
    it('should return empty strings when price IDs are not set', async () => {
      delete process.env.STRIPE_PRICE_MONTHLY
      delete process.env.STRIPE_PRICE_YEARLY

      const { STRIPE_PRICE_IDS } = await import('./stripe')

      expect(STRIPE_PRICE_IDS.monthly).toBe('')
      expect(STRIPE_PRICE_IDS.yearly).toBe('')
    })

    it('should return price IDs when set', async () => {
      process.env.STRIPE_PRICE_MONTHLY = 'price_monthly_123'
      process.env.STRIPE_PRICE_YEARLY = 'price_yearly_123'

      const { STRIPE_PRICE_IDS } = await import('./stripe')

      expect(STRIPE_PRICE_IDS.monthly).toBe('price_monthly_123')
      expect(STRIPE_PRICE_IDS.yearly).toBe('price_yearly_123')
    })
  })
})
