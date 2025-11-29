/**
 * Chart Label Formatting Functions
 *
 * Functions for formatting chart labels, tooltips, and axis ticks
 */

import { asPercentage, numberWithCommas } from '../chartUtils'

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
 * Get maximum decimal places for display
 *
 * Uses magnitude-aware precision for 'auto' mode:
 * - 100+: no decimals (e.g., 100)
 * - 10-100: 1 decimal (e.g., 90.1)
 * - 1-10: 1 decimal (e.g., 9.1)
 * - <1: 2 decimals (e.g., 0.91)
 */
function getMaxDecimals(
  y: number,
  short: boolean,
  showDecimals: boolean,
  decimals: string = 'auto'
) {
  if (decimals !== 'auto') {
    return parseInt(decimals)
  }

  // For non-short mode, use existing behavior
  if (!short) {
    return showDecimals ? 1 : 0
  }

  // For short mode (tooltips, etc.), use magnitude-aware precision
  const absY = Math.abs(y)
  if (absY >= 100) return 0
  if (absY >= 1) return 1
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
  decimals: string = 'auto'
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
