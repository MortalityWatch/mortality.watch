/**
 * Data Availability Composable
 *
 * Provides reactive data availability checks based on metadata.
 * Auto-corrects invalid selections when data becomes unavailable.
 *
 * Usage:
 *   const state = useExplorerState()
 *   const availability = useDataAvailability(state)
 *
 *   // Use availability.availableChartTypes, availableAgeGroups, etc.
 */

import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { metadataService } from '@/services/metadataService'
import { showToast } from '@/toast'
import type { useExplorerState } from './useExplorerState'
import type { ChartType } from '@/model/period'

export function useDataAvailability(
  state: ReturnType<typeof useExplorerState>
) {
  const route = useRoute()
  const isLoading = ref(true)
  const error = ref<Error | null>(null)

  // Load metadata on mount
  onMounted(async () => {
    try {
      await metadataService.load()
    } catch (e) {
      error.value = e as Error
      showToast('Failed to load data availability metadata', 'error')
      console.error('[useDataAvailability] Failed to load metadata:', e)
    } finally {
      isLoading.value = false
    }
  })

  // Computed: Available chart types for selected countries
  const availableChartTypes = computed(() => {
    if (isLoading.value || !state.countries.value.length) return []
    try {
      return metadataService.getAvailableChartTypes(state.countries.value)
    } catch (e) {
      console.error('[useDataAvailability] Error getting available chart types:', e)
      return []
    }
  })

  // Computed: Available age groups for selected countries + chart type
  const availableAgeGroups = computed(() => {
    if (isLoading.value || !state.countries.value.length) return []
    try {
      return metadataService.getAvailableAgeGroups(
        state.countries.value,
        state.chartType.value
      )
    } catch (e) {
      console.error('[useDataAvailability] Error getting available age groups:', e)
      return []
    }
  })

  // Computed: Available date range for current selection
  const availableDateRange = computed(() => {
    if (isLoading.value || !state.countries.value.length) return null
    try {
      return metadataService.getAvailableDateRange(
        state.countries.value,
        state.chartType.value,
        state.ageGroups.value
      )
    } catch (e) {
      console.error('[useDataAvailability] Error getting available date range:', e)
      return null
    }
  })

  // Auto-correct: Chart type not available
  watch([availableChartTypes, () => state.chartType.value], ([available, current]) => {
    if (isLoading.value) return
    if (available.length > 0 && !available.includes(current)) {
      const newType = available[0] as ChartType | undefined
      if (newType) {
        state.chartType.value = newType
        showToast(
          `Chart type changed to ${newType} (only type available for selected countries)`,
          'warning'
        )
      }
    }
  })

  // Auto-correct: Age groups not available
  watch([availableAgeGroups, () => state.ageGroups.value], ([available, current]) => {
    if (isLoading.value) return
    if (available.length === 0) return

    const invalidGroups = current.filter((g: string) => !available.includes(g))
    if (invalidGroups.length > 0) {
      const validGroups = current.filter((g: string) => available.includes(g))
      const fallback = available[0]
      state.ageGroups.value = validGroups.length > 0 ? validGroups : (fallback ? [fallback] : ['all'])

      showToast('Some age groups not available for selected countries', 'warning')
    }
  })

  // Auto-correct: Dates outside available range
  // Note: For yearly/fluseason/midyear, metadata includes both type 1 (yearly) and type 3 (weekly)
  // data ranges, since we can calculate yearly aggregates from weekly data
  // IMPORTANT: Don't auto-correct if user explicitly set dates via URL parameters
  watch(
    [availableDateRange, () => state.dateFrom.value, () => state.dateTo.value],
    ([range, from, to]) => {
      if (isLoading.value) return
      if (!range) return

      // Check if dates were explicitly set via URL (df = dateFrom, dt = dateTo)
      const dateFromInUrl = !!route.query.df
      const dateToInUrl = !!route.query.dt

      let changed = false
      // Only auto-correct dateFrom if it wasn't explicitly set in URL
      if (!dateFromInUrl && from && from < range.minDate) {
        state.dateFrom.value = range.minDate
        changed = true
      }
      // Only auto-correct dateTo if it wasn't explicitly set in URL
      if (!dateToInUrl && to && to > range.maxDate) {
        state.dateTo.value = range.maxDate
        changed = true
      }
      if (changed) {
        showToast('Date range adjusted to available data', 'info')
      }
    }
  )

  // Feature access for extended time periods
  const { can } = useFeatureAccess()
  const hasExtendedTimeAccess = computed(() => can('EXTENDED_TIME_PERIODS'))

  /**
   * Get the year 2000 start date formatted for the given chart type
   */
  const getYear2000Start = (chartType: ChartType): string => {
    switch (chartType) {
      case 'yearly':
        return '2000'
      case 'midyear':
      case 'fluseason':
        return '1999/00' // These periods span two years, starting in 1999
      case 'quarterly':
        return '2000 Q1'
      case 'monthly':
        return '2000 Jan'
      case 'weekly':
      case 'weekly_13w_sma':
      case 'weekly_26w_sma':
      case 'weekly_52w_sma':
      case 'weekly_104w_sma':
        return '2000 W01'
      default:
        return '2000'
    }
  }

  // Computed: Effective minimum date considering both feature gating and data availability
  const effectiveMinDate = computed(() => {
    // If no data available yet, return null
    if (!availableDateRange.value) return null

    const dataMinDate = availableDateRange.value.minDate

    // For premium users, use the actual data minimum
    if (hasExtendedTimeAccess.value) {
      return dataMinDate
    }

    // For non-premium users, restrict to 2000 or later
    const year2000Start = getYear2000Start(state.chartType.value as ChartType)

    // Return whichever is later: year 2000 or actual data start
    return dataMinDate > year2000Start ? dataMinDate : year2000Start
  })

  return {
    isLoading,
    error,
    availableChartTypes,
    availableAgeGroups,
    availableDateRange,
    effectiveMinDate,
    hasExtendedTimeAccess,
    isAvailable: (country: string, chartType: string, ageGroup: string) =>
      metadataService.isAvailable(country, chartType, ageGroup)
  }
}
