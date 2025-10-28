import type { Ref } from 'vue'
import {
  getAllChartLabels,
  getStartIndex,
  loadCountryMetadata,
  getAllChartData,
  updateDataset
} from '@/lib/data'
import { getFilteredChartData } from '@/lib/chart'
import { getKeyForType } from '@/model'
import type {
  DatasetRaw,
  AllChartData,
  Country,
  NumberEntryFields
} from '@/model'
import type { MortalityChartData } from '@/lib/chart/chartTypes'
import type { StateProperties } from '@/model/state/stateProperties'
import type { ChartType } from '@/model/period'

/**
 * Data service for managing chart data fetching and updates
 *
 * Separates data fetching concerns from state management,
 * making it easier to test and maintain.
 */
export class DataService {
  /**
   * Update dataset and all chart data
   *
   * @param props - State properties
   * @param allCountries - Country metadata
   * @param dataset - Current dataset (will be updated)
   * @param allChartLabels - Ref to all chart labels
   * @param allYearlyChartLabels - Ref to all yearly labels
   * @param allYearlyChartLabelsUnique - Ref to unique yearly labels
   * @param allChartData - All chart data object to update
   * @param shouldDownloadDataset - Whether to fetch new dataset
   * @param shouldUpdateDataset - Whether to update chart data
   * @param helpers - Helper functions
   */
  async updateData(
    props: StateProperties,
    allCountries: Record<string, Country>,
    dataset: DatasetRaw | undefined,
    allChartLabels: Ref<string[] | undefined>,
    allYearlyChartLabels: Ref<string[] | undefined>,
    allYearlyChartLabelsUnique: Ref<string[] | undefined>,
    allChartData: AllChartData,
    shouldDownloadDataset: boolean,
    shouldUpdateDataset: boolean,
    helpers: {
      isAsmrType: () => boolean
      showCumPi: () => boolean
      getBaseKeysForType: () => (keyof NumberEntryFields)[]
    }
  ): Promise<DatasetRaw> {
    let currentDataset = dataset

    if (shouldDownloadDataset) {
      currentDataset = await updateDataset(
        props.chartType as ChartType,
        props.countries,
        helpers.isAsmrType() ? ['all'] : props.ageGroups
      )

      // All Labels
      allChartLabels.value = getAllChartLabels(
        currentDataset,
        helpers.isAsmrType(),
        props.ageGroups,
        props.countries,
        props.chartType as ChartType
      )

      if (props.chartType === 'yearly') {
        allYearlyChartLabels.value = allChartLabels.value
        allYearlyChartLabelsUnique.value = allChartLabels.value.filter(
          x => parseInt(x) <= 2017
        )
      } else {
        allYearlyChartLabels.value = Array.from(
          allChartLabels.value.map(v => v.substring(0, 4))
        )
        allYearlyChartLabelsUnique.value = Array.from(
          new Set(allYearlyChartLabels.value)
        ).filter(x => parseInt(x) <= 2017)
      }
    }

    if (!currentDataset) {
      throw new Error('Dataset not loaded')
    }

    if (shouldDownloadDataset || shouldUpdateDataset) {
      // Update all chart specific data
      const newData = await getAllChartData(
        getKeyForType(props.type, props.showBaseline, props.standardPopulation)[0] ?? 'deaths',
        props.chartType as ChartType,
        currentDataset,
        allChartLabels.value!,
        getStartIndex(allYearlyChartLabels.value!, props.sliderStart ?? ''),
        helpers.showCumPi(),
        props.ageGroups,
        props.countries,
        props.baselineMethod,
        props.baselineDateFrom ?? '',
        props.baselineDateTo ?? '',
        helpers.getBaseKeysForType()
      )

      // Update allChartData in place
      Object.assign(allChartData, newData)
    }

    return currentDataset
  }

  /**
   * Get filtered chart data based on current state
   *
   * @param props - State properties
   * @param allCountries - Country metadata
   * @param colors - Chart colors
   * @param allChartDataLabels - All chart labels
   * @param allChartDataData - All chart data
   * @param helpers - Helper functions
   */
  async getFilteredData(
    props: StateProperties,
    allCountries: Record<string, Country>,
    colors: string[],
    allChartDataLabels: string[],
    allChartDataData: AllChartData['data'],
    helpers: {
      isAsmrType: () => boolean
      isBarChartStyle: () => boolean
      isMatrixChartStyle: () => boolean
      isPopulationType: () => boolean
      isDeathsType: () => boolean
      isErrorBarType: () => boolean
      showCumPi: () => boolean
    }
  ): Promise<MortalityChartData> {
    return await getFilteredChartData(
      props.countries,
      props.standardPopulation,
      props.ageGroups,
      props.showPredictionInterval,
      props.isExcess,
      props.type,
      props.cumulative,
      props.showBaseline,
      props.baselineMethod,
      props.baselineDateFrom ?? '',
      props.baselineDateTo ?? '',
      props.showTotal,
      props.chartType as ChartType,
      props.dateFrom ?? '',
      props.dateTo ?? '',
      helpers.isBarChartStyle(),
      allCountries,
      helpers.isErrorBarType(),
      colors,
      helpers.isMatrixChartStyle(),
      props.showPercentage,
      helpers.showCumPi(),
      helpers.isAsmrType(),
      props.maximize,
      props.showLabels,
      '', // URL generation placeholder
      props.isLogarithmic,
      helpers.isPopulationType(),
      helpers.isDeathsType(),
      allChartDataLabels,
      allChartDataData
    )
  }

  /**
   * Load country metadata
   */
  async loadCountries(): Promise<Record<string, Country>> {
    return await loadCountryMetadata()
  }
}
