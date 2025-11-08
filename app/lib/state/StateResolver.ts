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

    // 2.5. Detect and add view to state (derived from URL params)
    const view = detectView(route.query)
    state.view = view

    // 3. Apply constraints (including view-specific constraints)
    const constrainedState = this.applyConstraints(state, userOverrides, log)

    log.after = { ...constrainedState }

    // 4. Log resolution
    this.logResolution(log, 'INITIAL')

    return {
      state: constrainedState,
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

    // 3. Log resolution
    this.logResolution(log, 'CHANGE')

    return {
      state: constrainedState,
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
    type: 'INITIAL' | 'CHANGE'
  ): void {
    // Skip logging in production
    if (typeof window !== 'undefined' && '__PROD__' in window && window.__PROD__) return

    const emoji = type === 'INITIAL' ? '🚀' : '🔄'
    const trigger = log.trigger !== 'initial' ? log.trigger : null
    const title = type === 'INITIAL'
      ? 'Initial State Resolution'
      : trigger
        ? `State Resolution: ${trigger.field} = ${JSON.stringify(trigger.value)}`
        : 'State Resolution'

    console.group(`${emoji} ${title}`)

    if (type === 'CHANGE') {
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
   * Apply resolved state changes to URL
   *
   * Builds a complete query object with all changes and pushes to router.
   * This ensures atomic URL updates without race conditions.
   *
   * @param resolved - Resolved state from resolveChange()
   * @param route - Current route
   * @param router - Vue router instance
   */
  static async applyResolvedState(
    resolved: ResolvedState,
    route: RouteLocationNormalizedLoaded,
    router: Router,
    options: { replaceHistory?: boolean } = {}
  ): Promise<void> {
    // Build complete query object with ALL changes at once
    const newQuery: Record<string, string | string[]> = {}

    // Copy existing query with proper types
    for (const [key, value] of Object.entries(route.query)) {
      if (Array.isArray(value)) {
        newQuery[key] = value.filter((v): v is string => v !== null)
      } else if (value !== null && value !== undefined) {
        newQuery[key] = value
      }
    }

    for (const field of resolved.changedFields) {
      const encoder = stateFieldEncoders[field as keyof typeof stateFieldEncoders]
      if (!encoder) continue

      const urlKey = encoder.key
      const newValue = resolved.state[field]

      // Encode the value
      const encodedValue = 'encode' in encoder && encoder.encode ? encoder.encode(newValue as boolean | undefined) : newValue

      if (encodedValue === undefined) {
        // Remove from URL if undefined
        Reflect.deleteProperty(newQuery, urlKey)
      } else if (Array.isArray(encodedValue)) {
        newQuery[urlKey] = encodedValue.map(String)
      } else {
        newQuery[urlKey] = String(encodedValue)
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
