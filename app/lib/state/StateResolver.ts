/**
 * State Resolver
 *
 * Centralized state resolution system that:
 * - Takes state changes as input
 * - Applies business rule constraints
 * - Resolves conflicts using priority system
 * - Returns complete resolved state with audit trail
 * - Integrates with existing URL state system
 */

import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { stateFieldEncoders } from '@/lib/state/stateSerializer'
import { STATE_CONSTRAINTS, DEFAULT_VALUES } from './constraints'
import type { StateChange, ResolvedState, StateResolutionLog, StateFieldMetadata } from './types'
import { detectView } from './viewDetector'
import { getViewConstraints } from './viewConstraints'
import type { ViewType } from './viewTypes'
import { VIEWS } from './views'
import { computeUIState } from './uiStateComputer'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class StateResolver {
  /**
   * Resolve initial state from URL parameters + defaults
   *
   * Called on page load (explorer, ranking, etc.)
   * Applies defaults → URL params → constraints
   *
   * @param route - Vue Router route object
   * @returns Complete resolved state with metadata and audit log
   */
  static resolveInitial(route: RouteLocationNormalizedLoaded): ResolvedState {
    const log: StateResolutionLog = {
      timestamp: new Date().toISOString(),
      trigger: 'initial',
      before: {},
      after: {},
      changes: [],
      userOverridesFromUrl: []
    }

    // 1. Start with defaults
    const state = { ...DEFAULT_VALUES }
    const metadata: Record<string, StateFieldMetadata> = {}
    const userOverrides = new Set<string>()

    // Initialize metadata with defaults
    for (const [field, value] of Object.entries(DEFAULT_VALUES)) {
      metadata[field] = {
        value,
        priority: 'default',
        reason: 'System default',
        changed: false,
        urlKey: stateFieldEncoders[field as keyof typeof stateFieldEncoders]?.key
      }
    }

    // 2. Validate and apply URL parameters (user overrides)
    const validatedUrlParams = this.validateUrlParams(route)

    for (const [field, value] of Object.entries(validatedUrlParams)) {
      userOverrides.add(field)
      log.userOverridesFromUrl.push(field)

      state[field] = value

      const urlKey = stateFieldEncoders[field as keyof typeof stateFieldEncoders]?.key || field
      metadata[field] = {
        value,
        priority: 'user',
        reason: 'Set in URL',
        changed: true,
        urlKey
      }

      log.changes.push({
        field,
        urlKey,
        oldValue: DEFAULT_VALUES[field],
        newValue: value,
        priority: 'user',
        reason: 'Set in URL'
      })
    }

    // 3. Detect and add view to state (derived from URL params)
    const view = detectView(route.query)
    state.view = view

    // 4. Apply constraints (including view-specific constraints)
    const constrainedState = this.applyConstraints(state, userOverrides, log)

    log.after = { ...constrainedState }

    // 5. Compute UI state from view configuration
    const viewConfig = VIEWS[view as ViewType] || VIEWS.mortality
    const ui = computeUIState(viewConfig, constrainedState)

    // 6. Log resolution
    this.logResolution(log, 'INITIAL')

    return {
      state: constrainedState,
      ui,
      metadata,
      changedFields: log.changes.map(c => c.field),
      userOverrides,
      log
    }
  }

  /**
   * Resolve a state change from user action
   *
   * Called when user clicks toggle, changes dropdown, etc.
   * Applies the change → constraints → returns resolved state
   *
   * @param change - The field that changed and its new value
   * @param currentState - Current state values
   * @param currentUserOverrides - Fields explicitly set by user (from URL)
   * @returns Resolved state with all cascading changes
   */
  static resolveChange(
    change: StateChange,
    currentState: Record<string, unknown>,
    currentUserOverrides: Set<string>
  ): ResolvedState {
    const log: StateResolutionLog = {
      timestamp: new Date().toISOString(),
      trigger: change,
      before: { ...currentState },
      after: {},
      changes: [],
      userOverridesFromUrl: Array.from(currentUserOverrides)
    }

    const state = { ...currentState }
    const metadata: Record<string, StateFieldMetadata> = {}

    // Clone user overrides to avoid mutation
    const userOverrides = new Set(currentUserOverrides)

    // 1. Apply the triggering change
    const urlKey = stateFieldEncoders[change.field as keyof typeof stateFieldEncoders]?.key || change.field
    state[change.field] = change.value

    // If user made this change, add to overrides
    if (change.source === 'user') {
      userOverrides.add(change.field)
    }

    metadata[change.field] = {
      value: change.value,
      priority: 'user',
      reason: `User ${change.source} action`,
      changed: true,
      urlKey
    }

    log.changes.push({
      field: change.field,
      urlKey,
      oldValue: currentState[change.field],
      newValue: change.value,
      priority: 'user',
      reason: `User ${change.source} action`
    })

    // 2. Apply constraints
    const constrainedState = this.applyConstraints(state, userOverrides, log)

    log.after = { ...constrainedState }

    // 3. Compute UI state from view configuration
    const view = (constrainedState.view as ViewType) || 'mortality'
    const viewConfig = VIEWS[view] || VIEWS.mortality
    const ui = computeUIState(viewConfig, constrainedState)

    // 4. Log resolution
    this.logResolution(log, 'CHANGE')

    return {
      state: constrainedState,
      ui,
      metadata,
      changedFields: log.changes.map(c => c.field),
      userOverrides,
      log
    }
  }

  /**
   * Resolve a view change from user action
   *
   * Called when user switches views (e.g., mortality ↔ excess ↔ zscore).
   * Applies view defaults → constraints → computes UI state.
   *
   * @param newView - The view to switch to
   * @param currentState - Current state values
   * @param currentUserOverrides - Fields explicitly set by user (from URL)
   * @returns Resolved state with view defaults and constraints applied
   */
  static resolveViewChange(
    newView: ViewType,
    currentState: Record<string, unknown>,
    currentUserOverrides: Set<string>
  ): ResolvedState {
    const log: StateResolutionLog = {
      timestamp: new Date().toISOString(),
      trigger: { field: 'view', value: newView, source: 'user' },
      before: { ...currentState },
      after: {},
      changes: [],
      userOverridesFromUrl: Array.from(currentUserOverrides)
    }

    const state = { ...currentState }
    const metadata: Record<string, StateFieldMetadata> = {}

    // Clone user overrides to avoid mutation
    const userOverrides = new Set(currentUserOverrides)

    // 1. Update view
    const oldView = state.view
    state.view = newView
    userOverrides.add('view')

    const urlKey = 'view'
    metadata.view = {
      value: newView,
      priority: 'user',
      reason: 'User changed view',
      changed: true,
      urlKey
    }

    log.changes.push({
      field: 'view',
      urlKey,
      oldValue: oldView,
      newValue: newView,
      priority: 'user',
      reason: 'User changed view'
    })

    // 2. Apply view defaults
    // When switching views, chartStyle should always use the new view's default
    // because chartStyle is set BY the view, not by explicit user action
    const viewConfig = VIEWS[newView]
    for (const [field, value] of Object.entries(viewConfig.defaults || {})) {
      // Special case: chartStyle is always set by view defaults, not user override
      const shouldApply = field === 'chartStyle' || !userOverrides.has(field)

      if (shouldApply) {
        const oldValue = state[field]
        if (oldValue !== value) {
          state[field] = value
          const fieldUrlKey = stateFieldEncoders[field as keyof typeof stateFieldEncoders]?.key || field

          log.changes.push({
            field,
            urlKey: fieldUrlKey,
            oldValue,
            newValue: value,
            priority: 'view-default',
            reason: `${viewConfig.label} view default`
          })
        }

        // Remove chartStyle from userOverrides since it's controlled by view
        if (field === 'chartStyle') {
          userOverrides.delete('chartStyle')
        }
      }
    }

    // 3. Apply constraints
    const constrainedState = this.applyConstraints(state, userOverrides, log)

    log.after = { ...constrainedState }

    // 4. Compute UI state from view configuration
    const ui = computeUIState(viewConfig, constrainedState)

    // 5. Log resolution
    this.logResolution(log, 'VIEW_CHANGE')

    return {
      state: constrainedState,
      ui,
      metadata,
      changedFields: log.changes.map(c => c.field),
      userOverrides,
      log
    }
  }

  /**
   * Apply all constraints to state in priority order
   *
   * Constraints are sorted by priority (high to low) and applied in order.
   * User overrides can block constraints if allowUserOverride=true.
   *
   * @private
   */
  private static applyConstraints(
    state: Record<string, unknown>,
    userOverrides: Set<string>,
    log: StateResolutionLog
  ): Record<string, unknown> {
    const newState = { ...state }

    // Detect view from state (or use default)
    const view = (state.view as ViewType) || 'mortality'
    const viewConstraints = getViewConstraints(view)

    // Merge view-specific constraints with global constraints
    const allConstraints = [...viewConstraints, ...STATE_CONSTRAINTS]

    // Sort constraints by priority (high to low)
    const sortedConstraints = allConstraints.sort((a, b) => {
      const priorityA = a.priority ?? 1
      const priorityB = b.priority ?? 1
      return priorityB - priorityA // Descending
    })

    for (const constraint of sortedConstraints) {
      // Check if constraint applies
      if (!constraint.when(newState)) {
        continue
      }

      // Apply each field in the constraint
      for (const [field, value] of Object.entries(constraint.apply)) {
        const isUserOverride = userOverrides.has(field)
        const urlKey = stateFieldEncoders[field as keyof typeof stateFieldEncoders]?.key || field

        // Determine if we should apply this constraint
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
   * Validate and sanitize URL parameters
   *
   * Handles malformed URLs and old bookmarked URLs gracefully.
   * Skips invalid params instead of crashing.
   *
   * @private
   */
  private static validateUrlParams(
    route: RouteLocationNormalizedLoaded
  ): Record<string, unknown> {
    const validated: Record<string, unknown> = {}

    for (const [field, encoder] of Object.entries(stateFieldEncoders)) {
      // Type guard for encoder
      if (!encoder || typeof encoder !== 'object' || !('key' in encoder)) {
        continue
      }

      const urlKey = encoder.key as string
      const urlValue = route.query[urlKey]

      if (urlValue !== undefined && urlValue !== null) {
        try {
          // Attempt to decode
          const decodeFn = 'decode' in encoder ? encoder.decode : null
          // Handle array of values by taking first element
          const valueToProcess = Array.isArray(urlValue) ? urlValue[0] : urlValue
          const decoded = decodeFn ? decodeFn(valueToProcess as string | number | undefined) : urlValue

          // Validate result is not null/undefined
          if (decoded !== null && decoded !== undefined) {
            validated[field] = decoded
          }
        } catch (error) {
          // Malformed param - skip it and use default
          console.warn(
            `[StateResolver] Skipping malformed URL param: ${urlKey}=${urlValue}`,
            error
          )
        }
      }
    }

    return validated
  }

  /**
   * Log resolution to console
   *
   * Disabled in production for performance.
   * Shows complete before/after state with all changes and reasons.
   *
   * @private
   */
  private static logResolution(
    log: StateResolutionLog,
    type: 'INITIAL' | 'CHANGE' | 'VIEW_CHANGE'
  ): void {
    // Skip logging in production
    if (typeof window !== 'undefined' && '__PROD__' in window && window.__PROD__) return

    const emoji = type === 'INITIAL' ? '🚀' : type === 'VIEW_CHANGE' ? '🔀' : '🔄'
    const trigger = log.trigger !== 'initial' ? log.trigger : null
    const title = type === 'INITIAL'
      ? 'Initial State Resolution'
      : type === 'VIEW_CHANGE'
        ? `View Change: ${JSON.stringify(trigger?.value)}`
        : trigger
          ? `State Resolution: ${trigger.field} = ${JSON.stringify(trigger.value)}`
          : 'State Resolution'

    console.group(`${emoji} ${title}`)

    if (type === 'CHANGE' || type === 'VIEW_CHANGE') {
      console.log('📋 BEFORE:', this.formatState(log.before))
    }
    console.log('📋 AFTER:', this.formatState(log.after))

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
    console.groupEnd()
  }

  /**
   * Format state object with URL keys for readability
   *
   * Shows both field name and URL key for each field.
   *
   * @private
   */
  private static formatState(state: Record<string, unknown>): Record<string, unknown> {
    const formatted: Record<string, unknown> = {}

    for (const [field, value] of Object.entries(state)) {
      const urlKey = stateFieldEncoders[field as keyof typeof stateFieldEncoders]?.key || field
      formatted[`${field} (${urlKey})`] = value
    }

    return formatted
  }

  /**
   * Check if two values are equal (with deep comparison for arrays)
   *
   * @private
   */
  private static valuesEqual(a: unknown, b: unknown): boolean {
    // Handle arrays
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false
      return a.every((val, idx) => val === b[idx])
    }
    // Handle primitives
    return a === b
  }

  /**
   * Apply resolved state changes to URL
   *
   * Builds a minimal query object containing only non-default values.
   * This ensures clean URLs without redundant parameters.
   *
   * @param resolved - Resolved state from resolveChange()
   * @param route - Current route (unused, kept for API compatibility)
   * @param router - Vue router instance
   */
  static async applyResolvedState(
    resolved: ResolvedState,
    _route: RouteLocationNormalizedLoaded,
    router: Router,
    options: { replaceHistory?: boolean } = {}
  ): Promise<void> {
    // Build query from scratch - only include non-default values
    const newQuery: Record<string, string | string[]> = {}

    // Handle view first (uses e=1, zs=1 instead of state encoder)
    const view = resolved.state.view as ViewType
    if (view === 'excess') {
      newQuery.e = '1'
    } else if (view === 'zscore') {
      newQuery.zs = '1'
    }
    // mortality view has no special parameter (it's the default)

    // For each state field, only add to URL if different from base default
    // Note: We use DEFAULT_VALUES (landing page defaults), not view-specific defaults
    // This ensures the URL contains all values needed to reconstruct the state
    for (const [field, encoder] of Object.entries(stateFieldEncoders)) {
      const urlKey = encoder.key
      const newValue = resolved.state[field]
      const defaultValue = DEFAULT_VALUES[field]

      // Skip if value matches base default
      if (this.valuesEqual(newValue, defaultValue)) {
        continue
      }

      // Skip undefined values
      if (newValue === undefined) {
        continue
      }

      // Encode the value
      const encodedValue = 'encode' in encoder && encoder.encode
        ? encoder.encode(newValue as boolean | undefined)
        : newValue

      if (encodedValue !== undefined) {
        if (Array.isArray(encodedValue)) {
          newQuery[urlKey] = encodedValue.map(String)
        } else {
          newQuery[urlKey] = String(encodedValue)
        }
      }
    }

    // Use router.replace() for initial state (no history entry) or router.push() for user actions
    if (options.replaceHistory) {
      await router.replace({ query: newQuery })
    } else {
      await router.push({ query: newQuery })
    }
  }
}
