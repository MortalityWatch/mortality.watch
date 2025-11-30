/**
 * Standalone Constraint Application
 *
 * Framework-agnostic constraint application logic that can be used
 * by both client-side StateResolver and server-side SSR rendering.
 *
 * This ensures SSR chart.png renders identically to the explorer UI
 * by applying the same business rule constraints.
 */

import type { StateConstraint } from './types'
import type { ViewType } from './viewTypes'
import { VIEWS } from '../config/views'
import { STATE_CONSTRAINTS } from '../config/constraints'

/**
 * Get constraints for a specific view
 * Returns the view-specific constraints defined in the view configuration
 */
function getViewConstraintsForApply(view: ViewType): StateConstraint[] {
  const config = VIEWS[view]
  return [...config.constraints]
}

/**
 * Apply all constraints to state in priority order
 *
 * This is a standalone, framework-agnostic version of the constraint
 * application logic from StateResolver. It can be used by:
 * - Server-side rendering (chart.png SSR)
 * - Client-side state resolution (StateResolver)
 * - Any other context that needs consistent state resolution
 *
 * Constraints are sorted by priority (high to low) and applied in order.
 * URL-provided values are NOT treated as user overrides in SSR context
 * because we want constraints to enforce view requirements.
 *
 * @param state - The state object to apply constraints to
 * @param view - The detected view type (mortality, excess, zscore)
 * @returns New state object with constraints applied
 */
export function applyConstraints(
  state: Record<string, unknown>,
  view: ViewType
): Record<string, unknown> {
  const newState = { ...state }

  // Get view-specific constraints
  const viewConstraints = getViewConstraintsForApply(view)

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
    // In SSR context, we always apply constraints (no user override concept)
    // This ensures excess view always has showBaseline=true, etc.
    for (const [field, value] of Object.entries(constraint.apply)) {
      newState[field] = value
    }
  }

  return newState
}
