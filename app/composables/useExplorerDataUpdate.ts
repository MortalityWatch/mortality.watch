import { ref, type Ref } from 'vue'
import {
  getAllChartData,
  getAllChartLabels,
  getStartIndex,
  updateDataset
} from '@/lib/data'
import { getFilteredChartData } from '@/lib/chart'
import { getKeyForType, type NumberEntryFields, type AllChartData, type DatasetRaw, type Country } from '@/model'
import type { MortalityChartData } from '@/lib/chart/chartTypes'
import { DEFAULT_BASELINE_YEAR } from '@/lib/constants'
import {
  arrayBufferToBase64,
  compress
} from '@/lib/compression/compress.browser'

/**
 * Manages data updates for the explorer page
 */
export function useExplorerDataUpdate(
  // State refs
  countries: Ref<string[]>,
  chartType: Ref<string>,
  ageGroups: Ref<string[]>,
  type: Ref<string>,
  showBaseline: Ref<boolean>,
  standardPopulation: Ref<string>,
  baselineMethod: Ref<string>,
  baselineDateFrom: Ref<string>,
  baselineDateTo: Ref<string>,
  dateFrom: Ref<string>,
  dateTo: Ref<string>,
  sliderStart: Ref<string>,
  isExcess: Ref<boolean>,
  cumulative: Ref<boolean>,
  showPredictionInterval: Ref<boolean>,
  showTotal: Ref<boolean>,
  showPercentage: Ref<boolean>,
  maximize: Ref<boolean>,
  showLabels: Ref<boolean>,
  isLogarithmic: Ref<boolean>,
  // Data refs
  allChartLabels: Ref<string[]>,
  allYearlyChartLabels: Ref<string[]>,
  allYearlyChartLabelsUnique: Ref<string[]>,
  allChartData: AllChartData,
  chartData: Ref<MortalityChartData | undefined>,
  // Helper functions
  isAsmrType: () => boolean,
  isBarChartStyle: () => boolean,
  isErrorBarType: () => boolean,
  isMatrixChartStyle: () => boolean,
  isPopulationType: () => boolean,
  isDeathsType: () => boolean,
  showCumPi: () => boolean,
  getBaseKeysForType: () => (keyof NumberEntryFields)[],
  // Data getter/setter
  getDataset: () => DatasetRaw,
  setDataset: (dataset: DatasetRaw) => void,
  // Other refs
  displayColors: Ref<string[]>,
  allCountries: Ref<Record<string, Country>>
) {
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
    if (!allChartData || !allChartData.labels || !allChartData.data) {
      return { datasets: [], labels: [] }
    }

    console.log('[Explorer] Filtering data with countries:', countries.value, 'dateFrom:', dateFrom.value, 'dateTo:', dateTo.value)

    return await getFilteredChartData(
      countries.value,
      standardPopulation.value,
      ageGroups.value,
      showPredictionInterval.value,
      isExcess.value,
      type.value,
      cumulative.value,
      showBaseline.value,
      baselineMethod.value,
      baselineDateFrom.value,
      baselineDateTo.value,
      showTotal.value,
      chartType.value,
      dateFrom.value,
      dateTo.value,
      isBarChartStyle(),
      allCountries.value,
      isErrorBarType(),
      displayColors.value,
      isMatrixChartStyle(),
      showPercentage.value,
      showCumPi(),
      isAsmrType(),
      maximize.value,
      showLabels.value,
      await makeUrl(),
      isLogarithmic.value,
      isPopulationType(),
      isDeathsType(),
      allChartData.labels,
      allChartData.data
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
      console.log('[Explorer] Downloading dataset for countries:', countries.value)
      const dataset = await updateDataset(
        chartType.value,
        countries.value,
        isAsmrType() ? ['all'] : ageGroups.value
      )
      setDataset(dataset)
      console.log('[Explorer] Dataset downloaded, keys:', Object.keys(dataset))

      // All Labels
      allChartLabels.value = getAllChartLabels(
        dataset,
        isAsmrType(),
        ageGroups.value,
        countries.value,
        chartType.value
      )
      console.log('[Explorer] All chart labels:', allChartLabels.value)

      if (chartType.value === 'yearly') {
        allYearlyChartLabels.value = allChartLabels.value
        allYearlyChartLabelsUnique.value = allChartLabels.value.filter(
          x => parseInt(x) <= DEFAULT_BASELINE_YEAR
        )
      } else {
        allYearlyChartLabels.value = Array.from(
          allChartLabels.value.map(v => v.substring(0, 4))
        )
        allYearlyChartLabelsUnique.value = Array.from(
          new Set(allYearlyChartLabels.value)
        ).filter(x => parseInt(x) <= DEFAULT_BASELINE_YEAR)
      }
    }

    if (shouldDownloadDataset || shouldUpdateDataset) {
      // Update all chart specific data
      const key = getKeyForType(
        type.value,
        showBaseline.value,
        standardPopulation.value
      )[0]
      if (!key) return

      console.log('[Explorer] Getting all chart data for countries:', countries.value)
      const newData = await getAllChartData(
        key,
        chartType.value,
        getDataset(),
        allChartLabels.value || [],
        getStartIndex(allYearlyChartLabels.value || [], sliderStart.value),
        showCumPi(),
        ageGroups.value,
        countries.value,
        baselineMethod.value,
        baselineDateFrom.value,
        baselineDateTo.value,
        getBaseKeysForType()
      )
      console.log('[Explorer] newData from getAllChartData:', newData)
      console.log('[Explorer] newData.data keys:', newData.data ? Object.keys(newData.data) : 'undefined')
      Object.assign(allChartData, newData)
      console.log('[Explorer] allChartData after update:', allChartData)
      console.log('[Explorer] allChartData.data keys:', allChartData.data ? Object.keys(allChartData.data) : 'undefined')
    }

    // Update filtered chart datasets
    console.log('[Explorer] Calling updateFilteredData...')
    const filteredData = await updateFilteredData()
    console.log('[Explorer] Filtered data:', filteredData)
    console.log('[Explorer] filteredData.datasets.length:', filteredData.datasets?.length)
    console.log('[Explorer] chartData.value before update:', chartData.value)
    console.log('[Explorer] Updating chartData with new data')
    chartData.value = filteredData as MortalityChartData
    console.log('[Explorer] chartData.value after update:', chartData.value)
    console.log('[Explorer] chartData.value.datasets.length:', chartData.value?.datasets?.length)

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
