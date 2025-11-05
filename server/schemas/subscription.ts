import { z } from 'zod'
import { SubscriptionStatusSchema, SubscriptionPlanSchema, TierSchema } from './common'

/**
 * Subscription-related Zod schemas for API responses
 * Provides runtime validation for Stripe subscription data
 */

// Subscription details schema
export const SubscriptionDetailsSchema = z.object({
  id: z.number(),
  status: SubscriptionStatusSchema,
  plan: SubscriptionPlanSchema.nullable(),
  isActive: z.boolean(),
  currentPeriodStart: z.date().nullable(),
  currentPeriodEnd: z.date().nullable(),
  daysRemaining: z.number().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  canceledAt: z.date().nullable(),
  trialEnd: z.date().nullable()
})

// Subscription status response schema
export const SubscriptionStatusResponseSchema = z.object({
  hasSubscription: z.boolean(),
  subscription: SubscriptionDetailsSchema.nullable(),
  tier: TierSchema
})

// Checkout session response schema
export const CheckoutSessionResponseSchema = z.object({
  sessionId: z.string(),
  url: z.string().nullable()
})

// Portal session response schema
export const PortalSessionResponseSchema = z.object({
  url: z.string()
})

// Webhook event schema
export const WebhookEventSchema = z.object({
  id: z.number(),
  stripeEventId: z.string(),
  eventType: z.string(),
  payload: z.string(), // JSON string
  processed: z.boolean(),
  processingError: z.string().nullable(),
  createdAt: z.date(),
  processedAt: z.date().nullable()
})

// Failed webhooks response schema
export const FailedWebhooksResponseSchema = z.object({
  events: z.array(WebhookEventSchema),
  count: z.number()
})

// Webhook retry response schema
export const WebhookRetryResponseSchema = z.object({
  success: z.boolean(),
  processed: z.number(),
  failed: z.number(),
  errors: z.array(z.object({
    eventId: z.string(),
    error: z.string()
  }))
})

// Export types
export type SubscriptionDetails = z.infer<typeof SubscriptionDetailsSchema>
export type SubscriptionStatusResponse = z.infer<typeof SubscriptionStatusResponseSchema>
export type CheckoutSessionResponse = z.infer<typeof CheckoutSessionResponseSchema>
export type PortalSessionResponse = z.infer<typeof PortalSessionResponseSchema>
export type WebhookEvent = z.infer<typeof WebhookEventSchema>
export type FailedWebhooksResponse = z.infer<typeof FailedWebhooksResponseSchema>
export type WebhookRetryResponse = z.infer<typeof WebhookRetryResponseSchema>
