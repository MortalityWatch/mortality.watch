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

import { getBaselineYear } from '@/lib/constants'

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
  const baselineYear = getBaselineYear(chartType)
  const baselineYearStr = baselineYear.toString()

  // Find labels around the baseline year
  // This is independent of sliderStart, so baseline won't change when user adjusts data range
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
