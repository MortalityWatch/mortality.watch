import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type Stripe from 'stripe'
import type { H3Event } from 'h3'

// Type for the webhook handler function
type WebhookHandler = (event: H3Event) => Promise<{ received: boolean, duplicate?: boolean }>

// Type for logger mock
interface LoggerMock {
  info: ReturnType<typeof vi.fn>
  error: ReturnType<typeof vi.fn>
  warn: ReturnType<typeof vi.fn>
  debug: ReturnType<typeof vi.fn>
}

// Mock the stripe utilities
const mockStripe = {
  webhooks: {
    constructEvent: vi.fn()
  },
  subscriptions: {
    retrieve: vi.fn()
  }
}

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn()
}

const mockEq = vi.fn()

vi.mock('../../utils/stripe', () => ({
  getStripe: vi.fn(() => mockStripe),
  getStripeWebhookSecret: vi.fn(() => 'whsec_test_secret'),
  mapStripeStatus: vi.fn((status: string) => status)
}))

vi.mock('#db', () => ({
  db: mockDb,
  subscriptions: { userId: 'userId', stripeCustomerId: 'stripeCustomerId' },
  webhookEvents: { stripeEventId: 'stripeEventId' },
  users: { id: 'id', tier: 'tier' },
  eq: mockEq
}))

// Mock Nuxt/h3 utilities
const mockGetHeader = vi.fn()
const mockReadRawBody = vi.fn()
const mockCreateError = vi.fn(error => error)

// Logger mock
;(global as unknown as { logger: LoggerMock }).logger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
}

vi.stubGlobal('getHeader', mockGetHeader)
vi.stubGlobal('readRawBody', mockReadRawBody)
vi.stubGlobal('createError', mockCreateError)
vi.stubGlobal('defineEventHandler', (handler: WebhookHandler) => handler)

describe('Stripe Webhook Handler', () => {
  let webhookHandler: WebhookHandler

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    // Reset db mock chains
    const selectChain = {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(null)
        })
      })
    }

    const insertChain = {
      values: vi.fn().mockResolvedValue(undefined)
    }

    const updateChain = {
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
      })
    }

    mockDb.select.mockReturnValue(selectChain)
    mockDb.insert.mockReturnValue(insertChain)
    mockDb.update.mockReturnValue(updateChain)

    // Import the handler
    const module = await import('./webhook.post')
    webhookHandler = module.default
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Signature Verification', () => {
    it('should reject requests without stripe-signature header', async () => {
      mockGetHeader.mockReturnValue(null)
      mockReadRawBody.mockResolvedValue('{}')

      const event = {} as H3Event

      try {
        await webhookHandler(event)
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        expect((error as { statusCode: number }).statusCode).toBe(400)
        expect((error as { message: string }).message).toBe('Missing stripe-signature header')
      }
    })

    it('should reject requests without request body', async () => {
      mockGetHeader.mockReturnValue('test-signature')
      mockReadRawBody.mockResolvedValue(null)

      const event = {} as H3Event

      try {
        await webhookHandler(event)
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        expect((error as { statusCode: number }).statusCode).toBe(400)
        expect((error as { message: string }).message).toBe('Missing request body')
      }
    })

    it('should reject requests with invalid signature', async () => {
      mockGetHeader.mockReturnValue('invalid-signature')
      mockReadRawBody.mockResolvedValue('{"type":"test"}')
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const event = {} as H3Event

      try {
        await webhookHandler(event)
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        expect((error as { statusCode: number }).statusCode).toBe(400)
        expect((error as { message: string }).message).toBe('Invalid signature')
      }

      expect(logger.error).toHaveBeenCalledWith(
        'Webhook signature verification failed:',
        expect.any(Error)
      )
    })

    it('should accept requests with valid signature', async () => {
      mockGetHeader.mockReturnValue('valid-signature')
      mockReadRawBody.mockResolvedValue('{"type":"customer.created"}')

      const stripeEvent: Stripe.Event = {
        id: 'evt_test_123',
        object: 'event',
        api_version: '2025-10-29.clover',
        created: 1234567890,
        data: {
          object: {
            id: 'cus_test_123',
            object: 'customer',
            metadata: {}
          } as Stripe.Customer
        },
        livemode: false,
        pending_webhooks: 0,
        request: null,
        type: 'customer.created'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(stripeEvent)

      const result = await webhookHandler({} as H3Event)

      expect(result).toEqual({ received: true })
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        '{"type":"customer.created"}',
        'valid-signature',
        'whsec_test_secret'
      )
    })
  })

  describe('Idempotency', () => {
    it('should skip processing duplicate webhook events', async () => {
      mockGetHeader.mockReturnValue('valid-signature')
      mockReadRawBody.mockResolvedValue('{"type":"test"}')

      const stripeEvent: Stripe.Event = {
        id: 'evt_duplicate_123',
        object: 'event',
        api_version: '2025-10-29.clover',
        created: 1234567890,
        data: {
          object: {} as Stripe.Customer
        },
        livemode: false,
        pending_webhooks: 0,
        request: null,
        type: 'customer.created'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(stripeEvent)

      // Mock existing event found in database
      const selectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ id: 1, stripeEventId: 'evt_duplicate_123' })
          })
        })
      }
      mockDb.select.mockReturnValue(selectChain)

      const result = await webhookHandler({} as H3Event)

      expect(result).toEqual({ received: true, duplicate: true })
      expect(logger.info).toHaveBeenCalledWith(
        'Webhook event evt_duplicate_123 already processed, skipping'
      )
      // Ensure we don't insert a new event
      expect(mockDb.insert).not.toHaveBeenCalled()
    })

    it('should process new webhook events', async () => {
      mockGetHeader.mockReturnValue('valid-signature')
      mockReadRawBody.mockResolvedValue('{"type":"test"}')

      const stripeEvent: Stripe.Event = {
        id: 'evt_new_123',
        object: 'event',
        api_version: '2025-10-29.clover',
        created: 1234567890,
        data: {
          object: {} as Stripe.Customer
        },
        livemode: false,
        pending_webhooks: 0,
        request: null,
        type: 'customer.created'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(stripeEvent)

      // Mock no existing event
      const selectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(null)
          })
        })
      }
      mockDb.select.mockReturnValue(selectChain)

      const result = await webhookHandler({} as H3Event)

      expect(result).toEqual({ received: true })
      expect(mockDb.insert).toHaveBeenCalled()
    })
  })

  describe('Subscription Lifecycle', () => {
    it('should handle checkout.session.completed with valid data', async () => {
      mockGetHeader.mockReturnValue('valid-signature')
      mockReadRawBody.mockResolvedValue('{"type":"checkout.session.completed"}')

      const subscription = {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'active',
        items: { object: 'list', data: [{ price: { id: 'price_monthly' } }], has_more: false, url: '' }
      }

      const session = {
        id: 'cs_123',
        metadata: { userId: '1' },
        subscription: 'sub_123'
      }

      const stripeEvent: Stripe.Event = {
        id: 'evt_checkout_123',
        object: 'event',
        api_version: '2025-10-29.clover',
        created: 1234567890,
        data: { object: session as unknown as Stripe.Checkout.Session },
        livemode: false,
        pending_webhooks: 0,
        request: null,
        type: 'checkout.session.completed'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(stripeEvent)
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription)

      const result = await webhookHandler({} as H3Event)

      expect(result).toEqual({ received: true })
      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123')
    })

    it('should handle customer.subscription.created', async () => {
      mockGetHeader.mockReturnValue('valid-signature')
      mockReadRawBody.mockResolvedValue('{"type":"customer.subscription.created"}')

      const subscription = {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'active',
        items: { object: 'list', data: [{ price: { id: 'price_monthly' } }], has_more: false, url: '' }
      }

      const stripeEvent: Stripe.Event = {
        id: 'evt_sub_created_123',
        object: 'event',
        api_version: '2025-10-29.clover',
        created: 1234567890,
        data: { object: subscription as unknown as Stripe.Subscription },
        livemode: false,
        pending_webhooks: 0,
        request: null,
        type: 'customer.subscription.created'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(stripeEvent)

      let callCount = 0
      const selectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockImplementation(() => {
              callCount++
              if (callCount === 2) return Promise.resolve({ userId: 1 })
              return Promise.resolve(null)
            })
          })
        })
      }
      mockDb.select.mockReturnValue(selectChain)

      const result = await webhookHandler({} as H3Event)

      expect(result).toEqual({ received: true })
      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('should handle customer.subscription.deleted', async () => {
      mockGetHeader.mockReturnValue('valid-signature')
      mockReadRawBody.mockResolvedValue('{"type":"customer.subscription.deleted"}')

      const subscription = {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'canceled'
      }

      const stripeEvent: Stripe.Event = {
        id: 'evt_sub_deleted_123',
        object: 'event',
        api_version: '2025-10-29.clover',
        created: 1234567890,
        data: { object: subscription as unknown as Stripe.Subscription },
        livemode: false,
        pending_webhooks: 0,
        request: null,
        type: 'customer.subscription.deleted'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(stripeEvent)

      let callCount = 0
      const selectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockImplementation(() => {
              callCount++
              if (callCount === 2) return Promise.resolve({ userId: 1 })
              return Promise.resolve(null)
            })
          })
        })
      }
      mockDb.select.mockReturnValue(selectChain)

      const result = await webhookHandler({} as H3Event)

      expect(result).toEqual({ received: true })
      expect(mockDb.update).toHaveBeenCalled()
      expect(logger.info).toHaveBeenCalledWith('Subscription canceled for user 1')
    })
  })

  describe('Payment Events', () => {
    it('should handle invoice.payment_succeeded', async () => {
      mockGetHeader.mockReturnValue('valid-signature')
      mockReadRawBody.mockResolvedValue('{"type":"invoice.payment_succeeded"}')

      const invoice = { id: 'in_123', subscription: 'sub_123' }
      const subscription = {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'active',
        items: { object: 'list', data: [{ price: { id: 'price_monthly' } }], has_more: false, url: '' }
      }

      const stripeEvent: Stripe.Event = {
        id: 'evt_payment_succeeded_123',
        object: 'event',
        api_version: '2025-10-29.clover',
        created: 1234567890,
        data: { object: invoice as unknown as Stripe.Invoice },
        livemode: false,
        pending_webhooks: 0,
        request: null,
        type: 'invoice.payment_succeeded'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(stripeEvent)
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription)

      let callCount = 0
      const selectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockImplementation(() => {
              callCount++
              if (callCount === 2) return Promise.resolve({ userId: 1 })
              return Promise.resolve(null)
            })
          })
        })
      }
      mockDb.select.mockReturnValue(selectChain)

      const result = await webhookHandler({} as H3Event)

      expect(result).toEqual({ received: true })
      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_123')
      expect(logger.info).toHaveBeenCalledWith('Payment succeeded for user 1')
    })

    it('should handle invoice.payment_failed', async () => {
      mockGetHeader.mockReturnValue('valid-signature')
      mockReadRawBody.mockResolvedValue('{"type":"invoice.payment_failed"}')

      const invoice = { id: 'in_123', subscription: 'sub_123' }
      const subscription = {
        id: 'sub_123',
        customer: 'cus_123',
        status: 'past_due',
        items: { object: 'list', data: [{ price: { id: 'price_monthly' } }], has_more: false, url: '' }
      }

      const stripeEvent: Stripe.Event = {
        id: 'evt_payment_failed_123',
        object: 'event',
        api_version: '2025-10-29.clover',
        created: 1234567890,
        data: { object: invoice as unknown as Stripe.Invoice },
        livemode: false,
        pending_webhooks: 0,
        request: null,
        type: 'invoice.payment_failed'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(stripeEvent)
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription)

      let callCount = 0
      const selectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockImplementation(() => {
              callCount++
              if (callCount === 2) return Promise.resolve({ userId: 1 })
              return Promise.resolve(null)
            })
          })
        })
      }
      mockDb.select.mockReturnValue(selectChain)

      const result = await webhookHandler({} as H3Event)

      expect(result).toEqual({ received: true })
      expect(logger.info).toHaveBeenCalledWith('Payment failed for user 1')
      expect(mockDb.update).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle database failures during event processing', async () => {
      mockGetHeader.mockReturnValue('valid-signature')
      mockReadRawBody.mockResolvedValue('{"type":"customer.subscription.created"}')

      const subscription = { id: 'sub_123', customer: 'cus_123', status: 'active' }
      const stripeEvent: Stripe.Event = {
        id: 'evt_db_error_123',
        object: 'event',
        api_version: '2025-10-29.clover',
        created: 1234567890,
        data: { object: subscription as unknown as Stripe.Subscription },
        livemode: false,
        pending_webhooks: 0,
        request: null,
        type: 'customer.subscription.created'
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(stripeEvent)

      const selectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockRejectedValue(new Error('Database connection failed'))
          })
        })
      }
      mockDb.select.mockReturnValue(selectChain)

      try {
        await webhookHandler({} as H3Event)
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        expect((error as { statusCode: number }).statusCode).toBe(500)
        expect((error as { message: string }).message).toBe('Webhook processing failed')
      }

      expect(logger.error).toHaveBeenCalledWith(
        'Webhook handler error:',
        expect.any(Error)
      )
    })

    it('should handle malformed webhook event data', async () => {
      mockGetHeader.mockReturnValue('valid-signature')
      mockReadRawBody.mockResolvedValue('not valid json')

      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Unexpected end of JSON input')
      })

      try {
        await webhookHandler({} as H3Event)
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        expect((error as { statusCode: number }).statusCode).toBe(400)
        expect((error as { message: string }).message).toBe('Invalid signature')
      }
    })
  })
})
