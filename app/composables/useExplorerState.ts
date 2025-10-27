import { reactive, ref } from 'vue'
import { useUrlState } from '@/composables/useUrlState'
import { Defaults, stateFieldEncoders } from '@/lib/state/stateSerializer'
import type { AllChartData, DatasetRaw } from '@/model'
import type { MortalityChartData } from '@/lib/chart/chartTypes'

/**
 * Manages all URL-synchronized state for the explorer page
 */
export function useExplorerState() {
  // URL State - Core Settings
  const countries = useUrlState(
    stateFieldEncoders.countries.key,
    Defaults.countries
  )
  const chartType = useUrlState(
    stateFieldEncoders.chartType.key,
    Defaults.chartType
  )
  const ageGroups = useUrlState<string[]>(
    stateFieldEncoders.ageGroups.key,
    ['all']
  )
  const standardPopulation = useUrlState(
    stateFieldEncoders.standardPopulation.key,
    Defaults.standardPopulation
  )
  const isExcess = useUrlState<boolean>(
    stateFieldEncoders.isExcess.key,
    false,
    stateFieldEncoders.isExcess.encode,
    stateFieldEncoders.isExcess.decode
  )
  const type = useUrlState(
    stateFieldEncoders.type.key,
    Defaults.type
  )
  const chartStyle = useUrlState(
    stateFieldEncoders.chartStyle.key,
    Defaults.chartStyle
  )

  // URL State - Date Range
  const dateFrom = useUrlState<string>(
    stateFieldEncoders.dateFrom.key,
    '2017',
    stateFieldEncoders.dateFrom.encode,
    stateFieldEncoders.dateFrom.decode,
    { debounce: 300 }
  )
  const dateTo = useUrlState<string>(
    stateFieldEncoders.dateTo.key,
    '2023',
    stateFieldEncoders.dateTo.encode,
    stateFieldEncoders.dateTo.decode,
    { debounce: 300 }
  )
  const sliderStart = useUrlState(
    stateFieldEncoders.sliderStart.key,
    Defaults.sliderStart ?? '2010'
  )

  // URL State - Baseline
  const baselineDateFrom = useUrlState<string>(
    stateFieldEncoders.baselineDateFrom.key,
    '2017',
    stateFieldEncoders.baselineDateFrom.encode,
    stateFieldEncoders.baselineDateFrom.decode
  )
  const baselineDateTo = useUrlState<string>(
    stateFieldEncoders.baselineDateTo.key,
    '2019',
    stateFieldEncoders.baselineDateTo.encode,
    stateFieldEncoders.baselineDateTo.decode
  )
  const showBaseline = useUrlState<boolean>(
    stateFieldEncoders.showBaseline.key,
    true,
    stateFieldEncoders.showBaseline.encode,
    stateFieldEncoders.showBaseline.decode
  )
  const baselineMethod = useUrlState(
    stateFieldEncoders.baselineMethod.key,
    Defaults.baselineMethod
  )

  // URL State - Display Options
  const cumulative = useUrlState<boolean>(
    stateFieldEncoders.cumulative.key,
    false,
    stateFieldEncoders.cumulative.encode,
    stateFieldEncoders.cumulative.decode
  )
  const showTotal = useUrlState<boolean>(
    stateFieldEncoders.showTotal.key,
    false,
    stateFieldEncoders.showTotal.encode,
    stateFieldEncoders.showTotal.decode
  )
  const maximize = useUrlState<boolean>(
    stateFieldEncoders.maximize.key,
    false,
    stateFieldEncoders.maximize.encode,
    stateFieldEncoders.maximize.decode
  )
  const showPredictionInterval = useUrlState<boolean>(
    stateFieldEncoders.showPredictionInterval.key,
    true,
    stateFieldEncoders.showPredictionInterval.encode,
    stateFieldEncoders.showPredictionInterval.decode
  )
  const showLabels = useUrlState<boolean>(
    stateFieldEncoders.showLabels.key,
    true,
    stateFieldEncoders.showLabels.encode,
    stateFieldEncoders.showLabels.decode
  )
  const showPercentage = useUrlState<boolean>(
    stateFieldEncoders.showPercentage.key,
    false,
    stateFieldEncoders.showPercentage.encode,
    stateFieldEncoders.showPercentage.decode
  )
  const isLogarithmic = useUrlState<boolean>(
    stateFieldEncoders.isLogarithmic.key,
    false,
    stateFieldEncoders.isLogarithmic.encode,
    stateFieldEncoders.isLogarithmic.decode
  )

  // URL State - Chart Appearance
  const userColors = useUrlState<string[] | undefined>(
    stateFieldEncoders.userColors.key,
    undefined
  )
  const showLogo = useUrlState<boolean>(
    stateFieldEncoders.showLogo.key,
    true,
    stateFieldEncoders.showLogo.encode,
    stateFieldEncoders.showLogo.decode
  )
  const showQrCode = useUrlState<boolean>(
    stateFieldEncoders.showQrCode.key,
    true,
    stateFieldEncoders.showQrCode.encode,
    stateFieldEncoders.showQrCode.decode
  )
  const decimals = useUrlState<string>(
    stateFieldEncoders.decimals.key,
    Defaults.decimals
  )

  // Local State - Chart Size (not synced to URL)
  const chartPreset = ref<string>('Auto')
  const chartWidth = ref<number | undefined>(undefined)
  const chartHeight = ref<number | undefined>(undefined)

  return {
    // Core settings
    countries,
    chartType,
    ageGroups,
    standardPopulation,
    isExcess,
    type,
    chartStyle,

    // Date range
    dateFrom,
    dateTo,
    sliderStart,

    // Baseline
    baselineDateFrom,
    baselineDateTo,
    showBaseline,
    baselineMethod,

    // Display options
    cumulative,
    showTotal,
    maximize,
    showPredictionInterval,
    showLabels,
    showPercentage,
    isLogarithmic,

    // Chart appearance
    userColors,
    showLogo,
    showQrCode,
    decimals,

    // Local state
    chartPreset,
    chartWidth,
    chartHeight
  }
}

/**
 * Manages data state for the explorer page
 */
export function useExplorerData() {
  const allChartLabels = ref<string[]>([])
  const allYearlyChartLabels = ref<string[]>([])
  const allYearlyChartLabelsUnique = ref<string[]>([])
  const allChartData = reactive<AllChartData>({
    labels: [],
    data: {},
    notes: {
      noData: undefined,
      noAsmr: undefined
    }
  })
  const chartData = ref<MortalityChartData | undefined>(undefined)
  const isDataLoaded = ref(false)

  let dataset: DatasetRaw

  return {
    allChartLabels,
    allYearlyChartLabels,
    allYearlyChartLabelsUnique,
    allChartData,
    chartData,
    isDataLoaded,
    getDataset: () => dataset,
    setDataset: (newDataset: DatasetRaw) => {
      dataset = newDataset
    }
  }
}

/**
 * Manages chart options visibility based on current state
 */
export function useExplorerChartOptions() {
  const chartOptions = reactive({
    showMaximizeOption: true,
    showMaximizeOptionDisabled: false,
    showBaselineOption: false,
    showPredictionIntervalOption: false,
    showPredictionIntervalOptionDisabled: false,
    showCumulativeOption: false,
    showTotalOption: false,
    showTotalOptionDisabled: false,
    showPercentageOption: false,
    showLogarithmicOption: true
  })

  return {
    chartOptions
  }
}
