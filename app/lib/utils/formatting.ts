/**
 * Number and text formatting utilities
 */

export const round = (num: number, decimals = 0): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

export const roundToStr = (num: number, decimals = 0): string => {
  return round(num, decimals).toFixed(decimals)
}

export const asPercentage = (
  value: number,
  decimals = 0,
  positivePrefix = '+',
  negativePrefix = ''
) => {
  const val = round(value * 100, decimals)
  return `${(val > 0 ? positivePrefix : negativePrefix) + val.toFixed(decimals)}%`
}

export const numberWithCommas = (
  x: number | string,
  forcePlusSign = false,
  decimals = 1
) => {
  const num = typeof x === 'number' ? x : parseFloat(x)
  const rounded = Number(num.toFixed(decimals))
  return (forcePlusSign && num > 0 ? '+' : '')
    + rounded.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
}

export const abbrev = (str: string, n = 20) => {
  if (str.length <= n - 2) return str
  return str.substring(0, n - 3) + '..'
}
