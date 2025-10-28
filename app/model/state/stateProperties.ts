import { reactive } from 'vue'

/**
 * State properties interface
 * All the properties that make up the chart/explorer state
 */
export interface StateProperties {
  // Core Settings
  countries: string[]
  chartType: string
  type: string
  chartStyle: string
  isExcess: boolean

  // Date Range
  dateFrom: string | undefined
  dateTo: string | undefined
  sliderStart: string | undefined

  // Baseline
  showBaseline: boolean
  baselineMethod: string
  baselineDateFrom: string | undefined
  baselineDateTo: string | undefined

  // Display Options
  ageGroups: string[]
  standardPopulation: string
  cumulative: boolean
  showTotal: boolean
  maximize: boolean
  showPredictionInterval: boolean
  showLabels: boolean
  showPercentage: boolean
  isLogarithmic: boolean

  // Colors
  userColors: string[] | undefined
}

/**
 * Create a reactive state properties object with defaults
 *
 * @param defaults - Default values object (typically from Defaults)
 * @returns Reactive state properties object
 */
export function createStateProperties(defaults: Partial<StateProperties> = {}): StateProperties {
  return reactive<StateProperties>({
    // Core Settings
    countries: defaults.countries ?? [],
    chartType: defaults.chartType ?? 'weekly',
    type: defaults.type ?? 'deaths',
    chartStyle: defaults.chartStyle ?? 'line',
    isExcess: defaults.isExcess ?? false,

    // Date Range
    dateFrom: defaults.dateFrom,
    dateTo: defaults.dateTo,
    sliderStart: defaults.sliderStart,

    // Baseline
    showBaseline: defaults.showBaseline ?? false,
    baselineMethod: defaults.baselineMethod ?? 'auto',
    baselineDateFrom: defaults.baselineDateFrom,
    baselineDateTo: defaults.baselineDateTo,

    // Display Options
    ageGroups: defaults.ageGroups ?? ['all'],
    standardPopulation: defaults.standardPopulation ?? 'esp2013',
    cumulative: defaults.cumulative ?? false,
    showTotal: defaults.showTotal ?? false,
    maximize: defaults.maximize ?? false,
    showPredictionInterval: defaults.showPredictionInterval ?? true,
    showLabels: defaults.showLabels ?? true,
    showPercentage: defaults.showPercentage ?? false,
    isLogarithmic: defaults.isLogarithmic ?? false,

    // Colors
    userColors: defaults.userColors
  })
}
