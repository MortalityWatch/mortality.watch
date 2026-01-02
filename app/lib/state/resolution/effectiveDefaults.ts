/**
 * Effective Defaults Computation
 *
 * Framework-agnostic functions for computing effective default values
 * when state fields are undefined. Used by both SSR and explorer.
 *
 * This centralizes the logic that was previously duplicated in:
 * - useDateRangeCalculations.ts (explorer)
 * - chartPngHelpers.ts (SSR)
 */

import { ChartPeriod, type ChartType } from '@/model/period'

/**
 * Calculate default periods count based on chart type
 * Target: approximately 10 years of recent data
 *
 * @param chartType - The chart type
 * @returns Number of periods for default range
 */
export function getDefaultPeriods(chartType: string): number {
  if (chartType === 'weekly' || chartType.startsWith('weekly_')) {
    return 520 // 10 years of weeks
  } else if (chartType === 'monthly') {
    return 120 // 10 years of months
  } else if (chartType === 'quarterly') {
    return 40 // 10 years of quarters
  }
  // yearly, midyear, fluseason
  return 10 // 10 years
}

/**
 * Apply sliderStart filter to get visible labels
 *
 * @param allLabels - All available date labels
 * @param sliderStart - Start date for slider (filters available labels)
 * @param chartType - Chart type for period lookup
 * @returns Filtered visible labels
 */
export function getVisibleLabels(
  allLabels: string[],
  sliderStart: string | undefined,
  chartType: string
): string[] {
  if (allLabels.length === 0) return []

  if (!sliderStart) return allLabels

  const period = new ChartPeriod(allLabels, chartType as ChartType)
  const startIndex = period.indexOf(sliderStart)
  const filtered = allLabels.slice(startIndex)

  return filtered.length > 0 ? filtered : allLabels
}

/**
 * Compute the effective date range for chart rendering
 *
 * This mirrors the logic in useDateRangeCalculations.ts:
 * 1. Apply sliderStart filter to get visible labels
 * 2. If dateFrom/dateTo undefined, use default range (last ~10 years)
 * 3. Otherwise use the provided dates
 *
 * @param allLabels - All available date labels
 * @param chartType - Chart type for period calculation
 * @param sliderStart - Start date for slider (filters available labels)
 * @param dateFrom - User-selected start date (undefined = use default)
 * @param dateTo - User-selected end date (undefined = use default)
 * @returns Resolved date range with effective values
 */
export function computeEffectiveDateRange(
  allLabels: string[],
  chartType: string,
  sliderStart: string | undefined,
  dateFrom: string | undefined,
  dateTo: string | undefined
): { effectiveDateFrom: string, effectiveDateTo: string } {
  if (allLabels.length === 0) {
    return { effectiveDateFrom: '', effectiveDateTo: '' }
  }

  // 1. Get visible labels (respects sliderStart)
  const visibleLabels = getVisibleLabels(allLabels, sliderStart, chartType)

  if (visibleLabels.length === 0) {
    return { effectiveDateFrom: '', effectiveDateTo: '' }
  }

  // 2. Compute effective date range
  if (dateFrom && dateTo) {
    // User provided both dates - use them
    return { effectiveDateFrom: dateFrom, effectiveDateTo: dateTo }
  }

  // Use default range: last ~10 years of visible labels
  const defaultPeriods = getDefaultPeriods(chartType)
  const startIndex = Math.max(0, visibleLabels.length - defaultPeriods)

  return {
    effectiveDateFrom: dateFrom || visibleLabels[startIndex] || '',
    effectiveDateTo: dateTo || visibleLabels[visibleLabels.length - 1] || ''
  }
}

/**
 * Compute effective baseline date range
 *
 * When baseline dates are not explicitly set, derive reasonable defaults
 * based on the effective date range and chart type.
 *
 * @param effectiveDateFrom - Effective start date for chart
 * @param effectiveDateTo - Effective end date for chart
 * @param baselineDateFrom - User-selected baseline start (undefined = use default)
 * @param baselineDateTo - User-selected baseline end (undefined = use default)
 * @param allLabels - All available date labels (for validation)
 * @returns Resolved baseline date range
 */
export function computeEffectiveBaselineRange(
  effectiveDateFrom: string,
  effectiveDateTo: string,
  baselineDateFrom: string | undefined,
  baselineDateTo: string | undefined,
  _allLabels: string[]
): { effectiveBaselineFrom: string, effectiveBaselineTo: string } {
  // If both are provided, use them
  if (baselineDateFrom && baselineDateTo) {
    return {
      effectiveBaselineFrom: baselineDateFrom,
      effectiveBaselineTo: baselineDateTo
    }
  }

  // Default: use the chart's date range as baseline range
  // This matches the explorer behavior when baseline dates are not set
  return {
    effectiveBaselineFrom: baselineDateFrom || effectiveDateFrom,
    effectiveBaselineTo: baselineDateTo || effectiveDateTo
  }
}
