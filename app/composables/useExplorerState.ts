import { computed, reactive, ref, watch } from 'vue'
import { useUrlState } from '@/composables/useUrlState'
import { Defaults, stateFieldEncoders } from '@/lib/state/stateSerializer'
import type { AllChartData, DatasetRaw } from '@/model'
import type { MortalityChartData } from '@/lib/chart/chartTypes'
import {
  explorerStateSchema,
  type ExplorerState
} from '@/model/explorerSchema'
import { showToast } from '@/toast'

/**
 * Explorer State Management Composable
 *
 * Phase 9.1: Centralized state management with validation
 *
 * Provides:
 * - All URL state refs (maintaining URL-first architecture)
 * - Real-time validation using Zod schema
 * - Auto-fix for incompatible state combinations
 * - User notifications for invalid states
 *
 * This consolidates state management and eliminates the need for
 * scattered business logic across the codebase.
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
  // Note: Defaults are undefined to let StateComputed calculate proper format based on chart type
  const dateFrom = useUrlState<string | undefined>(
    stateFieldEncoders.dateFrom.key,
    undefined,
    undefined,
    undefined,
    { debounce: 300 }
  )
  const dateTo = useUrlState<string | undefined>(
    stateFieldEncoders.dateTo.key,
    undefined,
    undefined,
    undefined,
    { debounce: 300 }
  )
  const sliderStart = useUrlState(
    stateFieldEncoders.sliderStart.key,
    Defaults.sliderStart ?? '2010'
  )

  // URL State - Baseline
  // Note: Defaults are undefined to let StateComputed calculate proper format based on chart type
  const baselineDateFrom = useUrlState<string | undefined>(
    stateFieldEncoders.baselineDateFrom.key,
    undefined
  )
  const baselineDateTo = useUrlState<string | undefined>(
    stateFieldEncoders.baselineDateTo.key,
    undefined
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

  // ============================================================================
  // VALIDATION - Gather complete state and validate
  // ============================================================================

  const currentState = computed<ExplorerState>(() => ({
    countries: countries.value,
    chartType: chartType.value,
    ageGroups: ageGroups.value,
    type: type.value,
    standardPopulation: standardPopulation.value,
    chartStyle: chartStyle.value,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
    sliderStart: sliderStart.value,
    showBaseline: showBaseline.value,
    baselineMethod: baselineMethod.value,
    baselineDateFrom: baselineDateFrom.value,
    baselineDateTo: baselineDateTo.value,
    isExcess: isExcess.value,
    cumulative: cumulative.value,
    showPredictionInterval: showPredictionInterval.value,
    showTotal: showTotal.value,
    showPercentage: showPercentage.value,
    maximize: maximize.value,
    showLabels: showLabels.value,
    isLogarithmic: isLogarithmic.value,
    decimals: decimals.value
  }))

  const validationResult = computed(() =>
    explorerStateSchema.safeParse(currentState.value)
  )

  const isValid = computed(() => validationResult.value.success)

  const errors = computed(() =>
    validationResult.value.success ? [] : validationResult.value.error.issues
  )

  // ============================================================================
  // AUTO-FIX - Automatically correct incompatible state combinations
  // ============================================================================

  // Track the last set of error messages to avoid duplicate toasts
  let lastShownErrors = new Set<string>()

  watch(
    errors,
    (newErrors) => {
      if (newErrors.length === 0) {
        lastShownErrors.clear()
        return
      }

      // Log validation errors for debugging
      console.warn('[useExplorerState] Validation errors:', newErrors)
      console.warn('[useExplorerState] Current state:', {
        dateFrom: dateFrom.value,
        dateTo: dateTo.value,
        baselineDateFrom: baselineDateFrom.value,
        baselineDateTo: baselineDateTo.value,
        chartType: chartType.value
      })

      // Auto-fix: Can't show baseline in excess mode
      const excessBaselineError = newErrors.find(e =>
        e.message.includes('Cannot show baseline in excess')
      )
      if (excessBaselineError) {
        showBaseline.value = false
        return // Exit early after auto-fix
      }

      // Auto-fix: Prediction intervals require baseline
      const predictionIntervalError = newErrors.find(e =>
        e.message.includes('require baseline')
      )
      if (predictionIntervalError) {
        showPredictionInterval.value = false
        return // Exit early after auto-fix
      }

      // Auto-fix: Population doesn't support baseline
      const populationBaselineError = newErrors.find(e =>
        e.message.includes('Population metric does not support baseline')
      )
      if (populationBaselineError) {
        showBaseline.value = false
        return // Exit early after auto-fix
      }

      // Auto-fix: Population doesn't support excess
      const populationExcessError = newErrors.find(e =>
        e.message.includes('Population metric does not support excess')
      )
      if (populationExcessError) {
        isExcess.value = false
        return // Exit early after auto-fix
      }

      // Auto-fix: Invalid date format for chart type
      const dateFormatError = newErrors.find(e =>
        e.message.includes('Date format must be')
      )
      if (dateFormatError) {
        // Clear invalid dates - they will be recalculated by resetDates()
        dateFrom.value = undefined
        dateTo.value = undefined
        return // Exit early after auto-fix
      }

      // Auto-fix: Baseline period must end before data period
      const baselineBeforeDataError = newErrors.find(e =>
        e.message.includes('Baseline period must end before data period')
      )
      if (baselineBeforeDataError) {
        // Reset baseline dates - they will be recalculated
        baselineDateFrom.value = undefined
        baselineDateTo.value = undefined
        return // Exit early after auto-fix
      }

      // For errors that can't be auto-fixed, notify user only once per unique error
      const errorMessages = new Set(newErrors.map(e => e.message))

      // Only show toasts for errors we haven't shown before
      errorMessages.forEach((errorMsg) => {
        if (!lastShownErrors.has(errorMsg)) {
          lastShownErrors.add(errorMsg)
          showToast(errorMsg, 'warning')
        }
      })

      // Clean up old errors that are no longer present
      lastShownErrors = new Set(Array.from(lastShownErrors).filter(msg => errorMessages.has(msg)))
    },
    { immediate: false }
  )

  // ============================================================================
  // HELPER - Get validated state or throw
  // ============================================================================

  const getValidatedState = (): ExplorerState => {
    const result = explorerStateSchema.safeParse(currentState.value)
    if (!result.success) {
      throw new Error(`Invalid state: ${result.error.issues[0]?.message}`)
    }
    return result.data
  }

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
    chartHeight,

    // Validation API
    currentState,
    isValid,
    errors,
    getValidatedState
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
