import { z } from 'zod'
import { DataQualityStatusSchema, DataQualityOverrideStatusSchema } from './common'

/**
 * Admin-related Zod schemas for API responses
 * Provides runtime validation for admin endpoint data
 */

// Data quality country schema
export const DataQualityCountrySchema = z.object({
  iso3c: z.string(),
  jurisdiction: z.string(),
  lastUpdate: z.string(), // ISO date string
  lastUpdateTimestamp: z.number(),
  daysSinceUpdate: z.number(),
  status: DataQualityStatusSchema,
  overrideStatus: DataQualityOverrideStatusSchema,
  dataSource: z.string(),
  type: z.string(),
  ageGroups: z.string(),
  minDate: z.string() // ISO date string
})

// Data quality summary schema
export const DataQualitySummarySchema = z.object({
  total: z.number(),
  fresh: z.number(),
  stale: z.number(),
  medianFreshDays: z.number(),
  medianStaleDays: z.number(),
  mostStaleCountry: z.object({
    iso3c: z.string(),
    jurisdiction: z.string(),
    daysSinceUpdate: z.number()
  }).nullable(),
  mostRecentUpdate: z.number()
})

// Data quality response schema
export const DataQualityResponseSchema = z.object({
  success: z.literal(true),
  timestamp: z.string(), // ISO timestamp
  summary: DataQualitySummarySchema,
  countries: z.array(DataQualityCountrySchema)
})

// Cache entry schema
export const CacheEntrySchema = z.object({
  key: z.string(),
  size: z.number(),
  age: z.number(),
  lastAccessed: z.number().nullable()
})

// Cache stats schema
export const CacheStatsSchema = z.object({
  totalFiles: z.number(),
  totalSize: z.number(),
  oldestFile: z.number().nullable(),
  newestFile: z.number().nullable()
})

// Cache get response schema
export const CacheGetResponseSchema = z.object({
  cache: z.array(CacheEntrySchema),
  stats: CacheStatsSchema
})

// Cache delete response schema
export const CacheDeleteResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  deletedFiles: z.number(),
  freedBytes: z.number()
})

// Staleness check response schema
export const StalenessCheckResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  staleCountries: z.array(z.object({
    iso3c: z.string(),
    jurisdiction: z.string(),
    source: z.string(),
    daysSinceUpdate: z.number()
  })),
  alertSent: z.boolean()
})

// Data quality override response schema
export const DataQualityOverrideResponseSchema = z.object({
  success: z.literal(true),
  message: z.string()
})

// Data quality alert response schema
export const DataQualityAlertResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  emailSent: z.boolean()
})

// Cache clear response schema
export const CacheClearResponseSchema = z.object({
  success: z.literal(true),
  cleared: z.number(),
  message: z.string()
})

// Cache stats get response schema
export const CacheStatsGetResponseSchema = z.object({
  success: z.literal(true),
  stats: z.object({
    count: z.number(),
    totalSize: z.number(),
    totalSizeMB: z.string(),
    oldestEntry: z.string().nullable(),
    newestEntry: z.string().nullable()
  })
})

// Export types
export type DataQualityCountry = z.infer<typeof DataQualityCountrySchema>
export type DataQualitySummary = z.infer<typeof DataQualitySummarySchema>
export type DataQualityResponse = z.infer<typeof DataQualityResponseSchema>
export type CacheEntry = z.infer<typeof CacheEntrySchema>
export type CacheStats = z.infer<typeof CacheStatsSchema>
export type CacheGetResponse = z.infer<typeof CacheGetResponseSchema>
export type CacheDeleteResponse = z.infer<typeof CacheDeleteResponseSchema>
export type StalenessCheckResponse = z.infer<typeof StalenessCheckResponseSchema>
export type DataQualityOverrideResponse = z.infer<typeof DataQualityOverrideResponseSchema>
export type DataQualityAlertResponse = z.infer<typeof DataQualityAlertResponseSchema>
export type CacheClearResponse = z.infer<typeof CacheClearResponseSchema>
export type CacheStatsGetResponse = z.infer<typeof CacheStatsGetResponseSchema>
