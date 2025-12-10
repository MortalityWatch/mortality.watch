/**
 * Baseline Range Calculation
 *
 * Calculates the default baseline date range for mortality charts
 * based on chart type and available data labels.
 *
 * Strategy:
 * - Uses chart-type-aware baseline years (2016 for fluseason/midyear, 2017 for others)
 * - Finds year boundaries in the label array rather than counting periods
 * - Works for all chart types: yearly, fluseason, weekly, monthly, etc.
 */

import { getBaselineYear, getMaxBaselinePeriod, getMaxBaselineYears } from '@/lib/constants'

const MIN_BASELINE_SPAN = 3

export interface BaselineRange {
  from: string
  to: string
}

/**
 * Calculate default baseline range for a given chart type and labels
 *
 * @param chartType - The type of chart (yearly, fluseason, weekly, etc.)
 * @param allChartLabels - All available date labels for the chart
 * @param allYearlyChartLabels - Yearly representation of labels (for finding year boundaries)
 * @returns Baseline range { from, to } or null if cannot be determined
 */
export function calculateBaselineRange(
  chartType: string,
  allChartLabels: string[],
  allYearlyChartLabels: string[]
): BaselineRange | null {
  if (!allChartLabels || allChartLabels.length === 0) {
    return null
  }

  // Get chart-type-aware baseline year (2016 for fluseason/midyear, 2017 for others)
  const preferredBaselineYear = getBaselineYear(chartType)
  const baselineYear = preferredBaselineYear

  // NOTE: Baseline calculation is independent of user's selected date range
  // This matches explorer behavior - baseline stays constant regardless of data slider position
  // The preferred baseline year (2016 for fluseason, 2017 for yearly) is used unless
  // that year doesn't exist in the data, in which case we fall back to earliest available

  const baselineYearStr = baselineYear.toString()

  // Find labels around the baseline year
  const baselineIndex = allYearlyChartLabels.findIndex(year =>
    year === baselineYearStr || year.startsWith(baselineYearStr + '/')
  )

  if (baselineIndex === -1) {
    // Fallback: use first available labels if baseline year not found
    const defaultFrom = allChartLabels[0]!
    const defaultToIndex = Math.min(allChartLabels.length - 1, MIN_BASELINE_SPAN)
    const defaultTo = allChartLabels[defaultToIndex]!
    return { from: defaultFrom, to: defaultTo }
  }

  // Find corresponding labels in allChartLabels starting from baseline year
  const fromIndex = allChartLabels.findIndex((label) => {
    const labelYear = label.substring(0, 4)
    return labelYear === baselineYearStr
  })

  if (fromIndex === -1) {
    return null
  }

  const defaultFrom = allChartLabels[fromIndex]!

  // Find the end of the baseline period by looking for year boundaries
  // We want MIN_BASELINE_SPAN years of data (e.g., 3 years)
  // Strategy: Find the first label that starts with (baselineYear + MIN_BASELINE_SPAN)
  //           and take the label just before it
  //
  // Examples:
  // - Fluseason, baselineYear=2016, span=3: Find "2019", take label before it → "2018/19"
  // - Yearly, baselineYear=2017, span=3: Find "2020", take label before it → "2019"
  // - Weekly, baselineYear=2017, span=3: Find "2020-W01", take label before it → last week of 2019

  const endYearBoundary = baselineYear + MIN_BASELINE_SPAN
  const endYearStr = endYearBoundary.toString()

  // Find the first label that starts with endYearBoundary
  const boundaryIndex = allChartLabels.findIndex((label, idx) => {
    if (idx <= fromIndex) return false // Must be after the start
    const labelYear = label.substring(0, 4)
    return labelYear === endYearStr
  })

  // The baseline ends just before the boundary
  let toIndex: number
  if (boundaryIndex !== -1) {
    // Found the boundary - end one label before it
    toIndex = boundaryIndex - 1
  } else {
    // Boundary not found - use fallback (go forward MIN_BASELINE_SPAN periods)
    // This handles edge cases where we don't have data up to the boundary year
    toIndex = Math.min(allChartLabels.length - 1, fromIndex + MIN_BASELINE_SPAN - 1)
  }

  const defaultTo = allChartLabels[toIndex]!

  return { from: defaultFrom, to: defaultTo }
}

/**
 * Validation result for baseline period
 */
export interface BaselineValidationResult {
  isValid: boolean
  periodLength: number
  maxPeriod: number
  maxYears: number
  exceededBy?: number
}

/**
 * Validate baseline period length against maximum limits
 *
 * Prevents excessively large baseline periods that cause server timeouts.
 *
 * @param chartType - The type of chart (weekly, monthly, quarterly, yearly)
 * @param allChartLabels - All available date labels
 * @param baselineFrom - Start date of baseline period
 * @param baselineTo - End date of baseline period
 * @returns Validation result with period info and whether it exceeds limits
 */
export function validateBaselinePeriod(
  chartType: string,
  allChartLabels: string[],
  baselineFrom: string,
  baselineTo: string
): BaselineValidationResult {
  const maxPeriod = getMaxBaselinePeriod(chartType)
  const maxYears = getMaxBaselineYears(chartType)

  // Find indices of baseline dates
  const fromIndex = allChartLabels.indexOf(baselineFrom)
  const toIndex = allChartLabels.indexOf(baselineTo)

  // If dates not found, consider invalid
  if (fromIndex === -1 || toIndex === -1) {
    return {
      isValid: false,
      periodLength: 0,
      maxPeriod,
      maxYears
    }
  }

  // Calculate period length (inclusive)
  const periodLength = toIndex - fromIndex + 1

  const isValid = periodLength <= maxPeriod
  const exceededBy = isValid ? undefined : periodLength - maxPeriod

  return {
    isValid,
    periodLength,
    maxPeriod,
    maxYears,
    exceededBy
  }
}

/**
 * Clamp baseline period to maximum allowed length
 *
 * If the period exceeds the maximum, returns an adjusted end date
 * that brings the period within limits while keeping the start date.
 *
 * @param chartType - The type of chart
 * @param allChartLabels - All available date labels
 * @param baselineFrom - Start date of baseline period
 * @param baselineTo - End date of baseline period
 * @returns Clamped baseline range
 */
export function clampBaselinePeriod(
  chartType: string,
  allChartLabels: string[],
  baselineFrom: string,
  baselineTo: string
): BaselineRange {
  const validation = validateBaselinePeriod(chartType, allChartLabels, baselineFrom, baselineTo)

  if (validation.isValid) {
    return { from: baselineFrom, to: baselineTo }
  }

  // Find the from index and calculate max allowed end index
  const fromIndex = allChartLabels.indexOf(baselineFrom)
  if (fromIndex === -1) {
    return { from: baselineFrom, to: baselineTo }
  }

  const maxEndIndex = Math.min(
    fromIndex + validation.maxPeriod - 1,
    allChartLabels.length - 1
  )

  const clampedTo = allChartLabels[maxEndIndex] ?? baselineTo

  return { from: baselineFrom, to: clampedTo }
}
