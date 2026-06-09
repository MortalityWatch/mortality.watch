import { z } from 'zod'
import { SubscriptionStatusSchema, SubscriptionPlanSchema, TierSchema } from './common'

/**
 * Subscription-related Zod schemas for API responses
 * Provides runtime validation for local subscription and trial data
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

// Export types
export type SubscriptionDetails = z.infer<typeof SubscriptionDetailsSchema>
export type SubscriptionStatusResponse = z.infer<typeof SubscriptionStatusResponseSchema>
