/**
 * Date parsing and transformation utilities
 */

export const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

export const maybeTransformFluSeason = (x: string) => {
  if (/^\d{4}-\d{4}$/.test(x)) {
    return `${x.substring(0, 4)}/${x.substring(7, 9)}`
  } else return x
}

export const getYear = (x: string): number => parseInt(x.substring(0, 4))

export const getMonth = (x: string): number => months.indexOf(x.slice(-3))

export const fromYearMonthString = (x: string): number =>
  new Date(getYear(x), getMonth(x)).getTime()
