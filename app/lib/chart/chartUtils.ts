import { round } from '~/utils'

export { round }

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
  return (
    (forcePlusSign && num > 0 ? '+' : '')
    + rounded.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  )
}
