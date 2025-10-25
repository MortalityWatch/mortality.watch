import type { Ref } from 'vue'
import type { AllChartData, Country, DatasetRaw } from '@/model'
import {
  getAllChartData,
  getAllChartLabels,
  getStartIndex,
  loadCountryMetadata,
  updateDataset
} from '@/lib/data'
import { getKeyForType } from '@/model'
import { DEFAULT_BASELINE_YEAR } from '@/lib/constants'

interface ChartDataLoaderOptions {
  chartType: Ref<string>
  countries: Ref<string[]>
  ageGroups: Ref<string[]>
  type: Ref<string>
  showBaseline: Ref<boolean>
  standardPopulation: Ref<string>
  baselineMethod: Ref<string>
  baselineDateFrom: Ref<string>
  baselineDateTo: Ref<string>
  sliderStart: Ref<string>
  cumulative: Ref<boolean>
  isAsmrType: () => boolean
}

interface _ChartDataState {
  allCountries: Ref<Record<string, Country>>
  dataset: DatasetRaw | undefined
  allChartLabels: Ref<string[]>
  allYearlyChartLabels: Ref<string[]>
  allYearlyChartLabelsUnique: Ref<string[]>
  allChartData: AllChartData | undefined
}

/**
 * Composable for loading and managing chart data
 * Shared logic between explorer and ranking pages
 */
export function useChartDataLoader(options: ChartDataLoaderOptions) {
  const {
    chartType,
    countries,
    ageGroups,
    type,
    showBaseline,
    standardPopulation,
    baselineMethod,
    baselineDateFrom,
    baselineDateTo,
    sliderStart,
    cumulative,
    isAsmrType
  } = options

  const allCountries = ref<Record<string, Country>>({})
  let dataset: DatasetRaw | undefined
  const allChartLabels = ref<string[]>([])
  const allYearlyChartLabels = ref<string[]>([])
  const allYearlyChartLabelsUnique = ref<string[]>([])
  let allChartData: AllChartData | undefined

  /**
   * Load country metadata
   */
  const loadMetadata = async () => {
    // Load all metadata, then filter client-side
    const allMetadata = await loadCountryMetadata()
    const { filterCountries } = useCountryFilter()

    if (filterCountries.length > 0) {
      const filtered: Record<string, Country> = {}
      for (const [iso, country] of Object.entries(allMetadata)) {
        if (filterCountries.includes(iso)) {
          filtered[iso] = country
        }
      }
      allCountries.value = filtered
    } else {
      allCountries.value = allMetadata
    }
  }

  /**
   * Check if chart type is yearly-based
   */
  const isYearlyChartType = () =>
    chartType.value.includes('year')
    || chartType.value.includes('fluseason')
    || chartType.value.includes('midyear')

  /**
   * Check if cumulative prediction interval should be shown
   */
  const showCumPi = (): boolean =>
    cumulative.value
    && isYearlyChartType()
    && ['lin_reg', 'mean'].includes(baselineMethod.value)

  /**
   * Update dataset and labels
   */
  const updateDatasetAndLabels = async () => {
    dataset = await updateDataset(
      chartType.value,
      countries.value,
      isAsmrType() ? ['all'] : ageGroups.value
    )

    // All Labels
    allChartLabels.value = getAllChartLabels(
      dataset,
      isAsmrType(),
      ageGroups.value,
      countries.value,
      chartType.value
    )

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

  /**
   * Update all chart data
   */
  const updateAllChartData = async () => {
    if (!dataset) return

    const key = getKeyForType(
      type.value,
      showBaseline.value,
      standardPopulation.value
    )[0]

    if (!key) return

    const baseKeys = getKeyForType(
      type.value,
      showBaseline.value,
      standardPopulation.value,
      false
    )

    const newData = await getAllChartData(
      key,
      chartType.value,
      dataset,
      allChartLabels.value || [],
      getStartIndex(allYearlyChartLabels.value || [], sliderStart.value),
      showCumPi(),
      ageGroups.value,
      countries.value,
      baselineMethod.value,
      baselineDateFrom.value,
      baselineDateTo.value,
      baseKeys
    )

    if (allChartData) {
      Object.assign(allChartData, newData)
    } else {
      allChartData = newData
    }

    return allChartData
  }

  return {
    allCountries,
    allChartLabels,
    allYearlyChartLabels,
    allYearlyChartLabelsUnique,
    loadMetadata,
    updateDatasetAndLabels,
    updateAllChartData,
    showCumPi,
    getDataset: () => dataset,
    getAllChartData: () => allChartData
  }
}
