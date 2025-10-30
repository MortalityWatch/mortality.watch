/**
 * Type definitions for chart data transformation
 */

import type { Country } from '~/model'

/**
 * Configuration for data transformation pipeline
 * Replaces the 17 individual parameters in getDatasets()
 */
export interface DataTransformationConfig {
  /** Display options */
  display: {
    showPercentage: boolean
    cumulative: boolean
    showTotal: boolean
    showCumPi: boolean
    showBaseline: boolean
    showPredictionInterval: boolean
  }

  /** Chart configuration */
  chart: {
    type: string
    chartType: string
    isExcess: boolean
    isAsmrType: boolean
    isBarChartStyle: boolean
    isMatrixChartStyle: boolean
    isErrorBarType: boolean
    standardPopulation: string
  }

  /** Visual configuration */
  visual: {
    colors: string[]
  }

  /** Data context */
  context: {
    countries: string[]
    allCountries: Record<string, Country>
  }
}
