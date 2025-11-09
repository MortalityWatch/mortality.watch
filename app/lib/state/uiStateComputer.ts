/**
 * UI State Computer
 *
 * Computes UI metadata (visibility, disabled state) from ViewConfig and current state.
 * This eliminates the need for components to manually compute visibility with isVisible().
 */

import type { ViewConfig, UIElement, UICondition } from './viewTypes'

export interface UIFieldState {
  visible: boolean
  disabled: boolean
}

/**
 * Evaluate a UI condition against current state
 */
function evaluateCondition(
  condition: UICondition,
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
 * Determine if a UI element is visible based on its configuration
 */
function isVisible(element: UIElement, state: Record<string, unknown>): boolean {
  const { visibility } = element

  switch (visibility.type) {
    case 'hidden':
      return false

    case 'visible':
      return true

    case 'conditional':
      if (!visibility.when) return true
      return evaluateCondition(visibility.when, state)

    default:
      return true
  }
}

/**
 * Determine if a UI element is disabled (read-only)
 */
function isDisabled(element: UIElement, state: Record<string, unknown>): boolean {
  const { visibility } = element

  // If not visible, it's effectively disabled
  if (!isVisible(element, state)) {
    return true
  }

  // If visibility type is 'visible' and not toggleable, it's disabled
  if (visibility.type === 'visible' && visibility.toggleable === false) {
    return true
  }

  return false
}

/**
 * Compute UI state for all fields from ViewConfig and current state
 *
 * Returns a record mapping field names to their UI state (visible, disabled)
 */
export function computeUIState(
  viewConfig: ViewConfig,
  state: Record<string, unknown>
): Record<string, UIFieldState> {
  const ui: Record<string, UIFieldState> = {}

  for (const [field, element] of Object.entries(viewConfig.ui)) {
    ui[field] = {
      visible: isVisible(element, state),
      disabled: isDisabled(element, state)
    }
  }

  return ui
}
