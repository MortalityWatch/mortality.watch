import { z } from 'zod'

/**
 * Common Zod schemas for API responses
 * These schemas provide runtime validation and type safety for API endpoints
 */

// Success/Error response wrappers
export const SuccessResponseSchema = z.object({
  success: z.literal(true)
})

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  statusCode: z.number().optional()
})

export const MessageResponseSchema = z.object({
  message: z.string()
})

// Generic paginated response
export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    hasMore: z.boolean()
  })
}

// Tier enum (matching database schema)
export const TierSchema = z.union([z.literal(0), z.literal(1), z.literal(2)])

// Role enum (matching database schema)
export const RoleSchema = z.enum(['user', 'admin'])

// Subscription status enum (matching database schema)
export const SubscriptionStatusSchema = z.enum([
  'active',
  'canceled',
  'past_due',
  'unpaid',
  'incomplete',
  'trialing',
  'inactive'
])

// Subscription plan enum
export const SubscriptionPlanSchema = z.enum(['monthly', 'yearly'])

// Chart type enum
export const ChartTypeSchema = z.enum(['explorer', 'ranking'])

// Data quality status enum
export const DataQualityStatusSchema = z.enum(['fresh', 'stale'])

// Data quality override status enum
export const DataQualityOverrideStatusSchema = z.enum(['monitor', 'muted', 'hidden'])

// Common types
export type Tier = z.infer<typeof TierSchema>
export type Role = z.infer<typeof RoleSchema>
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>
export type ChartType = z.infer<typeof ChartTypeSchema>
export type DataQualityStatus = z.infer<typeof DataQualityStatusSchema>
export type DataQualityOverrideStatus = z.infer<typeof DataQualityOverrideStatusSchema>
