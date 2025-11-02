import type { Ref } from 'vue'
import type { NumberEntryFields, AllChartData, DatasetRaw, Country } from '@/model'
import type { MortalityChartData } from '@/lib/chart/chartTypes'

/**
 * Type definitions for useExplorerDataUpdate composable
 *
 * These interfaces group the 30+ parameters into logical categories,
 * fixing the TypeScript "Type instantiation is excessively deep" error.
 */

/**
 * State refs - Chart configuration state
 */
export interface ExplorerStateRefs {
  countries: Ref<string[]>
  chartType: Ref<string>
  ageGroups: Ref<string[]>
  type: Ref<string>
  showBaseline: Ref<boolean>
  standardPopulation: Ref<string>
  baselineMethod: Ref<string>
  baselineDateFrom: Ref<string>
  baselineDateTo: Ref<string>
  dateFrom: Ref<string>
  dateTo: Ref<string>
  sliderStart: Ref<string>
  isExcess: Ref<boolean>
  cumulative: Ref<boolean>
  showPredictionInterval: Ref<boolean>
  showTotal: Ref<boolean>
  showPercentage: Ref<boolean>
  maximize: Ref<boolean>
  showLabels: Ref<boolean>
  isLogarithmic: Ref<boolean>
  showZScores: Ref<boolean>
}

/**
 * Data refs - Chart labels and data
 */
export interface ExplorerDataRefs {
  allChartLabels: Ref<string[]>
  allYearlyChartLabels: Ref<string[]>
  allYearlyChartLabelsUnique: Ref<string[]>
  allChartData: AllChartData
  chartData: Ref<MortalityChartData | undefined>
}

/**
 * Helper functions - Type predicates and utilities
 */
export interface ExplorerHelpers {
  isAsmrType: () => boolean
  isBarChartStyle: () => boolean
  isErrorBarType: () => boolean
  isMatrixChartStyle: () => boolean
  isPopulationType: () => boolean
  isDeathsType: () => boolean
  showCumPi: () => boolean
  getBaseKeysForType: () => (keyof NumberEntryFields)[]
}

/**
 * Dataset management - Getter/setter for raw dataset
 */
export interface ExplorerDataset {
  get: () => DatasetRaw
  set: (dataset: DatasetRaw) => void
}

/**
 * Config - Additional configuration
 */
export interface ExplorerConfig {
  displayColors: Ref<string[]>
  allCountries: Ref<Record<string, Country>>
}

/**
 * Complete configuration for useExplorerDataUpdate
 */
export interface UseExplorerDataUpdateConfig {
  state: ExplorerStateRefs
  data: ExplorerDataRefs
  helpers: ExplorerHelpers
  dataset: ExplorerDataset
  config: ExplorerConfig
}
