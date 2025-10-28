/**
 * Explorer State Schema Validation
 *
 * Phase 9.1: Centralized state validation using Zod
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
  'mean',
  'linear',
  'spline'
])

export const ChartStyleEnum = z.enum([
  'line',
  'bar'
])

// Export TypeScript types from Zod enums
export type ChartType = z.infer<typeof ChartTypeEnum>
export type MetricType = z.infer<typeof MetricTypeEnum>
export type StandardPopulation = z.infer<typeof StandardPopulationEnum>
export type BaselineMethod = z.infer<typeof BaselineMethodEnum>
export type ChartStyle = z.infer<typeof ChartStyleEnum>

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
  dateFrom: z.string(),
  dateTo: z.string(),
  sliderStart: z.string().optional(),

  // Baseline configuration
  showBaseline: z.boolean(),
  baselineMethod: BaselineMethodEnum,
  baselineDateFrom: z.string(),
  baselineDateTo: z.string(),

  // Display options
  isExcess: z.boolean(),
  cumulative: z.boolean(),
  showPredictionInterval: z.boolean(),
  showTotal: z.boolean(),
  showPercentage: z.boolean().optional(),
  maximize: z.boolean(),
  showLabels: z.boolean(),
  isLogarithmic: z.boolean()
})

// ============================================================================
// CROSS-FIELD VALIDATION - Business rules
// ============================================================================

export const explorerStateSchema = explorerStateBaseSchema.superRefine(
  (data, ctx) => {
    // Rule 1: ASMR requires standardPopulation
    if (data.type === 'asmr' && !data.standardPopulation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ASMR metric requires a standard population',
        path: ['standardPopulation']
      })
    }

    // Rule 2: Can't show both excess and baseline simultaneously
    if (data.isExcess && data.showBaseline) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cannot show baseline in excess mode',
        path: ['showBaseline']
      })
    }

    // Rule 3: Date format must match chart type
    const yearlyPattern = /^\d{4}$/
    const monthlyPattern = /^\d{4}-\d{2}$/
    const weeklyPattern = /^\d{4}-W\d{2}$/
    const fluseasonPattern = /^\d{4}\/\d{2}$/

    if (data.chartType === 'yearly' && !yearlyPattern.test(data.dateFrom)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY for yearly charts (got: ${data.dateFrom})`,
        path: ['dateFrom']
      })
    }

    if (data.chartType === 'yearly' && !yearlyPattern.test(data.dateTo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY for yearly charts (got: ${data.dateTo})`,
        path: ['dateTo']
      })
    }

    if (data.chartType === 'monthly' && !monthlyPattern.test(data.dateFrom)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY-MM for monthly charts (got: ${data.dateFrom})`,
        path: ['dateFrom']
      })
    }

    if (data.chartType === 'monthly' && !monthlyPattern.test(data.dateTo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY-MM for monthly charts (got: ${data.dateTo})`,
        path: ['dateTo']
      })
    }

    if (
      data.chartType.startsWith('weekly')
      && !weeklyPattern.test(data.dateFrom)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY-WNN for weekly charts (got: ${data.dateFrom})`,
        path: ['dateFrom']
      })
    }

    if (
      data.chartType.startsWith('weekly')
      && !weeklyPattern.test(data.dateTo)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY-WNN for weekly charts (got: ${data.dateTo})`,
        path: ['dateTo']
      })
    }

    if (
      (data.chartType === 'fluseason' || data.chartType === 'midyear')
      && !fluseasonPattern.test(data.dateFrom)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY/YY for flu season charts (got: ${data.dateFrom})`,
        path: ['dateFrom']
      })
    }

    if (
      (data.chartType === 'fluseason' || data.chartType === 'midyear')
      && !fluseasonPattern.test(data.dateTo)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY/YY for flu season charts (got: ${data.dateTo})`,
        path: ['dateTo']
      })
    }

    // Rule 4: dateFrom must be before or equal to dateTo
    if (data.dateFrom > data.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date must be before or equal to end date',
        path: ['dateTo']
      })
    }

    // Rule 5: Baseline dates must be before data dates
    if (data.showBaseline && data.baselineDateFrom >= data.dateFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Baseline period must be before data period',
        path: ['baselineDateFrom']
      })
    }

    // Rule 6: Population type can't have baseline or excess
    if (data.type === 'population' && data.showBaseline) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Population metric does not support baseline calculations',
        path: ['showBaseline']
      })
    }

    if (data.type === 'population' && data.isExcess) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Population metric does not support excess calculations',
        path: ['isExcess']
      })
    }

    // Rule 7: Prediction intervals only available with baseline
    if (data.showPredictionInterval && !data.showBaseline) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Prediction intervals require baseline to be enabled',
        path: ['showPredictionInterval']
      })
    }
  }
)

// Export TypeScript type from schema
export type ExplorerState = z.infer<typeof explorerStateBaseSchema>
