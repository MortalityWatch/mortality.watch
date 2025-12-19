/**
 * Ranking State Management Composable
 *
 * Provides centralized state management for the ranking page using the
 * StateResolver pattern. All state changes flow through the resolver
 * which applies constraints and computes UI state.
 *
 * Features:
 * - URL-first state synchronization
 * - Automatic constraint application
 * - Computed UI state (visible/disabled)
 * - Audit logging in development
 */

import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  RankingStateResolver,
  RANKING_DEFAULTS,
  type RankingState,
  type ResolvedRankingState,
  type MetricType,
  type DisplayMode,
  type RankingViewType,
  type UIFieldState
} from '@/lib/state/ranking'

/**
 * Get default state for initial render before route is available
 */
function getDefaultResolvedState(): ResolvedRankingState {
  return {
    state: RANKING_DEFAULTS as RankingState,
    ui: {
      standardPopulation: { visible: true, disabled: false },
      baselineMethod: { visible: true, disabled: false },
      baselinePeriod: { visible: true, disabled: false },
      percentage: { visible: true, disabled: false },
      predictionInterval: { visible: true, disabled: false },
      totalsOnly: { visible: true, disabled: false },
      cumulative: { visible: true, disabled: false },
      showTotal: { visible: false, disabled: true }
    },
    view: 'relative',
    userOverrides: new Set(),
    log: {
      timestamp: new Date().toISOString(),
      trigger: 'initial',
      before: {},
      after: { ...RANKING_DEFAULTS },
      changes: [],
      userOverridesFromUrl: []
    }
  }
}

export function useRankingState() {
  const route = useRoute()
  const router = useRouter()

  // ============================================================================
  // RESOLVED STATE
  // ============================================================================

  // Resolved state from StateResolver
  const resolved = ref<ResolvedRankingState>(getDefaultResolvedState())

  // Flag to prevent re-resolving during URL updates we initiated
  let isUpdatingUrl = false

  // Initialize on mount
  onMounted(() => {
    resolved.value = RankingStateResolver.resolveInitial(route)
  })

  // Re-resolve when URL changes (e.g., back/forward navigation)
  watch(
    () => route.query,
    () => {
      // Skip if we're the ones updating the URL
      if (isUpdatingUrl) return

      resolved.value = RankingStateResolver.resolveInitial(route)
    }
  )

  // ============================================================================
  // STATE ACCESSORS
  // ============================================================================

  /** Current resolved state */
  const state = computed(() => resolved.value.state)

  /** Current UI state for all fields */
  const ui = computed(() => resolved.value.ui)

  /** Current view type */
  const view = computed(() => resolved.value.view)

  // ============================================================================
  // UPDATE FUNCTION
  // ============================================================================

  /**
   * Update a single state field
   *
   * This is the primary way to change state. It:
   * 1. Resolves the change through the StateResolver
   * 2. Applies any cascading constraints
   * 3. Updates the URL
   */
  const updateState = async (field: string, value: unknown) => {
    const newResolved = RankingStateResolver.resolveChange(
      { field, value },
      resolved.value.state,
      resolved.value.userOverrides
    )

    resolved.value = newResolved

    // Update URL
    isUpdatingUrl = true
    try {
      await RankingStateResolver.applyResolvedState(newResolved, route, router)
    } finally {
      isUpdatingUrl = false
    }
  }

  /**
   * Batch update multiple state fields
   *
   * More efficient than calling updateState multiple times.
   * All changes are resolved together before updating URL.
   */
  const batchUpdate = async (updates: Partial<RankingState>) => {
    let currentResolved = resolved.value

    // Apply each change sequentially through the resolver
    for (const [field, value] of Object.entries(updates)) {
      currentResolved = RankingStateResolver.resolveChange(
        { field, value },
        currentResolved.state,
        currentResolved.userOverrides
      )
    }

    resolved.value = currentResolved

    // Update URL once with final state
    isUpdatingUrl = true
    try {
      await RankingStateResolver.applyResolvedState(currentResolved, route, router)
    } finally {
      isUpdatingUrl = false
    }
  }

  // ============================================================================
  // COMPUTED REFS FOR V-MODEL COMPATIBILITY
  // ============================================================================

  /** Period of time (yearly, fluseason, etc.) */
  const periodOfTime = computed({
    get: () => state.value.periodOfTime,
    set: val => updateState('periodOfTime', val)
  })

  /** Jurisdiction type (countries, usa, eu, etc.) */
  const jurisdictionType = computed({
    get: () => state.value.jurisdictionType,
    set: val => updateState('jurisdictionType', val)
  })

  /** Metric type (cmr, asmr, le) */
  const metricType = computed({
    get: () => state.value.metricType,
    set: (val: MetricType) => updateState('metricType', val)
  })

  /** Display mode (absolute, relative) - maps to view */
  const displayMode = computed({
    get: (): DisplayMode => state.value.view === 'absolute' ? 'absolute' : 'relative',
    set: (val: DisplayMode) => updateState('view', val as RankingViewType)
  })

  /** Show totals column */
  const showTotals = computed({
    get: () => state.value.showTotals,
    set: val => updateState('showTotals', val)
  })

  /** Show only the totals column */
  const showTotalsOnly = computed({
    get: () => state.value.showTotalsOnly,
    set: val => updateState('showTotalsOnly', val)
  })

  /** Show percentage values (excess mode only) */
  const showPercentage = computed({
    get: () => state.value.showPercentage,
    set: val => updateState('showPercentage', val)
  })

  /** Show prediction intervals */
  const showPI = computed({
    get: () => state.value.showPI,
    set: val => updateState('showPI', val)
  })

  /** Cumulative mode */
  const cumulative = computed({
    get: () => state.value.cumulative,
    set: val => updateState('cumulative', val)
  })

  /** Hide incomplete data */
  const hideIncomplete = computed({
    get: () => state.value.hideIncomplete,
    set: val => updateState('hideIncomplete', val)
  })

  /** Standard population for ASMR */
  const standardPopulation = computed({
    get: () => state.value.standardPopulation,
    set: val => updateState('standardPopulation', val)
  })

  /** Baseline calculation method */
  const baselineMethod = computed({
    get: () => state.value.baselineMethod,
    set: val => updateState('baselineMethod', val)
  })

  /** Decimal precision for display */
  const decimalPrecision = computed({
    get: () => state.value.decimalPrecision,
    set: val => updateState('decimalPrecision', val)
  })

  /** Start date for data range */
  const dateFrom = computed({
    get: () => state.value.dateFrom,
    set: val => updateState('dateFrom', val)
  })

  /** End date for data range */
  const dateTo = computed({
    get: () => state.value.dateTo,
    set: val => updateState('dateTo', val)
  })

  /** Start date for baseline calculation */
  const baselineDateFrom = computed({
    get: () => state.value.baselineDateFrom,
    set: val => updateState('baselineDateFrom', val)
  })

  /** End date for baseline calculation */
  const baselineDateTo = computed({
    get: () => state.value.baselineDateTo,
    set: val => updateState('baselineDateTo', val)
  })

  // ============================================================================
  // UI STATE HELPERS
  // ============================================================================

  /**
   * Get UI state for a specific field
   */
  const getUIState = (field: string): UIFieldState => {
    return ui.value[field] || { visible: true, disabled: false }
  }

  /**
   * Check if a field is visible
   */
  const isVisible = (field: string): boolean => {
    return getUIState(field).visible
  }

  /**
   * Check if a field is disabled
   */
  const isDisabled = (field: string): boolean => {
    return getUIState(field).disabled
  }

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    // Raw state access
    state,
    ui,
    view,

    // Individual computed refs for v-model
    periodOfTime,
    jurisdictionType,
    metricType,
    displayMode,
    showTotals,
    showTotalsOnly,
    showPercentage,
    showPI,
    cumulative,
    hideIncomplete,
    standardPopulation,
    baselineMethod,
    decimalPrecision,
    dateFrom,
    dateTo,
    baselineDateFrom,
    baselineDateTo,

    // Update functions
    updateState,
    batchUpdate,

    // UI helpers
    getUIState,
    isVisible,
    isDisabled,

    // Backwards compatibility
    currentState: state,
    isValid: computed(() => true), // StateResolver ensures valid state
    errors: computed(() => []),
    getValidatedState: () => state.value
  }
}
