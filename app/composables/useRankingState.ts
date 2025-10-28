/**
 * Ranking State Management Composable
 *
 * Phase 9.1: Centralized state management with validation for ranking page
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
import { rankingStateSchema, type RankingState } from '@/model/rankingSchema'
import { showToast } from '@/toast'
import { encodeBool, decodeBool } from '@/lib/state/stateSerializer'

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

  // ============================================================================
  // URL STATE REFS
  // ============================================================================

  // Period configuration
  const periodOfTime = computed({
    get: () => (route.query.p as string) || 'fluseason',
    set: (val: string) => updateQuery({ p: val })
  })

  const jurisdictionType = computed({
    get: () => (route.query.j as string) || 'country',
    set: (val: string) => updateQuery({ j: val })
  })

  // Display toggles
  const showASMR = computed({
    get: () => decodeBool(route.query.a as string) ?? true,
    set: (val: boolean) => updateQuery({ a: encodeBool(val) })
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

  const showRelative = computed({
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
    get: () => !(decodeBool(route.query.i as string) ?? false),
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
  const dateFrom = computed({
    get: () => (route.query.df as string) || '2020/21',
    set: (val: string) => updateQuery({ df: val })
  })

  const dateTo = computed({
    get: () => (route.query.dt as string) || '2023/24',
    set: (val: string) => updateQuery({ dt: val })
  })

  const baselineDateFrom = computed({
    get: () => (route.query.bf as string) || '2015/16',
    set: (val: string) => updateQuery({ bf: val })
  })

  const baselineDateTo = computed({
    get: () => (route.query.bt as string) || '2019/20',
    set: (val: string) => updateQuery({ bt: val })
  })

  // ============================================================================
  // VALIDATION - Gather complete state and validate
  // ============================================================================

  const currentState = computed<RankingState>(() => ({
    periodOfTime: periodOfTime.value as RankingState['periodOfTime'],
    jurisdictionType: jurisdictionType.value as RankingState['jurisdictionType'],
    showASMR: showASMR.value,
    showTotals: showTotals.value,
    showTotalsOnly: showTotalsOnly.value,
    showRelative: showRelative.value,
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

  // Track if we've already shown a toast to avoid spamming
  let lastErrorMessage = ''

  watch(
    errors,
    (newErrors) => {
      if (newErrors.length === 0) {
        lastErrorMessage = ''
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

      // For errors that can't be auto-fixed, notify user
      // Only show if error message has changed to avoid spam
      const firstError = newErrors[0]
      if (firstError && firstError.message !== lastErrorMessage) {
        lastErrorMessage = firstError.message
        showToast(firstError.message, 'warning')
      }
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

    // Display toggles
    showASMR,
    showTotals,
    showTotalsOnly,
    showRelative,
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
    getValidatedState
  }
}
