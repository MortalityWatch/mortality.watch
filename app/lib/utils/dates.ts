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

/**
 * Get ISO week number from a date
 * Uses ISO 8601 definition: Week 1 is the week containing the first Thursday of the year
 *
 * @param date - The date to get the week number from
 * @returns Object with year and week number
 */
export function getISOWeek(date: Date): { year: number, week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Set to nearest Thursday: current date + 4 - current day number (makes Sunday=7)
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { year: d.getUTCFullYear(), week: weekNo }
}

/**
 * Get ISO week number from a UTC date
 * Same as getISOWeek but expects the input date to already be in UTC
 * (created via Date.UTC or similar)
 *
 * @param date - A Date object representing a UTC date
 * @returns Object with year and week number
 */
export function getISOWeekFromUTC(date: Date): { year: number, week: number } {
  // Clone the date to avoid mutation
  const d = new Date(date.getTime())
  // Set to nearest Thursday: current date + 4 - current day number (makes Sunday=7)
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { year: d.getUTCFullYear(), week: weekNo }
}

/**
 * Convert an ISO date string (YYYY-MM-DD) to a period format string
 * based on the chart type
 *
 * @param isoDate - ISO date string like "2025-10-15"
 * @param chartType - The chart type to format for
 * @returns Formatted period string like "2025 W42" for weekly
 */
export function isoDateToPeriod(isoDate: string, chartType: string): string {
  const year = parseInt(isoDate.substring(0, 4))

  switch (chartType) {
    case 'weekly':
    case 'weekly_104w_sma':
    case 'weekly_52w_sma':
    case 'weekly_26w_sma':
    case 'weekly_13w_sma': {
      // Parse ISO date components directly to avoid timezone issues
      // new Date('2025-12-15') is parsed as UTC midnight, but getFullYear/Month/Date
      // return local time values, causing off-by-one day errors in some timezones
      const month = parseInt(isoDate.substring(5, 7)) - 1 // 0-indexed
      const day = parseInt(isoDate.substring(8, 10))
      const date = new Date(Date.UTC(year, month, day))
      const { year: isoYear, week } = getISOWeekFromUTC(date)
      return `${isoYear} W${week.toString().padStart(2, '0')}`
    }
    case 'monthly': {
      const month = parseInt(isoDate.substring(5, 7))
      return `${year} ${months[month - 1]}`
    }
    case 'quarterly': {
      const month = parseInt(isoDate.substring(5, 7))
      const quarter = Math.ceil(month / 3)
      return `${year} Q${quarter}`
    }
    // Note: fluseason/midyear are not handled here because they require special
    // semantic handling (the ISO date represents the END of the season, not start).
    // Use getSeasonString() from baseline.ts for those chart types.
    default:
      return `${year}`
  }
}
