/**
 * Explorer State Schema Validation
 *
 * Provides:
 * - Field-level validation (types, required fields)
 * - Cross-field validation (business rules)
 * - Type-safe state management
 * - Auto-fix capabilities for common mistakes
 *
 * This eliminates invalid state combinations that can occur through
 * URL manipulation or stale bookmarks.
 */

import { z } from 'zod'

// ============================================================================
// ENUMS - Valid values for each field
// ============================================================================

export const ChartTypeEnum = z.enum([
  'yearly',
  'midyear',
  'fluseason',
  'monthly',
  'quarterly',
  'weekly',
  'weekly_13w_sma',
  'weekly_26w_sma',
  'weekly_52w_sma',
  'weekly_104w_sma'
])

export const MetricTypeEnum = z.enum([
  'deaths',
  'cmr',
  'asmr',
  'le',
  'population'
])

export const StandardPopulationEnum = z.enum([
  'who',
  'esp',
  'usa',
  'country'
])

export const BaselineMethodEnum = z.enum([
  'naive',
  'mean',
  'median',
  'lin_reg',
  'exp'
])

export const ChartStyleEnum = z.enum([
  'line',
  'bar',
  'matrix'
])

export const DecimalPrecisionEnum = z.enum([
  'auto',
  '0',
  '1',
  '2',
  '3'
])

// Export TypeScript types from Zod enums
export type ChartType = z.infer<typeof ChartTypeEnum>
export type MetricType = z.infer<typeof MetricTypeEnum>
export type StandardPopulation = z.infer<typeof StandardPopulationEnum>
export type BaselineMethod = z.infer<typeof BaselineMethodEnum>
export type ChartStyle = z.infer<typeof ChartStyleEnum>
export type DecimalPrecision = z.infer<typeof DecimalPrecisionEnum>

// ============================================================================
// BASE SCHEMA - Field-level validation
// ============================================================================

const explorerStateBaseSchema = z.object({
  // Country/Age selection
  countries: z
    .array(z.string())
    .min(1, 'At least one country required')
    .max(10, 'Maximum 10 countries allowed'),

  ageGroups: z
    .array(z.string())
    .min(1, 'At least one age group required'),

  // Chart configuration
  chartType: ChartTypeEnum,
  type: MetricTypeEnum,
  standardPopulation: StandardPopulationEnum,
  chartStyle: ChartStyleEnum,

  // Date range
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sliderStart: z.string().optional(),

  // Baseline configuration
  showBaseline: z.boolean(),
  baselineMethod: BaselineMethodEnum,
  baselineDateFrom: z.string().optional(),
  baselineDateTo: z.string().optional(),

  // Display options
  cumulative: z.boolean(),
  showPredictionInterval: z.boolean(),
  showTotal: z.boolean(),
  showPercentage: z.boolean().optional(),
  maximize: z.boolean(),
  showLabels: z.boolean(),
  showLogarithmic: z.boolean(),

  // Chart appearance
  decimals: DecimalPrecisionEnum
})

// ============================================================================
// CROSS-FIELD VALIDATION - Business rules
// ============================================================================

export const explorerStateSchema = explorerStateBaseSchema.superRefine(
  (data, ctx) => {
    // Rule 1: ASMR requires standardPopulation (data requirement)
    if (data.type === 'asmr' && !data.standardPopulation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ASMR metric requires a standard population',
        path: ['standardPopulation']
      })
    }

    // Rule 2: Date format must match chart type (data validation)
    const yearlyPattern = /^\d{4}$/
    const monthlyPattern = /^\d{4}-\d{2}$/
    const weeklyPattern = /^\d{4}-W\d{2}$/
    const fluseasonPattern = /^\d{4}\/\d{2}$/

    if (data.dateFrom && data.chartType === 'yearly' && !yearlyPattern.test(data.dateFrom)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY for yearly charts (got: ${data.dateFrom})`,
        path: ['dateFrom']
      })
    }

    if (data.dateTo && data.chartType === 'yearly' && !yearlyPattern.test(data.dateTo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY for yearly charts (got: ${data.dateTo})`,
        path: ['dateTo']
      })
    }

    if (data.dateFrom && data.chartType === 'monthly' && !monthlyPattern.test(data.dateFrom)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY-MM for monthly charts (got: ${data.dateFrom})`,
        path: ['dateFrom']
      })
    }

    if (data.dateTo && data.chartType === 'monthly' && !monthlyPattern.test(data.dateTo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY-MM for monthly charts (got: ${data.dateTo})`,
        path: ['dateTo']
      })
    }

    if (
      data.dateFrom
      && data.chartType.startsWith('weekly')
      && !weeklyPattern.test(data.dateFrom)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY-WNN for weekly charts (got: ${data.dateFrom})`,
        path: ['dateFrom']
      })
    }

    if (
      data.dateTo
      && data.chartType.startsWith('weekly')
      && !weeklyPattern.test(data.dateTo)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY-WNN for weekly charts (got: ${data.dateTo})`,
        path: ['dateTo']
      })
    }

    if (
      data.dateFrom
      && (data.chartType === 'fluseason' || data.chartType === 'midyear')
      && !fluseasonPattern.test(data.dateFrom)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY/YY for flu season charts (got: ${data.dateFrom})`,
        path: ['dateFrom']
      })
    }

    if (
      data.dateTo
      && (data.chartType === 'fluseason' || data.chartType === 'midyear')
      && !fluseasonPattern.test(data.dateTo)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY/YY for flu season charts (got: ${data.dateTo})`,
        path: ['dateTo']
      })
    }

    // Rule 4: dateFrom must be before or equal to dateTo (only validate if both present)
    if (data.dateFrom && data.dateTo && data.dateFrom > data.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date must be before or equal to end date',
        path: ['dateTo']
      })
    }

    // NOTE: Separation of concerns for validation:
    //
    // Zod Schema (this file):
    // - Data-level validation (types, formats, required fields)
    // - Prevents invalid data from entering the system
    // - Runs once on initial load to catch malformed URLs
    // - Example: "dateFrom must be YYYY format for yearly charts"
    //
    // State Constraints (constraints.ts):
    // - Business rule enforcement (cross-field dependencies)
    // - Runs on every state change to maintain consistency
    // - Example: "if baseline is off, then prediction interval must be off"
    //
    // View System (views.ts):
    // - UI visibility and defaults per view
    // - Example: "excess view hides logarithmic option"
    // - Example: "zscore view enables z-score visualization"
    //
    // This schema focuses ONLY on data-level validation to catch malformed URLs early.
  }
)

// Export TypeScript type from schema
export type ExplorerState = z.infer<typeof explorerStateBaseSchema>
