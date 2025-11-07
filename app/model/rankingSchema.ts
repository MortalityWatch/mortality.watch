/**
 * Ranking State Schema Validation
 *
 * Provides:
 * - Field-level validation (types, required fields)
 * - Cross-field validation (business rules)
 * - Type-safe state management
 * - Auto-fix capabilities for common mistakes
 *
 * Note: Ranking page has simpler state than explorer (no countries array,
 * no age groups, limited chart types).
 */

import { z } from 'zod'
import {
  StandardPopulationEnum,
  BaselineMethodEnum,
  DecimalPrecisionEnum
} from './explorerSchema'

// ============================================================================
// ENUMS - Valid values for ranking-specific fields
// ============================================================================

export const RankingPeriodEnum = z.enum([
  'yearly',
  'fluseason',
  'midyear',
  'quarterly'
])

export const JurisdictionTypeEnum = z.enum([
  'countries',
  'countries_states',
  'usa',
  'can',
  'eu27',
  'deu',
  'af',
  'as',
  'eu',
  'na',
  'oc',
  'sa'
])

// Export TypeScript types from Zod enums
export type RankingPeriod = z.infer<typeof RankingPeriodEnum>
export type JurisdictionType = z.infer<typeof JurisdictionTypeEnum>

// Re-export shared types
export type {
  StandardPopulation,
  BaselineMethod,
  DecimalPrecision
} from './explorerSchema'

// ============================================================================
// BASE SCHEMA - Field-level validation
// ============================================================================

const rankingStateBaseSchema = z.object({
  // Period configuration
  periodOfTime: RankingPeriodEnum,
  jurisdictionType: JurisdictionTypeEnum,

  // Display toggles
  showASMR: z.boolean(),
  showTotals: z.boolean(),
  showTotalsOnly: z.boolean(),
  showPercentage: z.boolean(),
  showPI: z.boolean(), // Prediction intervals
  cumulative: z.boolean(),
  hideIncomplete: z.boolean(),

  // Metric configuration
  standardPopulation: StandardPopulationEnum,
  baselineMethod: BaselineMethodEnum,
  decimalPrecision: DecimalPrecisionEnum,

  // Date range
  dateFrom: z.string(),
  dateTo: z.string(),
  baselineDateFrom: z.string(),
  baselineDateTo: z.string()
})

// ============================================================================
// CROSS-FIELD VALIDATION - Business rules
// ============================================================================

export const rankingStateSchema = rankingStateBaseSchema.superRefine(
  (data, ctx) => {
    // Rule 1: ASMR requires standardPopulation
    if (data.showASMR && !data.standardPopulation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ASMR requires a standard population',
        path: ['standardPopulation']
      })
    }

    // Rule 2: showTotalsOnly requires showTotals
    if (data.showTotalsOnly && !data.showTotals) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Show totals only requires show totals to be enabled',
        path: ['showTotalsOnly']
      })
    }

    // Rule 3: Prediction intervals not compatible with cumulative
    if (data.showPI && data.cumulative) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Prediction intervals cannot be shown with cumulative data',
        path: ['showPI']
      })
    }

    // Rule 4: Prediction intervals not compatible with totals only
    if (data.showPI && data.showTotalsOnly) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Prediction intervals cannot be shown with totals only',
        path: ['showPI']
      })
    }

    // Rule 5: Date format must match period type
    const yearlyPattern = /^\d{4}$/
    const fluseasonPattern = /^\d{4}\/\d{2}$/

    if (data.periodOfTime === 'yearly' && !yearlyPattern.test(data.dateFrom)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY for yearly periods (got: ${data.dateFrom})`,
        path: ['dateFrom']
      })
    }

    if (data.periodOfTime === 'yearly' && !yearlyPattern.test(data.dateTo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY for yearly periods (got: ${data.dateTo})`,
        path: ['dateTo']
      })
    }

    if (
      (data.periodOfTime === 'fluseason' || data.periodOfTime === 'midyear' || data.periodOfTime === 'quarterly')
      && !fluseasonPattern.test(data.dateFrom)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY/YY for ${data.periodOfTime} periods (got: ${data.dateFrom})`,
        path: ['dateFrom']
      })
    }

    if (
      (data.periodOfTime === 'fluseason' || data.periodOfTime === 'midyear' || data.periodOfTime === 'quarterly')
      && !fluseasonPattern.test(data.dateTo)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date format must be YYYY/YY for ${data.periodOfTime} periods (got: ${data.dateTo})`,
        path: ['dateTo']
      })
    }

    // Rule 6: dateFrom must be before or equal to dateTo
    if (data.dateFrom > data.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date must be before or equal to end date',
        path: ['dateTo']
      })
    }

    // Rule 7: Baseline dates must be before data dates
    if (data.baselineDateFrom >= data.dateFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Baseline period must be before data period',
        path: ['baselineDateFrom']
      })
    }
  }
)

// Export TypeScript type from schema
export type RankingState = z.infer<typeof rankingStateBaseSchema>
