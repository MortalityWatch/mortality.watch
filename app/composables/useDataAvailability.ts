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
import { metadataService } from '@/services/metadataService'
import { showToast } from '@/toast'
import type { useExplorerState } from './useExplorerState'

export function useDataAvailability(
  state: ReturnType<typeof useExplorerState>
) {
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
      const newType = available[0]
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
  watch(
    [availableDateRange, () => state.dateFrom.value, () => state.dateTo.value],
    ([range, from, to]) => {
      if (isLoading.value) return
      if (!range) return

      let changed = false
      if (from && from < range.minDate) {
        state.dateFrom.value = range.minDate
        changed = true
      }
      if (to && to > range.maxDate) {
        state.dateTo.value = range.maxDate
        changed = true
      }
      if (changed) {
        showToast('Date range adjusted to available data', 'info')
      }
    }
  )

  return {
    isLoading,
    error,
    availableChartTypes,
    availableAgeGroups,
    availableDateRange,
    isAvailable: (country: string, chartType: string, ageGroup: string) =>
      metadataService.isAvailable(country, chartType, ageGroup)
  }
}
