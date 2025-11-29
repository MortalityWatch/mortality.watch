/**
 * Chart Label Formatting Functions
 *
 * Functions for formatting chart labels, tooltips, and axis ticks
 */

import { asPercentage, numberWithCommas } from '../chartUtils'
import type { ChartErrorDataPoint, MortalityChartData } from '../chartTypes'

/**
 * Format confidence interval text
 */
function formatCI(
  short: boolean,
  min: number,
  max: number,
  formatFn: (n: number) => string
) {
  return short
    ? ` (${formatFn(min)}, ${formatFn(max)})`
    : ` [95% PI: ${formatFn(min)}, ${formatFn(max)}]`
}

/**
 * Extract all y-values from chart datasets for precision calculation
 */
export function extractYValues(data: MortalityChartData): number[] {
  const values: number[] = []
  for (const dataset of data.datasets) {
    if (Array.isArray(dataset.data)) {
      for (const point of dataset.data) {
        if (typeof point === 'number') {
          values.push(point)
        } else if (point && typeof point === 'object' && 'y' in point) {
          const y = (point as ChartErrorDataPoint).y
          if (typeof y === 'number' && !isNaN(y)) {
            values.push(y)
          }
        }
      }
    }
  }
  return values
}

/**
 * Compute chart-wide precision based on maximum value magnitude.
 * Uses the largest value to determine decimals for consistency:
 * - max >= 100: 0 decimals
 * - max >= 1: 1 decimal
 * - max < 1: 2 decimals
 */
export function computeChartPrecision(allValues: number[]): number {
  if (allValues.length === 0) return 2
  const maxAbs = Math.max(...allValues.map(v => Math.abs(v)))
  if (maxAbs >= 100) return 0
  if (maxAbs >= 1) return 1
  return 2
}

/**
 * Compute resolved decimals from chart data when in auto mode.
 * For percentages, values are stored as decimals (0.20 = 20%) so we
 * multiply by 100 to get the displayed magnitude.
 */
export function resolveDecimals(
  data: MortalityChartData,
  decimals: string,
  isPercentage: boolean = false
): string | number {
  if (decimals !== 'auto') return decimals
  const values = extractYValues(data)
  // For percentages, compute precision based on displayed values (after *100)
  const displayedValues = isPercentage ? values.map(v => v * 100) : values
  return computeChartPrecision(displayedValues)
}

/**
 * Get maximum decimal places for display
 *
 * When decimals is a number, uses that directly (chart-wide precision for labels).
 * When decimals is 'auto', uses 2 decimals for accurate tooltip display.
 */
function getMaxDecimals(
  y: number,
  short: boolean,
  showDecimals: boolean,
  decimals: string | number = 'auto'
) {
  // If already computed as number (chart-wide precision), use directly
  if (typeof decimals === 'number') {
    return decimals
  }

  if (decimals !== 'auto') {
    return parseInt(decimals)
  }

  // For 'auto' mode (tooltips): always use 2 decimals for accuracy
  return 2
}

/**
 * Get formatted label text with optional prediction interval
 */
export function getLabelText(
  label: string,
  y: number,
  pi: { min: number, max: number } | undefined,
  short: boolean,
  isExcess: boolean,
  isPercentage: boolean,
  showDecimals: boolean,
  decimals: string | number = 'auto'
) {
  let result = label
  const prefix = label.length ? ': ' : ''
  const forcePlusSign = isExcess && !short
  const plusSign = forcePlusSign ? '' : '+'

  if (isPercentage) {
    const yText = asPercentage(
      y,
      getMaxDecimals(y * 100, short, showDecimals, decimals),
      plusSign
    )
    result += `${prefix}${yText}`
    if (pi)
      result += formatCI(short, pi.min, pi.max, n =>
        asPercentage(n, getMaxDecimals(y * 100, short, showDecimals, decimals), plusSign)
      )
  } else {
    const maxDecimals = getMaxDecimals(y, short, showDecimals, decimals)
    const yText = numberWithCommas(y, isExcess, maxDecimals)
    result += `${prefix}${yText}`

    if (pi) {
      const piText = formatCI(short, pi.min, pi.max, n =>
        numberWithCommas(n, isExcess, maxDecimals)
      )
      result += piText
    }
  }

  return result
}
