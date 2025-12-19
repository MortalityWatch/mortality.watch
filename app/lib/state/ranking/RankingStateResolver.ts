/**
 * Ranking State Resolver
 *
 * Centralized state resolution system for the ranking page.
 * Follows the same patterns as the explorer StateResolver.
 *
 * Features:
 * - Takes state changes as input
 * - Applies business rule constraints
 * - Resolves conflicts using priority system
 * - Returns complete resolved state with audit trail
 * - Computes UI visibility/disabled state
 */

import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import type {
  RankingState,
  RankingViewType,
  ResolvedRankingState,
  RankingResolutionLog,
  UIFieldState,
  RankingUICondition
} from './types'
import type { RankingViewConfig } from './views'
import { getRankingViewConfig } from './views'
import { RANKING_CONSTRAINTS } from './constraints'
import { rankingFieldEncoders, RANKING_DEFAULTS, LEGACY_ASMR_KEY, decodeMetricType } from './fieldEncoders'

// ============================================================================
// UI STATE COMPUTATION
// ============================================================================

/**
 * Evaluate a UI condition against current state
 */
function evaluateCondition(
  condition: RankingUICondition,
  state: Record<string, unknown>
): boolean {
  // Handle AND conditions
  if ('and' in condition && condition.and) {
    return condition.and.every(c => evaluateCondition(c, state))
  }

  // Handle OR conditions
  if ('or' in condition && condition.or) {
    return condition.or.some(c => evaluateCondition(c, state))
  }

  // Handle simple field comparison
  if ('field' in condition && 'is' in condition) {
    return state[condition.field] === condition.is
  }

  return false
}

/**
 * Compute UI state for all fields from view config and current state
 */
function computeUIState(
  viewConfig: RankingViewConfig,
  state: Record<string, unknown>
): Record<string, UIFieldState> {
  const ui: Record<string, UIFieldState> = {}

  const uiConfig = viewConfig.ui as unknown as Record<string, { visibility: { type: string, toggleable?: boolean, when?: RankingUICondition } }>

  for (const [field, element] of Object.entries(uiConfig)) {
    const { visibility } = element

    let visible = true
    let disabled = false

    switch (visibility.type) {
      case 'hidden':
        visible = false
        disabled = true
        break

      case 'visible':
        visible = true
        disabled = visibility.toggleable === false
        break

      case 'conditional':
        visible = visibility.when ? evaluateCondition(visibility.when, state) : true
        disabled = !visible
        break
    }

    ui[field] = { visible, disabled }
  }

  return ui
}

// ============================================================================
// STATE RESOLVER CLASS
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class RankingStateResolver {
  /**
   * Detect view type from URL query parameters
   *
   * @param query - URL query parameters
   * @returns The detected view type
   */
  static detectView(query: Record<string, unknown>): RankingViewType {
    const e = query.e as string
    // e=0 means absolute mode, anything else (including absent) means relative
    return e === '0' ? 'absolute' : 'relative'
  }

  /**
   * Resolve initial state from URL parameters
   *
   * Called on page load. Applies:
   * 1. View detection from URL
   * 2. View defaults
   * 3. URL parameter overrides
   * 4. Constraint resolution
   * 5. UI state computation
   *
   * @param route - Vue Router route object
   * @returns Complete resolved state with UI metadata
   */
  static resolveInitial(route: RouteLocationNormalizedLoaded): ResolvedRankingState {
    const log: RankingResolutionLog = {
      timestamp: new Date().toISOString(),
      trigger: 'initial',
      before: {},
      after: {},
      changes: [],
      userOverridesFromUrl: []
    }

    // 1. Detect view from URL
    const view = this.detectView(route.query)
    const viewConfig = getRankingViewConfig(view)

    // 2. Start with defaults merged with view-specific defaults
    const state: Record<string, unknown> = {
      ...RANKING_DEFAULTS,
      ...viewConfig.defaults,
      view
    }

    const userOverrides = new Set<string>()

    // 3. Apply URL parameters
    for (const [field, encoder] of Object.entries(rankingFieldEncoders)) {
      const urlKey = encoder.key
      const urlValue = route.query[urlKey]

      if (urlValue !== undefined && urlValue !== null) {
        try {
          let decoded: unknown
          if ('decode' in encoder && encoder.decode) {
            decoded = encoder.decode(urlValue as string)
          } else {
            decoded = urlValue
          }

          const defaultValue = state[field]
          const isDifferentFromDefault = !this.valuesEqual(decoded, defaultValue)

          if (isDifferentFromDefault) {
            userOverrides.add(field)
            log.userOverridesFromUrl.push(field)

            log.changes.push({
              field,
              urlKey,
              oldValue: defaultValue,
              newValue: decoded,
              priority: 'user',
              reason: 'Set in URL'
            })
          }

          state[field] = decoded
        } catch (error) {
          console.warn(`[RankingStateResolver] Skipping malformed URL param: ${urlKey}=${urlValue}`, error)
        }
      }
    }

    // Handle legacy 'a' param for backwards compatibility
    const legacyA = route.query[LEGACY_ASMR_KEY] as string | undefined
    if (legacyA !== undefined && !route.query.m) {
      const metricType = decodeMetricType(undefined, legacyA)
      state.metricType = metricType
      userOverrides.add('metricType')
      log.userOverridesFromUrl.push('metricType')
      log.changes.push({
        field: 'metricType',
        urlKey: 'a (legacy)',
        oldValue: RANKING_DEFAULTS.metricType,
        newValue: metricType,
        priority: 'user',
        reason: 'Set in URL (legacy a param)'
      })
    }

    // 4. Apply constraints
    const constrainedState = this.applyConstraints(state, userOverrides, log)

    log.after = { ...constrainedState }

    // 5. Compute UI state
    const ui = computeUIState(viewConfig, constrainedState)

    const result: ResolvedRankingState = {
      state: constrainedState as unknown as RankingState,
      ui,
      view,
      userOverrides,
      log
    }

    // 6. Log resolution in development
    this.logResolution(log, 'INITIAL', result)

    return result
  }

  /**
   * Resolve a state change from user action
   *
   * Called when user clicks toggle, changes dropdown, etc.
   * Applies the change → constraints → UI state
   *
   * @param change - The field that changed and its new value
   * @param currentState - Current state values
   * @param currentUserOverrides - Fields explicitly set by user
   * @returns Resolved state with all cascading changes
   */
  static resolveChange(
    change: { field: string, value: unknown },
    currentState: RankingState,
    currentUserOverrides: Set<string> = new Set()
  ): ResolvedRankingState {
    const log: RankingResolutionLog = {
      timestamp: new Date().toISOString(),
      trigger: change,
      before: { ...currentState },
      after: {},
      changes: [],
      userOverridesFromUrl: Array.from(currentUserOverrides)
    }

    const state: Record<string, unknown> = { ...currentState }
    const userOverrides = new Set(currentUserOverrides)

    // 1. Apply the triggering change
    const oldValue = state[change.field]
    state[change.field] = change.value
    userOverrides.add(change.field)

    const urlKey = rankingFieldEncoders[change.field as keyof typeof rankingFieldEncoders]?.key || change.field
    log.changes.push({
      field: change.field,
      urlKey,
      oldValue,
      newValue: change.value,
      priority: 'user',
      reason: 'User action'
    })

    // 2. Handle view change - apply view defaults
    if (change.field === 'view') {
      const newView = change.value as RankingViewType
      const viewConfig = getRankingViewConfig(newView)

      for (const [field, value] of Object.entries(viewConfig.defaults || {})) {
        if (!userOverrides.has(field) || field === 'showPercentage' || field === 'showPI') {
          const fieldOldValue = state[field]
          if (fieldOldValue !== value) {
            state[field] = value
            const fieldUrlKey = rankingFieldEncoders[field as keyof typeof rankingFieldEncoders]?.key || field

            log.changes.push({
              field,
              urlKey: fieldUrlKey,
              oldValue: fieldOldValue,
              newValue: value,
              priority: 'view-default',
              reason: `${viewConfig.label} view default`
            })
          }
        }
      }
    }

    // 3. Apply constraints
    const constrainedState = this.applyConstraints(state, userOverrides, log)

    log.after = { ...constrainedState }

    // 4. Get view and compute UI state
    const view = constrainedState.view as RankingViewType
    const viewConfig = getRankingViewConfig(view)
    const ui = computeUIState(viewConfig, constrainedState)

    const result: ResolvedRankingState = {
      state: constrainedState as unknown as RankingState,
      ui,
      view,
      userOverrides,
      log
    }

    // 5. Log resolution in development
    this.logResolution(log, 'CHANGE', result)

    return result
  }

  /**
   * Apply all constraints to state in priority order
   *
   * @private
   */
  private static applyConstraints(
    state: Record<string, unknown>,
    userOverrides: Set<string>,
    log: RankingResolutionLog
  ): Record<string, unknown> {
    const newState = { ...state }

    // Sort constraints by priority (high to low)
    const sortedConstraints = [...RANKING_CONSTRAINTS].sort((a, b) => {
      const priorityA = a.priority ?? 1
      const priorityB = b.priority ?? 1
      return priorityB - priorityA
    })

    for (const constraint of sortedConstraints) {
      // Check if constraint applies
      if (!constraint.when(newState)) {
        continue
      }

      // Apply each field in the constraint
      for (const [field, value] of Object.entries(constraint.apply)) {
        const isUserOverride = userOverrides.has(field)
        const urlKey = rankingFieldEncoders[field as keyof typeof rankingFieldEncoders]?.key || field

        // Apply unless: user has overridden AND constraint allows override
        const shouldApply = !(isUserOverride && constraint.allowUserOverride)

        if (shouldApply) {
          const oldValue = newState[field]

          if (oldValue !== value) {
            newState[field] = value

            log.changes.push({
              field,
              urlKey,
              oldValue,
              newValue: value,
              priority: `constraint (p${constraint.priority ?? 1})`,
              reason: constraint.reason
            })
          }
        }
      }
    }

    return newState
  }

  /**
   * Apply resolved state to URL
   *
   * Builds a minimal query object containing only non-default values.
   *
   * @param resolved - Resolved state from resolveChange()
   * @param route - Current route
   * @param router - Vue router instance
   * @param options - Options for URL update
   */
  static async applyResolvedState(
    resolved: ResolvedRankingState,
    _route: RouteLocationNormalizedLoaded,
    router: Router,
    options: { replaceHistory?: boolean } = {}
  ): Promise<void> {
    const newQuery: Record<string, string> = {}

    // Get view-specific defaults
    const view = resolved.view
    const viewConfig = getRankingViewConfig(view)
    const viewDefaults = { ...RANKING_DEFAULTS, ...viewConfig.defaults }

    // Handle view first
    if (view === 'absolute') {
      newQuery.e = '0'
    }
    // relative view has no special parameter (it's the default)

    // For each state field, only add to URL if different from view default
    for (const [field, encoder] of Object.entries(rankingFieldEncoders)) {
      if (field === 'view') continue // Handled above

      const urlKey = encoder.key
      const newValue = resolved.state[field as keyof RankingState]
      const defaultValue = viewDefaults[field as keyof typeof viewDefaults]

      // Skip if value matches view default
      if (this.valuesEqual(newValue, defaultValue)) {
        continue
      }

      // Skip undefined values
      if (newValue === undefined) {
        continue
      }

      // Encode the value
      let encodedValue: string | number | undefined
      if ('encode' in encoder && encoder.encode) {
        encodedValue = encoder.encode(newValue as never)
      } else {
        encodedValue = newValue as string
      }

      if (encodedValue !== undefined) {
        newQuery[urlKey] = String(encodedValue)
      }
    }

    // Use router.replace() for initial state or router.push() for user actions
    if (options.replaceHistory) {
      await router.replace({ query: newQuery })
    } else {
      await router.push({ query: newQuery })
    }
  }

  /**
   * Check if two values are equal (with deep comparison for arrays)
   *
   * @private
   */
  private static valuesEqual(a: unknown, b: unknown): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false
      return a.every((val, idx) => val === b[idx])
    }
    return a === b
  }

  /**
   * Log resolution to console (development only)
   *
   * @private
   */
  private static logResolution(
    log: RankingResolutionLog,
    type: 'INITIAL' | 'CHANGE',
    resolved: ResolvedRankingState
  ): void {
    // Only log in development mode
    if (!import.meta.dev) return

    const emoji = type === 'INITIAL' ? '🚀' : '🔄'
    const trigger = log.trigger !== 'initial' ? log.trigger : null
    const title = type === 'INITIAL'
      ? 'Ranking Initial State Resolution'
      : trigger
        ? `Ranking State Resolution: ${trigger.field} = ${JSON.stringify(trigger.value)}`
        : 'Ranking State Resolution'

    console.group(`${emoji} ${title}`)

    if (type === 'CHANGE') {
      console.log('📋 BEFORE:', log.before)
    }
    console.log('📋 AFTER:', log.after)

    if (log.changes.length > 0) {
      console.group('🔧 Changes Applied:')
      log.changes.forEach((change) => {
        const arrow = change.oldValue !== undefined
          ? `${JSON.stringify(change.oldValue)} → ${JSON.stringify(change.newValue)}`
          : JSON.stringify(change.newValue)
        console.log(
          `  ${change.field} (${change.urlKey}): ${arrow}`,
          `[${change.priority}] ${change.reason}`
        )
      })
      console.groupEnd()
    }

    console.log('👤 User Overrides:', log.userOverridesFromUrl)
    console.log('👁️ UI State:', this.formatUIState(resolved.ui))

    console.groupEnd()
  }

  /**
   * Format UI state for logging
   *
   * @private
   */
  private static formatUIState(ui: Record<string, UIFieldState>): string[] {
    const visible: string[] = []
    const hidden: string[] = []

    for (const [field, state] of Object.entries(ui)) {
      if (state.visible) {
        const suffix = state.disabled ? ' (disabled)' : ''
        visible.push(field + suffix)
      } else {
        hidden.push(field)
      }
    }

    return visible.length > 0
      ? visible
      : ['(no UI controls visible)']
  }
}
