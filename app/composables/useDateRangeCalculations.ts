/**
 * Date Range Calculations Composable
 *
 * Single source of truth for all date-related calculations in the explorer.
 * Consolidates feature gating logic from DateRangePicker, DateSlider, and useDataAvailability.
 */

import type { ChartType } from '~/model/period'
import type { Ref, ComputedRef } from 'vue'
import { ChartPeriod } from '~/model/period'

export interface DateRangeCalculations {
  // Available data (from metadata/fetch)
  availableLabels: ComputedRef<string[]>
  availableRange: ComputedRef<{ min: string, max: string } | null>

  // Visible on slider (respects sliderStart + feature gating)
  visibleLabels: ComputedRef<string[]>
  visibleRange: ComputedRef<{ min: string, max: string } | null>

  // Currently selected
  selectedRange: ComputedRef<{ from: string | null, to: string | null }>

  // Utilities
  isValidDate: (date: string) => boolean
  getDefaultRange: () => { from: string, to: string }
  findClosestYearLabel: (targetYear: string, preferLast?: boolean) => string | null
  matchDateToLabel: (currentDate: string | null | undefined, preferLast: boolean) => string | null

  // Feature gating
  hasExtendedTimeAccess: ComputedRef<boolean>
  effectiveMinDate: ComputedRef<string | null>
}

/**
 * Get the year 2000 start date formatted for the given chart type
 *
 * For non-premium users, we restrict data access to year 2000 or later.
 * Different chart types have different label formats for the year 2000.
 *
 * Note: midyear/fluseason return '1999/00' (not '2000/01') because:
 * - The period spans late 1999 to early 2000, so it includes year 2000 data
 * - Using '2000/01' would exclude the entire year 2000 (starts late 2000)
 * - This is the earliest period that contains any year 2000 data
 */
const getYear2000Start = (chartType: ChartType): string => {
  switch (chartType) {
    case 'yearly':
      return '2000'
    case 'midyear':
    case 'fluseason':
      return '1999/00' // Earliest period containing year 2000 data
    case 'quarterly':
      return '2000 Q1'
    case 'monthly':
      return '2000 Jan'
    case 'weekly':
    case 'weekly_13w_sma':
    case 'weekly_26w_sma':
    case 'weekly_52w_sma':
    case 'weekly_104w_sma':
      return '2000-W01'
    default:
      return '2000'
  }
}

/**
 * Get starting index for sliderStart within allLabels
 *
 * Uses ChartPeriod for smart index lookup with automatic fallback.
 * This handles cases where sliderStart (e.g., "2010") doesn't exactly match
 * label format (e.g., "2010/11" for fluseason).
 *
 * @param allLabels - All available labels (must be sorted chronologically)
 * @param sliderStart - The start date for the slider (null returns 0)
 * @param chartType - Chart type for proper period handling
 * @returns Index where sliderStart begins, or 0 if not found
 */
const getStartIndex = (
  allLabels: string[],
  sliderStart: string | null,
  chartType: ChartType
): number => {
  if (!sliderStart || allLabels.length === 0) return 0

  // Use ChartPeriod for smart index lookup with fallback
  const period = new ChartPeriod(allLabels, chartType)
  return period.indexOf(sliderStart)
}

/**
 * Date Range Calculations Composable
 *
 * Provides centralized date range logic for the explorer and ranking pages.
 *
 * @param chartType - Current chart type (yearly, monthly, weekly, etc.)
 * @param sliderStart - Start date for the slider (affects visibleLabels)
 * @param dateFrom - Selected start date
 * @param dateTo - Selected end date
 * @param allLabels - All available date labels from data
 * @returns DateRangeCalculations interface
 */
export function useDateRangeCalculations(
  chartType: Ref<string>,
  sliderStart: Ref<string | null>,
  dateFrom: Ref<string | null | undefined>,
  dateTo: Ref<string | null | undefined>,
  allLabels: Ref<string[]>
): DateRangeCalculations {
  // Feature access for extended time periods (year 2000 restriction)
  const { can } = useFeatureAccess()
  const hasExtendedTimeAccess = computed(() => can('EXTENDED_TIME_PERIODS'))

  /**
   * Available labels: All labels from data
   * This is the full dataset before any filtering
   * Filter out any undefined/null values for safety
   */
  const availableLabels = computed(() => (allLabels.value || []).filter(l => l != null))

  /**
   * Available range: Min and max dates from availableLabels
   */
  const availableRange = computed(() => {
    const labels = availableLabels.value
    if (labels.length === 0) return null

    return {
      min: labels[0]!,
      max: labels[labels.length - 1]!
    }
  })

  /**
   * Effective minimum date considering both feature gating and data availability
   *
   * For non-premium users, restricts to year 2000 or later.
   * For premium users, uses actual data minimum.
   */
  const effectiveMinDate = computed(() => {
    const range = availableRange.value
    if (!range) return null

    const dataMinDate = range.min

    // For premium users, use the actual data minimum
    if (hasExtendedTimeAccess.value) {
      return dataMinDate
    }

    // For non-premium users, restrict to 2000 or later
    const year2000Start = getYear2000Start(chartType.value as ChartType)

    // Return whichever is later: year 2000 or actual data start
    return dataMinDate > year2000Start ? dataMinDate : year2000Start
  })

  /**
   * Visible labels: Labels after applying sliderStart and feature gating
   *
   * This represents what should be shown on the slider and date picker.
   * Applies:
   * 1. sliderStart filtering (slice from sliderStart onwards)
   * 2. Year 2000 restriction for non-premium users
   */
  const visibleLabels = computed(() => {
    const labels = availableLabels.value
    if (labels.length === 0) return []

    // Apply sliderStart filter
    const startIndex = getStartIndex(labels, sliderStart.value, chartType.value as ChartType)
    let filtered = labels.slice(startIndex)

    // Apply year 2000 restriction for non-premium users
    if (!hasExtendedTimeAccess.value) {
      const minDate = effectiveMinDate.value
      if (minDate) {
        const minIndex = filtered.indexOf(minDate)
        if (minIndex >= 0) {
          filtered = filtered.slice(minIndex)
        } else {
          // Fallback: Filter by year >= 2000 if exact minDate not found
          // This safety net handles edge cases where:
          // 1. effectiveMinDate format doesn't match actual label format
          // 2. Data is incomplete and effectiveMinDate isn't in the dataset
          // In normal operation with complete data, this branch shouldn't execute
          filtered = filtered.filter((label) => {
            if (!label || typeof label !== 'string') return false
            const year = parseInt(label.substring(0, 4))
            return year >= 2000
          })
        }
      }
    }

    return filtered
  })

  /**
   * Visible range: Min and max dates from visibleLabels
   */
  const visibleRange = computed(() => {
    const labels = visibleLabels.value
    if (labels.length === 0) return null

    return {
      min: labels[0]!,
      max: labels[labels.length - 1]!
    }
  })

  /**
   * Selected range: Current user selection (dateFrom/dateTo)
   */
  const selectedRange = computed(() => ({
    from: dateFrom.value ?? null,
    to: dateTo.value ?? null
  }))

  /**
   * Check if a date is valid (exists in visibleLabels)
   *
   * @param date - Date string to check
   * @returns true if date exists in visibleLabels
   */
  const isValidDate = (date: string): boolean => {
    return visibleLabels.value.includes(date)
  }

  /**
   * Find the closest available year in visibleLabels
   *
   * @param targetYear - Target year to find (e.g., "2020")
   * @param preferLast - If true, return last label for year; otherwise return first
   * @returns Closest matching label, or null if no labels available
   */
  const findClosestYearLabel = (targetYear: string, preferLast: boolean = false): string | null => {
    const labels = visibleLabels.value
    if (labels.length === 0) return null

    const targetYearNum = parseInt(targetYear)
    const availableYears = Array.from(new Set(
      labels
        .filter(l => l && typeof l === 'string')
        .map(l => parseInt(l.substring(0, 4)))
    ))

    // Find the closest year
    const closestYear = availableYears.reduce((prev, curr) =>
      Math.abs(curr - targetYearNum) < Math.abs(prev - targetYearNum) ? curr : prev
    )

    // Find labels for that year
    const yearLabels = labels.filter(l => l.startsWith(closestYear.toString()))
    if (yearLabels.length === 0) return null

    return preferLast ? yearLabels[yearLabels.length - 1]! : yearLabels[0]!
  }

  /**
   * Match a date to the closest available label by year
   *
   * Tries to preserve user's selected year when switching chart types.
   *
   * @param currentDate - Current date to match
   * @param preferLast - If true, prefer last label of year; otherwise prefer first
   * @returns Matched label or null if currentDate is null/undefined
   */
  const matchDateToLabel = (currentDate: string | null | undefined, preferLast: boolean): string | null => {
    if (!currentDate) return null

    const labels = visibleLabels.value
    if (labels.length === 0) return null

    // If exact match exists, return it
    if (labels.includes(currentDate)) return currentDate

    // Try to find label with same year
    const year = currentDate.substring(0, 4)
    const matchingLabels = labels.filter(l => l.startsWith(year))

    if (matchingLabels.length > 0) {
      return preferLast ? matchingLabels[matchingLabels.length - 1]! : matchingLabels[0]!
    }

    // Fall back to closest year
    return findClosestYearLabel(year, preferLast)
  }

  /**
   * Get default date range based on visibleLabels
   *
   * Returns the last N periods (where N = DEFAULT_PERIODS from config).
   * Falls back to full range if fewer labels are available.
   *
   * @returns Object with from and to dates
   */
  const getDefaultRange = (): { from: string, to: string } => {
    const labels = visibleLabels.value

    if (labels.length === 0) {
      return { from: '', to: '' }
    }

    // Calculate default periods based on chart type
    // Target: approximately 10 years of recent data
    const type = chartType.value as ChartType
    let DEFAULT_PERIODS: number

    if (type === 'weekly' || type.startsWith('weekly_')) {
      DEFAULT_PERIODS = 520 // 10 years of weeks
    } else if (type === 'monthly') {
      DEFAULT_PERIODS = 120 // 10 years of months
    } else if (type === 'quarterly') {
      DEFAULT_PERIODS = 40 // 10 years of quarters
    } else {
      // yearly, midyear, fluseason
      DEFAULT_PERIODS = 10 // 10 years
    }

    const startIndex = Math.max(0, labels.length - DEFAULT_PERIODS)

    const result = {
      from: labels[startIndex]!,
      to: labels[labels.length - 1]!
    }

    // Debug logging
    console.log('[getDefaultRange]', {
      totalLabels: labels.length,
      DEFAULT_PERIODS,
      startIndex,
      result,
      firstLabel: labels[0],
      lastLabel: labels[labels.length - 1]
    })

    return result
  }

  return {
    // Available data
    availableLabels,
    availableRange,

    // Visible on slider
    visibleLabels,
    visibleRange,

    // Currently selected
    selectedRange,

    // Utilities
    isValidDate,
    getDefaultRange,
    findClosestYearLabel,
    matchDateToLabel,

    // Feature gating
    hasExtendedTimeAccess,
    effectiveMinDate
  }
}
