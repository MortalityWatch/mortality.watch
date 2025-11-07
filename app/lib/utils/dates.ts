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

/**
 * Format a date value from various input formats to a localized date string
 * Handles Date objects, ISO strings, Unix timestamps (seconds), and millisecond timestamps
 *
 * @param value - The date value to format (Date, string, or number)
 * @param locale - The locale to use for formatting (default: 'en-US')
 * @param options - Intl.DateTimeFormat options (default: { year: 'numeric', month: 'short', day: 'numeric' })
 * @returns Formatted date string or 'Invalid date' if parsing fails
 *
 * @example
 * formatChartDate(new Date('2023-01-15')) // 'Jan 15, 2023'
 * formatChartDate('2023-01-15T00:00:00Z') // 'Jan 15, 2023'
 * formatChartDate(1673740800) // 'Jan 15, 2023' (Unix timestamp in seconds)
 * formatChartDate(1673740800000) // 'Jan 15, 2023' (timestamp in milliseconds)
 */
export function formatChartDate(
  value: number | string | Date,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string {
  // Handle different date formats from API
  let date: Date

  if (value instanceof Date) {
    date = value
  } else if (typeof value === 'string') {
    date = new Date(value)
  } else if (typeof value === 'number') {
    // Check if it's Unix timestamp (seconds) or milliseconds
    // Unix timestamps are typically 10 digits, milliseconds are 13
    date = value < 10000000000 ? new Date(value * 1000) : new Date(value)
  } else {
    return 'Invalid date'
  }

  // Validate the date
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return date.toLocaleDateString(locale, options)
}
