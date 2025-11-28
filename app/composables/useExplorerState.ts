import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUrlState } from '@/composables/useUrlState'
import { Defaults, stateFieldEncoders } from '@/lib/state/stateSerializer'
import type { AllChartData, DatasetRaw } from '@/model'
import type { MortalityChartData } from '@/lib/chart/chartTypes'
import {
  explorerStateSchema,
  type ExplorerState
} from '@/model/explorerSchema'
import { detectView } from '@/lib/state/viewDetector'
import type { ViewType, MetricType, ChartStyle } from '@/lib/state/viewTypes'
import { VIEWS } from '@/lib/state/views'
import { computeUIState } from '@/lib/state/uiStateComputer'

/**
 * Compare two arrays for equality (shallow)
 */
function arraysEqual(a: unknown[] | undefined, b: unknown[] | undefined): boolean {
  if (a === b) return true
  if (a === undefined || b === undefined) return false
  if (a.length !== b.length) return false
  return a.every((val, idx) => val === b[idx])
}

/**
 * Explorer State Management Composable
 *
 * State management with validation for the explorer page
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
  // Get route once at setup time (cannot be called inside functions/watchers)
  const route = useRoute()

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
  const type = useUrlState(
    stateFieldEncoders.type.key,
    Defaults.type
  )
  const chartStyle = useUrlState(
    stateFieldEncoders.chartStyle.key,
    Defaults.chartStyle
  )

  // URL State - Date Range
  const dateFrom = useUrlState<string | undefined>(
    stateFieldEncoders.dateFrom.key,
    Defaults.dateFrom
  )
  const dateTo = useUrlState<string | undefined>(
    stateFieldEncoders.dateTo.key,
    Defaults.dateTo
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
    Defaults.showBaseline ?? true,
    stateFieldEncoders.showBaseline.encode,
    stateFieldEncoders.showBaseline.decode
  )
  const baselineMethod = useUrlState(
    stateFieldEncoders.baselineMethod.key,
    Defaults.baselineMethod
  )

  // URL State - Display Options
  // All defaults should come from Defaults (single source of truth)
  const cumulative = useUrlState<boolean>(
    stateFieldEncoders.cumulative.key,
    Defaults.cumulative ?? false,
    stateFieldEncoders.cumulative.encode,
    stateFieldEncoders.cumulative.decode
  )
  const showTotal = useUrlState<boolean>(
    stateFieldEncoders.showTotal.key,
    Defaults.showTotal ?? false,
    stateFieldEncoders.showTotal.encode,
    stateFieldEncoders.showTotal.decode
  )
  const maximize = useUrlState<boolean>(
    stateFieldEncoders.maximize.key,
    Defaults.maximize ?? false,
    stateFieldEncoders.maximize.encode,
    stateFieldEncoders.maximize.decode
  )
  const showPredictionInterval = useUrlState<boolean>(
    stateFieldEncoders.showPredictionInterval.key,
    Defaults.showPredictionInterval ?? true,
    stateFieldEncoders.showPredictionInterval.encode,
    stateFieldEncoders.showPredictionInterval.decode
  )
  const showLabels = useUrlState<boolean>(
    stateFieldEncoders.showLabels.key,
    Defaults.showLabels ?? true,
    stateFieldEncoders.showLabels.encode,
    stateFieldEncoders.showLabels.decode
  )
  const showPercentage = useUrlState<boolean>(
    stateFieldEncoders.showPercentage.key,
    Defaults.showPercentage ?? false,
    stateFieldEncoders.showPercentage.encode,
    stateFieldEncoders.showPercentage.decode
  )
  const showLogarithmic = useUrlState<boolean>(
    stateFieldEncoders.showLogarithmic.key,
    Defaults.showLogarithmic ?? false,
    stateFieldEncoders.showLogarithmic.encode,
    stateFieldEncoders.showLogarithmic.decode
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
  const showCaption = useUrlState<boolean>(
    stateFieldEncoders.showCaption.key,
    true,
    stateFieldEncoders.showCaption.encode,
    stateFieldEncoders.showCaption.decode
  )
  const decimals = useUrlState<string>(
    stateFieldEncoders.decimals.key,
    Defaults.decimals ?? 'auto'
  )

  // Local State - Chart Size (not synced to URL)
  const chartPreset = ref<string>('Auto')
  const chartWidth = ref<number | undefined>(undefined)
  const chartHeight = ref<number | undefined>(undefined)

  // ============================================================================
  // VIEW - Derived from URL parameters
  // ============================================================================

  /**
   * Current view type, derived from URL params (e, zs, etc.)
   */
  const view = computed<ViewType>(() => {
    return detectView(route.query)
  })

  /**
   * Backward compatibility: isExcess computed from view
   * @deprecated Use view === 'excess' instead
   */
  const isExcess = computed(() => view.value === 'excess')

  /**
   * Check if current view is z-score
   */
  const isZScore = computed(() => view.value === 'zscore')

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
    cumulative: cumulative.value,
    showPredictionInterval: showPredictionInterval.value,
    showTotal: showTotal.value,
    showPercentage: showPercentage.value,
    maximize: maximize.value,
    showLabels: showLabels.value,
    showLogarithmic: showLogarithmic.value,
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
  const lastShownErrors = new Set<string>()

  // NOTE: Validation errors are now handled by StateResolver (app/lib/state/StateResolver.ts)
  // This watcher only logs validation errors for debugging edge cases
  watch(
    errors,
    (newErrors) => {
      if (newErrors.length === 0) {
        lastShownErrors.clear()
        return
      }

      // Log validation errors for debugging
      console.warn('[useExplorerState] Validation errors detected:', newErrors)
      console.warn('[useExplorerState] Current state:', {
        dateFrom: dateFrom.value,
        dateTo: dateTo.value,
        baselineDateFrom: baselineDateFrom.value,
        baselineDateTo: baselineDateTo.value,
        chartType: chartType.value,
        isExcess: isExcess.value,
        showBaseline: showBaseline.value,
        showPredictionInterval: showPredictionInterval.value
      })

      // NOTE: All auto-fix logic removed - StateResolver handles constraint resolution
      // If you see validation errors here, it means:
      // 1. StateResolver constraints need updating (app/lib/state/constraints.ts), OR
      // 2. Zod schema validation rules need updating (app/model/explorerSchema.ts)
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

  // ============================================================================
  // HELPER - Check if field is set by user (exists in URL)
  // ============================================================================

  /**
   * Check if a state field has been explicitly set by the user.
   * Uses URL presence to determine if user touched the field.
   *
   * @param field - The state field name (e.g., 'dateFrom', 'baselineDateFrom')
   * @returns true if the field exists in the URL (user has set it)
   */
  const isUserSet = (field: keyof typeof stateFieldEncoders): boolean => {
    const urlKey = stateFieldEncoders[field]?.key
    if (!urlKey) return false
    return urlKey in route.query
  }

  /**
   * Get set of fields explicitly set by user in URL
   * Used by StateResolver to determine which fields can be overridden by constraints
   *
   * @returns Set of field names that are present in URL
   */
  const getUserOverrides = (): Set<string> => {
    const overrides = new Set<string>()

    for (const [field, encoder] of Object.entries(stateFieldEncoders)) {
      if (encoder?.key && encoder.key in route.query) {
        overrides.add(field)
      }
    }

    return overrides
  }

  /**
   * Get current state as plain object for StateResolver
   * Extracts all ref values into a plain object, applying view defaults
   * for fields that aren't explicitly set in the URL.
   *
   * @returns Plain object with all current state values
   */
  const getCurrentStateValues = (): Record<string, unknown> => {
    // Get current view's defaults
    const currentView = view.value
    const viewConfig = VIEWS[currentView] || VIEWS.mortality
    const viewDefaults = viewConfig.defaults || {}

    // Helper to get value with view default fallback
    // If the field isn't in URL but has a view default, use the view default
    const getValueWithViewDefault = <T>(
      field: keyof typeof stateFieldEncoders,
      refValue: T
    ): T => {
      // If the field is explicitly set in URL, use the ref value
      if (isUserSet(field)) {
        return refValue
      }
      // If the view has a default for this field, use it
      if (field in viewDefaults) {
        return viewDefaults[field as keyof typeof viewDefaults] as T
      }
      // Otherwise use the ref value (which has the landing page default)
      return refValue
    }

    return {
      countries: countries.value,
      type: type.value,
      chartType: chartType.value,
      chartStyle: getValueWithViewDefault('chartStyle', chartStyle.value),
      ageGroups: ageGroups.value,
      standardPopulation: standardPopulation.value,
      isExcess: isExcess.value,
      isZScore: isZScore.value,
      showBaseline: getValueWithViewDefault('showBaseline', showBaseline.value),
      showPredictionInterval: getValueWithViewDefault('showPredictionInterval', showPredictionInterval.value),
      cumulative: getValueWithViewDefault('cumulative', cumulative.value),
      showPercentage: getValueWithViewDefault('showPercentage', showPercentage.value),
      showTotal: showTotal.value,
      maximize: maximize.value,
      showLogarithmic: getValueWithViewDefault('showLogarithmic', showLogarithmic.value),
      showLabels: showLabels.value,
      baselineMethod: baselineMethod.value,
      baselineDateFrom: baselineDateFrom.value,
      baselineDateTo: baselineDateTo.value,
      dateFrom: dateFrom.value,
      dateTo: dateTo.value,
      sliderStart: sliderStart.value,
      userColors: userColors.value,
      decimals: decimals.value,
      showLogo: showLogo.value,
      showQrCode: showQrCode.value,
      showCaption: showCaption.value,
      chartPreset: chartPreset.value
    }
  }

  // Compute UI state from current view and state values
  const ui = computed(() => {
    const currentView = VIEWS[view.value] || VIEWS.mortality
    const stateValues = getCurrentStateValues()
    return computeUIState(currentView, stateValues)
  })

  // ============================================================================
  // DIRECT STATE APPLICATION - Apply resolved state to refs in single tick
  // ============================================================================

  /**
   * Apply resolved state directly to refs (single tick, no URL reactivity)
   *
   * This is the key to eliminating multi-tick updates. Instead of:
   *   StateResolver → URL → refs react → watchers fire
   * We do:
   *   StateResolver → refs directly → URL sync (for persistence only)
   *
   * @param resolved - ResolvedState from StateResolver
   */
  const applyResolvedState = (resolved: { state: Record<string, unknown> }) => {
    const state = resolved.state

    // Apply each field if value differs (avoids unnecessary reactivity)
    if (state.countries !== undefined && !arraysEqual(state.countries as string[], countries.value)) {
      countries.value = state.countries as string[]
    }
    if (state.type !== undefined && state.type !== type.value) {
      type.value = state.type as MetricType
    }
    if (state.chartType !== undefined && state.chartType !== chartType.value) {
      chartType.value = state.chartType as string
    }
    if (state.chartStyle !== undefined && state.chartStyle !== chartStyle.value) {
      chartStyle.value = state.chartStyle as ChartStyle
    }
    if (state.ageGroups !== undefined && !arraysEqual(state.ageGroups as string[], ageGroups.value)) {
      ageGroups.value = state.ageGroups as string[]
    }
    if (state.standardPopulation !== undefined && state.standardPopulation !== standardPopulation.value) {
      standardPopulation.value = state.standardPopulation as string
    }
    if (state.showBaseline !== undefined && state.showBaseline !== showBaseline.value) {
      showBaseline.value = state.showBaseline as boolean
    }
    if (state.showPredictionInterval !== undefined && state.showPredictionInterval !== showPredictionInterval.value) {
      showPredictionInterval.value = state.showPredictionInterval as boolean
    }
    if (state.cumulative !== undefined && state.cumulative !== cumulative.value) {
      cumulative.value = state.cumulative as boolean
    }
    if (state.showPercentage !== undefined && state.showPercentage !== showPercentage.value) {
      showPercentage.value = state.showPercentage as boolean
    }
    if (state.showTotal !== undefined && state.showTotal !== showTotal.value) {
      showTotal.value = state.showTotal as boolean
    }
    if (state.maximize !== undefined && state.maximize !== maximize.value) {
      maximize.value = state.maximize as boolean
    }
    if (state.showLogarithmic !== undefined && state.showLogarithmic !== showLogarithmic.value) {
      showLogarithmic.value = state.showLogarithmic as boolean
    }
    if (state.showLabels !== undefined && state.showLabels !== showLabels.value) {
      showLabels.value = state.showLabels as boolean
    }
    if (state.baselineMethod !== undefined && state.baselineMethod !== baselineMethod.value) {
      baselineMethod.value = state.baselineMethod as string
    }
    // For optional fields (can be undefined), check if key exists in state object
    if ('dateFrom' in state && state.dateFrom !== dateFrom.value) {
      dateFrom.value = state.dateFrom as string | undefined
    }
    if ('dateTo' in state && state.dateTo !== dateTo.value) {
      dateTo.value = state.dateTo as string | undefined
    }
    if (state.sliderStart !== undefined && state.sliderStart !== sliderStart.value) {
      sliderStart.value = state.sliderStart as string
    }
    if ('baselineDateFrom' in state && state.baselineDateFrom !== baselineDateFrom.value) {
      baselineDateFrom.value = state.baselineDateFrom as string | undefined
    }
    if ('baselineDateTo' in state && state.baselineDateTo !== baselineDateTo.value) {
      baselineDateTo.value = state.baselineDateTo as string | undefined
    }
    if (state.decimals !== undefined && state.decimals !== decimals.value) {
      decimals.value = state.decimals as string
    }
    if (state.showLogo !== undefined && state.showLogo !== showLogo.value) {
      showLogo.value = state.showLogo as boolean
    }
    if (state.showQrCode !== undefined && state.showQrCode !== showQrCode.value) {
      showQrCode.value = state.showQrCode as boolean
    }
    if (state.showCaption !== undefined && state.showCaption !== showCaption.value) {
      showCaption.value = state.showCaption as boolean
    }
    if ('userColors' in state && !arraysEqual(state.userColors as string[] | undefined, userColors.value)) {
      userColors.value = state.userColors as string[] | undefined
    }
  }

  return {
    // View (derived from URL)
    view,
    isExcess, // Backward compat: computed from view === 'excess'
    isZScore, // Computed from view === 'zscore'

    // Core settings
    countries,
    chartType,
    ageGroups,
    standardPopulation,
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
    showLogarithmic,

    // Chart appearance
    userColors,
    showLogo,
    showQrCode,
    showCaption,
    decimals,

    // Local state
    chartPreset,
    chartWidth,
    chartHeight,

    // Validation API
    currentState,
    isValid,
    errors,
    getValidatedState,

    // UI state (computed from view config)
    ui,

    // Helper functions
    isUserSet,
    getUserOverrides,
    getCurrentStateValues,

    // Direct state application (single-tick updates)
    applyResolvedState
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
