import { z } from 'zod'
import { ChartTypeSchema } from './common'

/**
 * Chart-related Zod schemas for API responses
 * Provides runtime validation for saved chart data
 */

// Saved chart schema
export const SavedChartSchema = z.object({
  id: z.number(),
  userId: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  chartState: z.string(), // JSON-encoded chart state
  chartType: ChartTypeSchema,
  thumbnailUrl: z.string().nullable(),
  isFeatured: z.boolean(),
  isPublic: z.boolean(),
  slug: z.string().nullable(),
  viewCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// Simple chart schema (for lists)
export const SimpleChartSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  chartType: ChartTypeSchema,
  thumbnailUrl: z.string().nullable(),
  isFeatured: z.boolean(),
  isPublic: z.boolean(),
  slug: z.string().nullable(),
  viewCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date()
})

// Chart save response schema
export const ChartSaveResponseSchema = z.object({
  success: z.literal(true),
  chart: SavedChartSchema
})

// Charts list response schema
export const ChartsListResponseSchema = z.object({
  charts: z.array(SavedChartSchema)
})

// Chart get response schema
export const ChartGetResponseSchema = z.object({
  chart: SavedChartSchema
})

// Chart delete response schema
export const ChartDeleteResponseSchema = z.object({
  success: z.literal(true),
  message: z.string()
})

// Chart feature update response schema
export const ChartFeatureUpdateResponseSchema = z.object({
  success: z.literal(true),
  chart: SavedChartSchema
})

// Chart visibility update response schema
export const ChartVisibilityUpdateResponseSchema = z.object({
  success: z.literal(true),
  chart: SavedChartSchema
})

// Export types
export type SavedChart = z.infer<typeof SavedChartSchema>
export type SimpleChart = z.infer<typeof SimpleChartSchema>
export type ChartSaveResponse = z.infer<typeof ChartSaveResponseSchema>
export type ChartsListResponse = z.infer<typeof ChartsListResponseSchema>
export type ChartGetResponse = z.infer<typeof ChartGetResponseSchema>
export type ChartDeleteResponse = z.infer<typeof ChartDeleteResponseSchema>
export type ChartFeatureUpdateResponse = z.infer<typeof ChartFeatureUpdateResponseSchema>
export type ChartVisibilityUpdateResponse = z.infer<typeof ChartVisibilityUpdateResponseSchema>
