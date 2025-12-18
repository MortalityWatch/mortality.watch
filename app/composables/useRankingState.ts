/**
 * Ranking State Management Composable
 *
 * Provides:
 * - All URL state refs (maintaining URL-first architecture)
 * - Real-time validation using Zod schema
 * - Auto-fix for incompatible state combinations
 * - User notifications for invalid states
 *
 * Note: This composable provides validation infrastructure for the ranking page.
 * Actual integration into ranking.vue may come in a later phase.
 */

import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { rankingStateSchema, type RankingState, type MetricType } from '@/model/rankingSchema'
import { showToast } from '@/toast'
import { encodeBool, decodeBool } from '@/lib/state'

// Valid metric types for validation
const VALID_METRIC_TYPES = ['cmr', 'asmr', 'le'] as const

export function useRankingState() {
  const route = useRoute()
  const router = useRouter()

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const updateQuery = (updates: Record<string, string | number | undefined>) => {
    const newQuery: Record<string, string | string[]> = {}
    for (const [k, v] of Object.entries(route.query)) {
      if (v !== null && v !== undefined) {
        newQuery[k] = Array.isArray(v) ? v.filter((x): x is string => x !== null) : v
      }
    }
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined) {
        Reflect.deleteProperty(newQuery, k)
      } else {
        newQuery[k] = String(v)
      }
    }
    router.push({ query: newQuery })
  }

  /**
   * Batch multiple state updates into a single router.push
   *
   * IMPORTANT: Use this method when updating multiple state values at once
   * to prevent race conditions where sequential router.push calls read from
   * stale route.query, causing later pushes to overwrite earlier changes.
   *
   * @param updates - Object with state field names and their new values
   */
  const batchUpdate = (updates: Partial<{
    periodOfTime: string
    jurisdictionType: string
    metricType: MetricType
    showTotals: boolean
    showTotalsOnly: boolean
    showPercentage: boolean
    showPI: boolean
    cumulative: boolean
    hideIncomplete: boolean
    standardPopulation: string
    baselineMethod: string
    decimalPrecision: string
    dateFrom: string | undefined
    dateTo: string | undefined
    baselineDateFrom: string | undefined
    baselineDateTo: string | undefined
  }>) => {
    // Map state field names to URL query parameter keys
    const queryUpdates: Record<string, string | number | undefined> = {}

    if ('periodOfTime' in updates) queryUpdates.p = updates.periodOfTime
    if ('jurisdictionType' in updates) queryUpdates.j = updates.jurisdictionType
    if ('metricType' in updates) queryUpdates.m = updates.metricType
    if ('showTotals' in updates) queryUpdates.t = encodeBool(updates.showTotals!)
    if ('showTotalsOnly' in updates) queryUpdates.to = encodeBool(updates.showTotalsOnly!)
    if ('showPercentage' in updates) queryUpdates.r = encodeBool(updates.showPercentage!)
    if ('showPI' in updates) queryUpdates.pi = encodeBool(updates.showPI!)
    if ('cumulative' in updates) queryUpdates.c = encodeBool(updates.cumulative!)
    if ('hideIncomplete' in updates) queryUpdates.i = encodeBool(!updates.hideIncomplete!)
    if ('standardPopulation' in updates) queryUpdates.sp = updates.standardPopulation
    if ('baselineMethod' in updates) queryUpdates.bm = updates.baselineMethod
    if ('decimalPrecision' in updates) queryUpdates.dp = updates.decimalPrecision
    if ('dateFrom' in updates) queryUpdates.df = updates.dateFrom
    if ('dateTo' in updates) queryUpdates.dt = updates.dateTo
    if ('baselineDateFrom' in updates) queryUpdates.bf = updates.baselineDateFrom
    if ('baselineDateTo' in updates) queryUpdates.bt = updates.baselineDateTo

    updateQuery(queryUpdates)
  }

  // ============================================================================
  // URL STATE REFS
  // ============================================================================

  // Period configuration
  const periodOfTime = computed({
    get: () => (route.query.p as string) || 'fluseason',
    set: (val: string) => updateQuery({ p: val })
  })

  const jurisdictionType = computed({
    get: () => (route.query.j as string) || 'countries', // Default to 'countries' to match shouldShowCountry expectations
    set: (val: string) => updateQuery({ j: val })
  })

  // Metric type (CMR, ASMR, or Life Expectancy)
  // Supports backwards compatibility with legacy 'a' param (a=1 → asmr, a=0 → cmr)
  const metricType = computed({
    get: (): MetricType => {
      // First check new 'm' param
      const m = route.query.m as string
      if (m && VALID_METRIC_TYPES.includes(m as MetricType)) {
        return m as MetricType
      }
      // Fall back to legacy 'a' param for backwards compatibility
      const legacyA = route.query.a as string
      if (legacyA !== undefined) {
        return decodeBool(legacyA) ? 'asmr' : 'cmr'
      }
      // Default to ASMR for standardized comparison
      return 'asmr'
    },
    set: (val: MetricType) => updateQuery({ m: val, a: undefined }) // Clear legacy 'a' param
  })

  const showTotals = computed({
    get: () => decodeBool(route.query.t as string) ?? true,
    set: (val: boolean) => updateQuery({ t: encodeBool(val) })
  })

  const showTotalsOnly = computed({
    get: () => {
      if (!showTotals.value) return false
      return decodeBool(route.query.to as string) ?? false
    },
    set: (val: boolean) => updateQuery({ to: encodeBool(val) })
  })

  const showPercentage = computed({
    get: () => decodeBool(route.query.r as string) ?? true,
    set: (val: boolean) => updateQuery({ r: encodeBool(val) })
  })

  const showPI = computed({
    get: () => {
      if (cumulative.value || showTotalsOnly.value) return false
      return decodeBool(route.query.pi as string) ?? false
    },
    set: (val: boolean) => updateQuery({ pi: encodeBool(val) })
  })

  const cumulative = computed({
    get: () => decodeBool(route.query.c as string) ?? false,
    set: (val: boolean) => updateQuery({ c: encodeBool(val) })
  })

  const hideIncomplete = computed({
    get: () => !(decodeBool(route.query.i as string) ?? false), // Default to false = hide incomplete data
    set: (val: boolean) => updateQuery({ i: encodeBool(!val) })
  })

  // Metric configuration
  const standardPopulation = computed({
    get: () => (route.query.sp as string) || 'who',
    set: (val: string) => updateQuery({ sp: val })
  })

  const baselineMethod = computed({
    get: () => (route.query.bm as string) || 'mean',
    set: (val: string) => updateQuery({ bm: val })
  })

  const decimalPrecision = computed({
    get: () => (route.query.dp as string) || '1',
    set: (val: string) => updateQuery({ dp: val })
  })

  // Date range
  // Note: undefined defaults - sliderValue in ranking.vue provides computed defaults
  // This matches explorer pattern and avoids state/URL conflicts
  const dateFrom = computed({
    get: () => (route.query.df as string) || undefined,
    set: (val: string | undefined) => updateQuery({ df: val })
  })

  const dateTo = computed({
    get: () => (route.query.dt as string) || undefined,
    set: (val: string | undefined) => updateQuery({ dt: val })
  })

  const baselineDateFrom = computed({
    get: () => (route.query.bf as string) || undefined,
    set: (val: string | undefined) => updateQuery({ bf: val })
  })

  const baselineDateTo = computed({
    get: () => (route.query.bt as string) || undefined,
    set: (val: string | undefined) => updateQuery({ bt: val })
  })

  // ============================================================================
  // VALIDATION - Gather complete state and validate
  // ============================================================================

  const currentState = computed<RankingState>(() => ({
    periodOfTime: periodOfTime.value as RankingState['periodOfTime'],
    jurisdictionType: jurisdictionType.value as RankingState['jurisdictionType'],
    metricType: metricType.value,
    showTotals: showTotals.value,
    showTotalsOnly: showTotalsOnly.value,
    showPercentage: showPercentage.value,
    showPI: showPI.value,
    cumulative: cumulative.value,
    hideIncomplete: hideIncomplete.value,
    standardPopulation: standardPopulation.value as RankingState['standardPopulation'],
    baselineMethod: baselineMethod.value as RankingState['baselineMethod'],
    decimalPrecision: decimalPrecision.value as RankingState['decimalPrecision'],
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
    baselineDateFrom: baselineDateFrom.value,
    baselineDateTo: baselineDateTo.value
  }))

  const validationResult = computed(() =>
    rankingStateSchema.safeParse(currentState.value)
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

      // Skip validation errors when dates are still undefined (initial load)
      // Also skip if baseline dates are undefined (will use computed defaults)
      if (!dateFrom.value || !dateTo.value || !baselineDateFrom.value || !baselineDateTo.value) {
        return
      }

      // Log validation errors for debugging
      console.warn('[useRankingState] Validation errors:', newErrors)

      // Auto-fix: showTotalsOnly requires showTotals
      const totalsOnlyError = newErrors.find(e =>
        e.message.includes('requires show totals')
      )
      if (totalsOnlyError) {
        showTotalsOnly.value = false
        return // Exit early after auto-fix
      }

      // Auto-fix: PI not compatible with cumulative
      const piCumulativeError = newErrors.find(e =>
        e.message.includes('cannot be shown with cumulative')
      )
      if (piCumulativeError) {
        showPI.value = false
        return // Exit early after auto-fix
      }

      // Auto-fix: PI not compatible with totals only
      const piTotalsOnlyError = newErrors.find(e =>
        e.message.includes('cannot be shown with totals only')
      )
      if (piTotalsOnlyError) {
        showPI.value = false
        return // Exit early after auto-fix
      }

      // Skip date format validation errors - these are transient during period type changes
      // The periodOfTimeChanged handler ensures correct formats, but during the batch update
      // the computed currentState may momentarily have mismatched period type and date formats
      const dateFormatErrors = newErrors.filter(e =>
        e.message.includes('Date format must be')
      )
      if (dateFormatErrors.length === newErrors.length) {
        // All errors are date format errors - skip them
        return
      }

      // For errors that can't be auto-fixed, notify user only once per unique error
      // Filter out date format errors since they're transient
      const nonDateFormatErrors = newErrors.filter(e =>
        !e.message.includes('Date format must be')
      )
      const errorMessages = new Set(nonDateFormatErrors.map(e => e.message))

      // Only show toasts for errors we haven't shown before
      errorMessages.forEach((errorMsg) => {
        if (!lastShownErrors.has(errorMsg)) {
          lastShownErrors.add(errorMsg)
          // showToast will automatically log to console
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

  const getValidatedState = (): RankingState => {
    const result = rankingStateSchema.safeParse(currentState.value)
    if (!result.success) {
      throw new Error(`Invalid state: ${result.error.issues[0]?.message}`)
    }
    return result.data
  }

  // ============================================================================
  // RETURN API
  // ============================================================================

  return {
    // Period configuration
    periodOfTime,
    jurisdictionType,

    // Metric type (CMR, ASMR, or Life Expectancy)
    metricType,

    // Display toggles
    showTotals,
    showTotalsOnly,
    showPercentage,
    showPI,
    cumulative,
    hideIncomplete,

    // Metric configuration
    standardPopulation,
    baselineMethod,
    decimalPrecision,

    // Date range
    dateFrom,
    dateTo,
    baselineDateFrom,
    baselineDateTo,

    // Validation API
    currentState,
    isValid,
    errors,
    getValidatedState,

    // Batch updates (prevents race conditions)
    batchUpdate
  }
}
