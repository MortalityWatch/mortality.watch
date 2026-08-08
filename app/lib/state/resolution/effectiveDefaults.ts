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

interface EffectiveDateRangeOptions {
  view?: string
}

interface PeriodToken {
  year: number
  ordinal: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parsePeriodToken(label: string, chartType: string): PeriodToken | null {
  if (chartType === 'weekly') {
    const match = label.match(/^(\d{4})[ -]W(\d{2})$/)
    if (!match) return null
    return { year: Number(match[1]), ordinal: Number(match[2]) }
  }

  if (chartType === 'monthly') {
    const named = label.match(/^(\d{4}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/)
    if (named) {
      return { year: Number(named[1]), ordinal: MONTHS.indexOf(named[2] ?? '') + 1 }
    }

    const numeric = label.match(/^(\d{4})-(\d{2})$/)
    if (!numeric) return null
    return { year: Number(numeric[1]), ordinal: Number(numeric[2]) }
  }

  if (chartType === 'quarterly') {
    const match = label.match(/^(\d{4}) Q([1-4])$/)
    if (!match) return null
    return { year: Number(match[1]), ordinal: Number(match[2]) }
  }

  return null
}

function computeSamePeriodDateRange(
  visibleLabels: string[],
  chartType: string,
  dateFrom: string | undefined,
  dateTo: string | undefined
): { effectiveDateFrom: string, effectiveDateTo: string } {
  const parsedLabels = visibleLabels
    .map(label => ({ label, token: parsePeriodToken(label, chartType) }))
    .filter((item): item is { label: string, token: PeriodToken } => item.token !== null)

  if (parsedLabels.length === 0) {
    return { effectiveDateFrom: '', effectiveDateTo: '' }
  }

  const from = dateFrom ? parsePeriodToken(dateFrom, chartType) : null
  const to = dateTo ? parsePeriodToken(dateTo, chartType) : null

  const anchorYear = to?.year ?? from?.year ?? parsedLabels[parsedLabels.length - 1]!.token.year
  const anchorLabels = parsedLabels.filter(item => item.token.year === anchorYear)
  const labelsForYear = anchorLabels.length > 0 ? anchorLabels : parsedLabels
  const labelByOrdinal = new Map(labelsForYear.map(item => [item.token.ordinal, item.label]))

  if (from && to && from.year === to.year && from.ordinal <= to.ordinal) {
    return {
      effectiveDateFrom: labelByOrdinal.get(from.ordinal) ?? dateFrom ?? labelsForYear[0]!.label,
      effectiveDateTo: labelByOrdinal.get(to.ordinal) ?? dateTo ?? labelsForYear[labelsForYear.length - 1]!.label
    }
  }

  return {
    effectiveDateFrom: labelsForYear[0]!.label,
    effectiveDateTo: to && to.year === anchorYear
      ? labelByOrdinal.get(to.ordinal) ?? labelsForYear[labelsForYear.length - 1]!.label
      : labelsForYear[labelsForYear.length - 1]!.label
  }
}

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
  dateTo: string | undefined,
  options: EffectiveDateRangeOptions = {}
): { effectiveDateFrom: string, effectiveDateTo: string } {
  if (allLabels.length === 0) {
    return { effectiveDateFrom: '', effectiveDateTo: '' }
  }

  // 1. Get visible labels (respects sliderStart)
  const visibleLabels = getVisibleLabels(allLabels, sliderStart, chartType)

  if (visibleLabels.length === 0) {
    return { effectiveDateFrom: '', effectiveDateTo: '' }
  }

  if (
    options.view === 'samePeriod'
    && (chartType === 'weekly' || chartType === 'monthly' || chartType === 'quarterly')
  ) {
    return computeSamePeriodDateRange(visibleLabels, chartType, dateFrom, dateTo)
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
