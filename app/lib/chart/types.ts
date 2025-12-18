/**
 * Type definitions for chart data transformation
 */

import type { Country } from '@/model'
import type { ChartType } from '@/model/period'

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
    view: string
    leAdjusted: boolean
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

/**
 * Complete state snapshot for the chart update pipeline.
 *
 * This captures ALL state needed for chart rendering in a single object,
 * eliminating the need to read from reactive refs during the update cycle.
 *
 * Used by:
 * - updateData() - receives snapshot, passes to updateFilteredData
 * - updateFilteredData() - uses snapshot instead of reading refs
 * - getFilteredChartData() - receives ChartFilterConfig derived from snapshot
 */
export interface ChartStateSnapshot {
  // Core settings
  countries: string[]
  type: string
  chartType: ChartType
  chartStyle: string
  ageGroups: string[]
  standardPopulation: string

  // View state
  view: string
  isExcess: boolean
  isZScore: boolean

  // Date range
  dateFrom: string | undefined
  dateTo: string | undefined
  sliderStart: string

  // Baseline
  baselineDateFrom: string | undefined
  baselineDateTo: string | undefined
  showBaseline: boolean
  baselineMethod: string

  // Display options
  cumulative: boolean
  showTotal: boolean
  maximize: boolean
  showPredictionInterval: boolean
  showLabels: boolean
  showPercentage: boolean
  showLogarithmic: boolean
  leAdjusted: boolean // LE seasonal adjustment

  // Chart appearance
  userColors: string[] | undefined
  decimals: string
}

/**
 * Configuration for getFilteredChartData.
 * Derived from ChartStateSnapshot + computed helpers.
 * Replaces the 19+ individual parameters.
 */
export interface ChartFilterConfig {
  // Data selection
  countries: string[]
  ageGroups: string[]

  // Chart type settings
  type: string
  chartType: string
  standardPopulation: string

  // View and style
  view: string
  isExcess: boolean
  chartStyle: string
  isBarChartStyle: boolean
  isMatrixChartStyle: boolean
  isErrorBarType: boolean
  isAsmrType: boolean
  isPopulationType: boolean
  isDeathsType: boolean

  // Date range (effective values with defaults applied)
  dateFrom: string
  dateTo: string

  // Baseline (effective values with defaults applied)
  baselineMethod: string
  baselineDateFrom: string
  baselineDateTo: string
  showBaseline: boolean

  // Display options
  cumulative: boolean
  showTotal: boolean
  showPredictionInterval: boolean
  showPercentage: boolean
  showCumPi: boolean
  maximize: boolean
  showLabels: boolean
  showLogarithmic: boolean
  leAdjusted: boolean // LE seasonal adjustment

  // Visual
  colors: string[]

  // Context
  allCountries: Record<string, Country>
  url: string
}
