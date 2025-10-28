import { ref } from 'vue'
import {
  getAllChartData,
  getAllChartLabels,
  getStartIndex,
  updateDataset
} from '@/lib/data'
import { getFilteredChartData } from '@/lib/chart'
import { getKeyForType } from '@/model'
import type { MortalityChartData } from '@/lib/chart/chartTypes'
import { DEFAULT_BASELINE_YEAR } from '@/lib/constants'
import {
  arrayBufferToBase64,
  compress
} from '@/lib/compression/compress.browser'
import type { UseExplorerDataUpdateConfig } from './useExplorerDataUpdate.types'

/**
 * Manages data updates for the explorer page
 *
 * ✅ PHASE 8.5.2 COMPLETE: Refactored to use configuration object pattern
 *
 * **Problem Solved:**
 * Previously required 30+ individual parameters which caused TypeScript error:
 * "Type instantiation is excessively deep and possibly infinite"
 *
 * **Solution:**
 * Groups parameters into logical configuration objects:
 * - state: Chart configuration state (20 params)
 * - data: Chart labels and data (5 params)
 * - helpers: Type predicates and utilities (8 params)
 * - dataset: Dataset getter/setter (2 params)
 * - config: Additional configuration (2 params)
 *
 * **Benefits:**
 * - ✅ TypeScript compilation successful (no more deep instantiation errors)
 * - ✅ Improved code readability and organization
 * - ✅ Self-documenting interface names
 * - ✅ Easier to test and maintain
 * - ✅ Ready for integration into explorer.vue
 *
 * **Integration Notes:**
 * To use in explorer.vue, create a config object and pass all required dependencies.
 * See useExplorerDataUpdate.types.ts for interface definitions.
 * Explorer-specific hooks (resetBaselineDates, resetDates, configureOptions)
 * should be called separately in explorer.vue's wrapper function.
 */
export function useExplorerDataUpdate(config: UseExplorerDataUpdateConfig) {
  const isUpdating = ref<boolean>(false)
  const showLoadingOverlay = ref<boolean>(false)
  let loadingTimeout: ReturnType<typeof setTimeout> | null = null

  const makeUrl = async () => {
    const base = 'https://mortality.watch/?qr='
    const query = JSON.stringify(window.location)
    const encodedQuery = arrayBufferToBase64(await compress(query))
    return base + encodeURIComponent(encodedQuery)
  }

  const updateFilteredData = async () => {
    if (!config.data.allChartData || !config.data.allChartData.labels || !config.data.allChartData.data) {
      return { datasets: [], labels: [] }
    }

    console.log('[Explorer] Filtering data with countries:', config.state.countries.value, 'dateFrom:', config.state.dateFrom.value, 'dateTo:', config.state.dateTo.value)

    return await getFilteredChartData(
      config.state.countries.value,
      config.state.standardPopulation.value,
      config.state.ageGroups.value,
      config.state.showPredictionInterval.value,
      config.state.isExcess.value,
      config.state.type.value,
      config.state.cumulative.value,
      config.state.showBaseline.value,
      config.state.baselineMethod.value,
      config.state.baselineDateFrom.value,
      config.state.baselineDateTo.value,
      config.state.showTotal.value,
      config.state.chartType.value,
      config.state.dateFrom.value,
      config.state.dateTo.value,
      config.helpers.isBarChartStyle(),
      config.config.allCountries.value,
      config.helpers.isErrorBarType(),
      config.config.displayColors.value,
      config.helpers.isMatrixChartStyle(),
      config.state.showPercentage.value,
      config.helpers.showCumPi(),
      config.helpers.isAsmrType(),
      config.state.maximize.value,
      config.state.showLabels.value,
      await makeUrl(),
      config.state.isLogarithmic.value,
      config.helpers.isPopulationType(),
      config.helpers.isDeathsType(),
      config.data.allChartData.labels,
      config.data.allChartData.data
    )
  }

  const updateData = async (
    shouldDownloadDataset: boolean,
    shouldUpdateDataset: boolean
  ) => {
    console.log('[Explorer] updateData called:', { shouldDownloadDataset, shouldUpdateDataset })
    isUpdating.value = true

    // Only show loading overlay if update takes longer than 500ms
    loadingTimeout = setTimeout(() => {
      showLoadingOverlay.value = true
    }, 500)

    if (shouldDownloadDataset) {
      console.log('[Explorer] Downloading dataset for countries:', config.state.countries.value)
      const dataset = await updateDataset(
        config.state.chartType.value,
        config.state.countries.value,
        config.helpers.isAsmrType() ? ['all'] : config.state.ageGroups.value
      )
      config.dataset.set(dataset)
      console.log('[Explorer] Dataset downloaded, keys:', Object.keys(dataset))

      // All Labels
      config.data.allChartLabels.value = getAllChartLabels(
        dataset,
        config.helpers.isAsmrType(),
        config.state.ageGroups.value,
        config.state.countries.value,
        config.state.chartType.value
      )
      console.log('[Explorer] All chart labels:', config.data.allChartLabels.value)

      if (config.state.chartType.value === 'yearly') {
        config.data.allYearlyChartLabels.value = config.data.allChartLabels.value
        config.data.allYearlyChartLabelsUnique.value = config.data.allChartLabels.value.filter(
          x => parseInt(x) <= DEFAULT_BASELINE_YEAR
        )
      } else {
        config.data.allYearlyChartLabels.value = Array.from(
          config.data.allChartLabels.value.map(v => v.substring(0, 4))
        )
        config.data.allYearlyChartLabelsUnique.value = Array.from(
          new Set(config.data.allYearlyChartLabels.value)
        ).filter(x => parseInt(x) <= DEFAULT_BASELINE_YEAR)
      }
    }

    if (shouldDownloadDataset || shouldUpdateDataset) {
      // Update all chart specific data
      const key = getKeyForType(
        config.state.type.value,
        config.state.showBaseline.value,
        config.state.standardPopulation.value
      )[0]
      if (!key) return

      console.log('[Explorer] Getting all chart data for countries:', config.state.countries.value)
      const newData = await getAllChartData(
        key,
        config.state.chartType.value,
        config.dataset.get(),
        config.data.allChartLabels.value || [],
        getStartIndex(config.data.allYearlyChartLabels.value || [], config.state.sliderStart.value),
        config.helpers.showCumPi(),
        config.state.ageGroups.value,
        config.state.countries.value,
        config.state.baselineMethod.value,
        config.state.baselineDateFrom.value,
        config.state.baselineDateTo.value,
        config.helpers.getBaseKeysForType()
      )
      console.log('[Explorer] newData from getAllChartData:', newData)
      console.log('[Explorer] newData.data keys:', newData.data ? Object.keys(newData.data) : 'undefined')
      Object.assign(config.data.allChartData, newData)
      console.log('[Explorer] allChartData after update:', config.data.allChartData)
      console.log('[Explorer] allChartData.data keys:', config.data.allChartData.data ? Object.keys(config.data.allChartData.data) : 'undefined')
    }

    // Update filtered chart datasets
    console.log('[Explorer] Calling updateFilteredData...')
    const filteredData = await updateFilteredData()
    console.log('[Explorer] Filtered data:', filteredData)
    console.log('[Explorer] filteredData.datasets.length:', filteredData.datasets?.length)
    console.log('[Explorer] chartData.value before update:', config.data.chartData.value)
    console.log('[Explorer] Updating chartData with new data')
    config.data.chartData.value = filteredData as MortalityChartData
    console.log('[Explorer] chartData.value after update:', config.data.chartData.value)
    console.log('[Explorer] chartData.value.datasets.length:', config.data.chartData.value?.datasets?.length)

    // Clear the loading timeout and hide overlay
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
      loadingTimeout = null
    }
    showLoadingOverlay.value = false

    console.log('[Explorer] updateData completed, isUpdating = false')
    isUpdating.value = false
  }

  return {
    isUpdating,
    showLoadingOverlay,
    updateData,
    updateFilteredData
  }
}
