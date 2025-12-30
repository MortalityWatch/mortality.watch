/**
 * Shared baseline calculation logic
 *
 * This module contains pure calculation functions used by both client and server
 * baseline calculations. By sharing this code, we ensure consistent behavior
 * between SSR (chart.png) and client-side rendering.
 */

import type {
  DatasetEntry,
  NumberArray
} from '@/model'

/**
 * Cumulative sum helper starting from a specific index
 * Values before startIdx are kept as undefined
 */
export const cumulativeSumFrom = (arr: NumberArray, startIdx: number): NumberArray => {
  const result: NumberArray = []
  let prev = 0
  for (let i = 0; i < arr.length; i++) {
    if (i < startIdx) {
      result.push(undefined)
    } else {
      const val = arr[i] ?? 0
      const curr = prev + val
      result.push(curr)
      if (!isNaN(val)) prev = curr
    }
  }
  return result
}

/**
 * Calculate excess mortality from baseline data
 * @param isBaselineCumulative - When true, baseline values are already cumulative (from /cum endpoint)
 *                               and observed values need to be cumulated before subtraction
 * @param baselineStartIdx - Index where baseline data starts (for cumulative alignment)
 */
export const calculateExcess = (
  data: DatasetEntry,
  key: keyof DatasetEntry,
  isBaselineCumulative = false,
  baselineStartIdx = 0
): void => {
  let currentValues = data[key] as NumberArray
  const baseline = data[`${key}_baseline` as keyof DatasetEntry] as NumberArray

  // When baseline is already cumulative (from /cum endpoint),
  // we need to cumulate observed values to match, starting from baselineStartIdx
  if (isBaselineCumulative) {
    currentValues = cumulativeSumFrom(currentValues, baselineStartIdx)
  }
  const baselineLower = data[
    `${key}_baseline_lower` as keyof DatasetEntry
  ] as NumberArray
  const baselineUpper = data[
    `${key}_baseline_upper` as keyof DatasetEntry
  ] as NumberArray

  // Ensure arrays are initialized
  if (!data[`${key}_excess` as keyof DatasetEntry])
    data[`${key}_excess` as keyof DatasetEntry] = []
  if (!data[`${key}_excess_lower` as keyof DatasetEntry])
    data[`${key}_excess_lower` as keyof DatasetEntry] = []
  if (!data[`${key}_excess_upper` as keyof DatasetEntry])
    data[`${key}_excess_upper` as keyof DatasetEntry] = []

  const excess = data[`${key}_excess` as keyof DatasetEntry] as NumberArray | undefined
  const excessLower = data[`${key}_excess_lower` as keyof DatasetEntry] as NumberArray | undefined
  const excessUpper = data[`${key}_excess_upper` as keyof DatasetEntry] as NumberArray | undefined

  if (!excess || !excessLower || !excessUpper) return

  for (let i = 0; i < currentValues.length; i++) {
    const currentValue = currentValues[i]
    const base = baseline[i]
    const baseLower = baselineLower[i]
    const baseUpper = baselineUpper[i]

    // Pre-baseline periods have null baseline - excess cannot be calculated
    // Also handle missing current values
    if (base === null || base === undefined || currentValue === null || currentValue === undefined) {
      excess[i] = undefined
      excessLower[i] = undefined
      excessUpper[i] = undefined
    } else {
      excess[i] = currentValue - base
      // Propagate undefined for periods where PI is not calculated (baseline period)
      excessLower[i] = baseLower !== undefined && baseLower !== null ? currentValue - baseLower : undefined
      excessUpper[i] = baseUpper !== undefined && baseUpper !== null ? currentValue - baseUpper : undefined
    }
  }
}

/**
 * Get season type based on chart type
 * Used by stats API to determine seasonality parameter
 */
export const getSeasonType = (chartType: string): number => {
  switch (chartType) {
    case 'weekly':
    case 'weekly_104w_sma':
    case 'weekly_52w_sma':
    case 'weekly_26w_sma':
    case 'weekly_13w_sma':
      return 4
    case 'monthly':
      return 3
    case 'quarterly':
      return 2
    default:
      return 1
  }
}

/**
 * Convert a chart label to the xs (start time) parameter format for the stats API
 *
 * Label formats by chart type:
 * - Weekly: "2020 W01" -> "2020W01"
 * - Monthly: "2020 Jan" -> "2020-01"
 * - Quarterly: "2020 Q1" -> "2020Q1"
 * - Yearly: "2020" -> "2020"
 * - Fluseason/midyear: "2019/20" -> "2019" (use start year)
 */
export const labelToXsParam = (label: string, chartType: string): string | null => {
  if (!label) return null

  // Weekly: "2020 W01" -> "2020W01"
  if (chartType.startsWith('weekly')) {
    const match = label.match(/^(\d{4})\s*W(\d{2})$/)
    if (match) {
      return `${match[1]}W${match[2]}`
    }
    return null
  }

  // Monthly: "2020 Jan" -> "2020-01"
  if (chartType === 'monthly') {
    const months: Record<string, string> = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04',
      May: '05', Jun: '06', Jul: '07', Aug: '08',
      Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    }
    const match = label.match(/^(\d{4})\s+(\w{3})$/)
    if (match && match[1] && match[2] && months[match[2]]) {
      return `${match[1]}-${months[match[2]]}`
    }
    return null
  }

  // Quarterly: "2020 Q1" -> "2020Q1"
  if (chartType === 'quarterly') {
    const match = label.match(/^(\d{4})\s*Q(\d)$/)
    if (match && match[1] && match[2]) {
      return `${match[1]}Q${match[2]}`
    }
    return null
  }

  // Fluseason/midyear: "2019/20" -> "2019" (use start year, treated as yearly)
  if (chartType === 'fluseason' || chartType === 'midyear') {
    const match = label.match(/^(\d{4})\/\d{2}$/)
    if (match && match[1]) {
      return match[1]
    }
    return null
  }

  // Yearly: "2020" -> "2020"
  const yearMatch = label.match(/^(\d{4})$/)
  if (yearMatch && yearMatch[1]) {
    return yearMatch[1]
  }

  return null
}
