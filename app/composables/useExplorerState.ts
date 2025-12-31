import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { AllChartData, DatasetRaw } from '@/model'
import type { MortalityChartData } from '@/lib/chart/chartTypes'
import {
  explorerStateSchema,
  type ExplorerState,
  type ChartType as ChartTypeSchema,
  type MetricType as MetricTypeSchema,
  type ChartStyle as ChartStyleSchema,
  type StandardPopulation as StandardPopulationSchema,
  type BaselineMethod as BaselineMethodSchema,
  type DecimalPrecision as DecimalPrecisionSchema
} from '@/model/explorerSchema'
import {
  detectView,
  computeUIState,
  VIEWS,
  type ViewType,
  type MetricType,
  type ChartStyle
} from '@/lib/state'
import { getDefaultSliderStart } from '@/lib/config/constants'

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
 * Refs-first state management for the explorer page.
 *
 * Architecture:
 * - Plain refs are the source of truth for state
 * - StateResolver initializes refs on page load (with view-specific defaults)
 * - StateResolver syncs to URL for persistence/sharing
 * - No useUrlState - eliminates conflict between URL defaults and view defaults
 *
 * Provides:
 * - All state refs (initialized by StateResolver.resolveInitial)
 * - Real-time validation using Zod schema
 * - Direct state application for single-tick updates
 */
export function useExplorerState() {
  // Get route once at setup time (for reading URL params at init)
  const route = useRoute()

  // ============================================================================
  // VIEW - Detect from URL immediately (before StateResolver runs)
  // ============================================================================

  /**
   * Current view type as a ref
   * Initialized from URL, updated by applyResolvedState
   */
  const view = ref<ViewType>(detectView(route.query))

  // Get initial defaults based on detected view
  // Mortality defaults are the base, view-specific defaults override
  const initialView = detectView(route.query)
  const viewConfig = VIEWS[initialView] || VIEWS.mortality
  const mortalityDefaults = VIEWS.mortality.defaults

  // Helper to get merged default with proper fallback
  const getDefault = <T>(field: keyof typeof mortalityDefaults, fallback: T): T => {
    // First check view-specific default
    if (viewConfig.defaults && field in viewConfig.defaults) {
      const viewValue = viewConfig.defaults[field as keyof typeof viewConfig.defaults]
      if (viewValue !== undefined) return viewValue as T
    }
    // Then mortality default
    const baseValue = mortalityDefaults[field]
    if (baseValue !== undefined) return baseValue as T
    // Finally use fallback
    return fallback
  }

  // ============================================================================
  // STATE REFS - Plain refs initialized with view-aware defaults
  // StateResolver.resolveInitial() will update these on mount
  // ============================================================================

  // Core Settings
  const countries = ref<string[]>(getDefault('countries', ['USA', 'SWE']))
  const chartType = ref<ChartTypeSchema>(getDefault('chartType', 'fluseason') as ChartTypeSchema)
  const ageGroups = ref<string[]>(getDefault('ageGroups', ['all']))
  const standardPopulation = ref<string>(getDefault('standardPopulation', 'who'))
  const type = ref<MetricType>(getDefault('type', 'asmr') as MetricType)
  const chartStyle = ref<ChartStyle>(getDefault('chartStyle', 'line') as ChartStyle)

  // Date Range
  const dateFrom = ref<string | undefined>(mortalityDefaults.dateFrom)
  const dateTo = ref<string | undefined>(mortalityDefaults.dateTo)
  const sliderStart = ref<string>(getDefault('sliderStart', getDefaultSliderStart()))

  // Baseline
  const baselineDateFrom = ref<string | undefined>(mortalityDefaults.baselineDateFrom)
  const baselineDateTo = ref<string | undefined>(mortalityDefaults.baselineDateTo)
  const showBaseline = ref<boolean>(getDefault('showBaseline', true))
  const baselineMethod = ref<string>(getDefault('baselineMethod', 'mean'))

  // Display Options
  const cumulative = ref<boolean>(getDefault('cumulative', false))
  const showTotal = ref<boolean>(getDefault('showTotal', false))
  const maximize = ref<boolean>(getDefault('maximize', false))
  const showPredictionInterval = ref<boolean>(getDefault('showPredictionInterval', true))
  const showLabels = ref<boolean>(getDefault('showLabels', true))
  const showPercentage = ref<boolean>(getDefault('showPercentage', false))
  const showLogarithmic = ref<boolean>(getDefault('showLogarithmic', false))
  const leAdjusted = ref<boolean>(getDefault('leAdjusted', true)) // Seasonal adjustment for LE (default: ON)

  // Chart Appearance
  const userColors = ref<string[] | undefined>(mortalityDefaults.userColors)
  const showLogo = ref<boolean>(getDefault('showLogo', true))
  const showQrCode = ref<boolean>(getDefault('showQrCode', true))
  const showCaption = ref<boolean>(getDefault('showCaption', true))
  const showTitle = ref<boolean>(getDefault('showTitle', true))
  const decimals = ref<string>(getDefault('decimals', 'auto'))

  // Local State - Chart Size (not synced to URL)
  const chartPreset = ref<string>('Auto')
  const chartWidth = ref<number | undefined>(undefined)
  const chartHeight = ref<number | undefined>(undefined)

  // ============================================================================
  // USER OVERRIDES - Track which fields have been explicitly set by user
  // Populated by StateResolver.resolveInitial() from URL params
  // Updated when user makes changes (via handleStateChange)
  // ============================================================================
  const userOverrides = ref<Set<string>>(new Set())

  /**
   * Backward compatibility: isExcess computed from view
   * @deprecated Use view === 'excess' instead
   */
  const isExcess = computed(() => view.value === 'excess')

  /**
   * Check if current view is z-score
   */
  const isZScore = computed(() => view.value === 'zscore')

  /**
   * Check if current metric is ASD (Age-Standardized Deaths)
   */
  const isASD = computed(() => type.value === 'asd')

  // ============================================================================
  // VALIDATION - Gather complete state and validate
  // ============================================================================

  const currentState = computed<ExplorerState>(() => ({
    countries: countries.value,
    chartType: chartType.value,
    ageGroups: ageGroups.value,
    type: type.value as MetricTypeSchema,
    standardPopulation: standardPopulation.value as StandardPopulationSchema,
    chartStyle: chartStyle.value as ChartStyleSchema,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
    sliderStart: sliderStart.value,
    showBaseline: showBaseline.value,
    baselineMethod: baselineMethod.value as BaselineMethodSchema,
    baselineDateFrom: baselineDateFrom.value,
    baselineDateTo: baselineDateTo.value,
    cumulative: cumulative.value,
    showPredictionInterval: showPredictionInterval.value,
    showTotal: showTotal.value,
    showPercentage: showPercentage.value,
    maximize: maximize.value,
    showLabels: showLabels.value,
    showLogarithmic: showLogarithmic.value,
    decimals: decimals.value as DecimalPrecisionSchema
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
  // HELPER - Check if field is set by user
  // ============================================================================

  /**
   * Check if a state field has been explicitly set by the user.
   * Uses tracked userOverrides ref (populated from URL on init, updated on user actions)
   *
   * @param field - The state field name (e.g., 'dateFrom', 'baselineDateFrom')
   * @returns true if the field has been explicitly set by user
   */
  const isUserSet = (field: string): boolean => {
    return userOverrides.value.has(field)
  }

  /**
   * Get set of fields explicitly set by user
   * Used by StateResolver to determine which fields can be overridden by constraints
   *
   * @returns Set of field names that user has explicitly set
   */
  const getUserOverrides = (): Set<string> => {
    return new Set(userOverrides.value)
  }

  /**
   * Set user overrides (called after StateResolver.resolveInitial)
   * @param overrides - Set of field names from URL params
   */
  const setUserOverrides = (overrides: Set<string>) => {
    userOverrides.value = new Set(overrides)
  }

  /**
   * Add a field to user overrides (called when user makes a change)
   * @param field - Field name to add
   */
  const addUserOverride = (field: string) => {
    userOverrides.value = new Set([...userOverrides.value, field])
  }

  /**
   * Clear user overrides (called when switching views)
   * When user switches views, they want the new view's defaults,
   * so we clear all previous overrides.
   */
  const clearUserOverrides = () => {
    userOverrides.value = new Set()
  }

  /**
   * Get current state as plain object for StateResolver
   * Extracts all ref values into a plain object.
   *
   * Since refs are now the source of truth (initialized by StateResolver),
   * we simply return the current ref values without needing view-default fallbacks.
   *
   * @returns Plain object with all current state values
   */
  const getCurrentStateValues = (): Record<string, unknown> => {
    return {
      view: view.value,
      countries: countries.value,
      type: type.value,
      chartType: chartType.value,
      chartStyle: chartStyle.value,
      ageGroups: ageGroups.value,
      standardPopulation: standardPopulation.value,
      isExcess: isExcess.value,
      isZScore: isZScore.value,
      isASD: isASD.value,
      showBaseline: showBaseline.value,
      showPredictionInterval: showPredictionInterval.value,
      cumulative: cumulative.value,
      showPercentage: showPercentage.value,
      showTotal: showTotal.value,
      maximize: maximize.value,
      showLogarithmic: showLogarithmic.value,
      showLabels: showLabels.value,
      leAdjusted: leAdjusted.value,
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
      showTitle: showTitle.value,
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

    // Apply view first (isExcess/isZScore depend on it)
    if (state.view !== undefined && state.view !== view.value) {
      view.value = state.view as ViewType
    }

    // Apply each field if value differs (avoids unnecessary reactivity)
    if (state.countries !== undefined && !arraysEqual(state.countries as string[], countries.value)) {
      countries.value = state.countries as string[]
    }
    if (state.type !== undefined && state.type !== type.value) {
      type.value = state.type as MetricType
    }
    if (state.chartType !== undefined && state.chartType !== chartType.value) {
      chartType.value = state.chartType as ChartTypeSchema
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
    if (state.leAdjusted !== undefined && state.leAdjusted !== leAdjusted.value) {
      leAdjusted.value = state.leAdjusted as boolean
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
    if (state.showTitle !== undefined && state.showTitle !== showTitle.value) {
      showTitle.value = state.showTitle as boolean
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
    isASD, // Computed from type === 'asd'

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
    leAdjusted,

    // Chart appearance
    userColors,
    showLogo,
    showQrCode,
    showCaption,
    showTitle,
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
    setUserOverrides,
    addUserOverride,
    clearUserOverrides,
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
