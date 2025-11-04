/**
 * Chart Label Formatting Functions
 *
 * Functions for formatting chart labels, tooltips, and axis ticks
 */

import { asPercentage, numberWithCommas, round } from '../chartUtils'

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
  return short
    ? Math.max(0, 3 - Math.min(3, round(y).toString().length))
    : showDecimals
      ? 1
      : 0
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
