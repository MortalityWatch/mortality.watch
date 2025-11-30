/**
 * View Helper Functions
 *
 * Utility functions for working with view configurations and UI elements
 */

import type {
  ViewType,
  UIElement,
  UICondition,
  ExplorerStateValues,
  MetricType,
  ChartStyle
} from './viewTypes'
import { VIEWS } from '../config/views'

/**
 * Check if a UI element is visible given current state
 */
export function isVisible(
  element: UIElement,
  state: ExplorerStateValues
): boolean {
  const rule = element.visibility

  switch (rule.type) {
    case 'hidden':
      return false

    case 'visible':
      return true

    case 'conditional':
      return evaluateCondition(rule.when, state)
  }
}

/**
 * Check if a UI element has a required (forced) value
 */
export function isRequired(element: UIElement): boolean {
  return (
    element.visibility.type === 'visible'
    && !element.visibility.toggleable
  )
}

/**
 * Get the default/required value for a UI element
 */
export function getDefaultValue(element: UIElement): unknown {
  if (element.visibility.type === 'visible' && !element.visibility.toggleable) {
    return element.visibility.value
  }
  return undefined
}

/**
 * Check if a UI element is disabled given current state
 */
export function isDisabled(
  element: UIElement,
  state: ExplorerStateValues
): boolean {
  if (!element.disabled) return false

  if (element.disabled.disabled === false) return false
  if (element.disabled.disabled === true) return true

  return evaluateCondition(element.disabled.when, state)
}

/**
 * Get the reason why an element is disabled
 */
export function getDisabledReason(element: UIElement): string | null {
  if (element.disabled && element.disabled.disabled === true) {
    return element.disabled.reason
  }
  return null
}

/**
 * Evaluate a UI condition against current state
 */
export function evaluateCondition(
  condition: UICondition,
  state: ExplorerStateValues
): boolean {
  if ('field' in condition) {
    const value = state[condition.field]
    if ('is' in condition) return value === condition.is
    if ('isNot' in condition) return value !== condition.isNot
  }

  if ('and' in condition) {
    return condition.and.every(c => evaluateCondition(c, state))
  }

  if ('or' in condition) {
    return condition.or.some(c => evaluateCondition(c, state))
  }

  return false
}

/**
 * Get the current view configuration
 */
export function getCurrentViewConfig(view: ViewType) {
  return VIEWS[view]
}

/**
 * Get merged defaults for a view
 *
 * Returns mortality defaults merged with view-specific defaults.
 * This is the same logic used by StateResolver for initial state resolution.
 *
 * @param view - The view type to get defaults for
 * @returns Complete defaults object with view-specific overrides applied
 *
 * @example
 * ```typescript
 * // Get defaults for excess view
 * const defaults = getViewDefaults('excess')
 * // Returns: { ...mortalityDefaults, chartStyle: 'bar', showPercentage: true, ... }
 * ```
 */
export function getViewDefaults(view: ViewType): Record<string, unknown> {
  const mortalityDefaults = VIEWS.mortality.defaults
  const viewConfig = VIEWS[view]

  // Merge: mortality defaults + view-specific defaults
  return {
    ...mortalityDefaults,
    ...(viewConfig.defaults || {})
  }
}

/**
 * Check if a metric is compatible with a view
 */
export function isMetricCompatible(
  metric: MetricType | string,
  view: ViewType
): boolean {
  const viewConfig = VIEWS[view]
  if (!viewConfig.compatibleMetrics) return true
  return viewConfig.compatibleMetrics.includes(metric as MetricType)
}

/**
 * Check if a chart style is compatible with a view
 */
export function isChartStyleCompatible(
  chartStyle: ChartStyle | string,
  view: ViewType
): boolean {
  const viewConfig = VIEWS[view]
  if (!viewConfig.compatibleChartStyles) return true
  return viewConfig.compatibleChartStyles.includes(chartStyle as ChartStyle)
}

/**
 * Infer if excess mode is active from state flags
 *
 * Since isExcess is now a computed property derived from view,
 * this helper provides a consistent way to determine excess mode
 * from state flags in contexts where view is not available
 * (e.g., server-side rendering, data services).
 *
 * Logic: Excess mode is active if cumulative OR showPercentage is enabled.
 * These flags are only available in excess view, so their presence
 * indicates excess mode.
 *
 * @param state - Object with cumulative and showPercentage flags
 * @returns true if excess mode should be active, false otherwise
 *
 * @example
 * ```typescript
 * // Server-side: infer excess from ChartState
 * const isExcess = inferIsExcessFromFlags({
 *   cumulative: state.cumulative,
 *   showPercentage: state.showPercentage
 * })
 *
 * // Client-side: prefer using view directly
 * const isExcess = state.view.value === 'excess'
 * ```
 */
export function inferIsExcessFromFlags(state: {
  cumulative?: boolean
  showPercentage?: boolean
}): boolean {
  return Boolean(state.cumulative || state.showPercentage)
}
