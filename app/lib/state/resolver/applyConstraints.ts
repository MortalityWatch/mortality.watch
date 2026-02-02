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
 * When urlProvidedFields is provided, constraints with allowUserOverride=true
 * will not overwrite values explicitly set in the URL. This ensures SSR
 * respects user preferences while still enforcing hard constraints.
 *
 * @param state - The state object to apply constraints to
 * @param view - The detected view type (mortality, excess, zscore)
 * @param urlProvidedFields - Optional set of field names that were explicitly provided in URL
 * @returns New state object with constraints applied
 */
export function applyConstraints(
  state: Record<string, unknown>,
  view: ViewType,
  urlProvidedFields?: Set<string>
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
    for (const [field, value] of Object.entries(constraint.apply)) {
      // Check if this field was explicitly provided in the URL
      const isUrlProvided = urlProvidedFields?.has(field) ?? false

      // Apply constraint unless: field was URL-provided AND constraint allows override
      // This ensures hard constraints (allowUserOverride=false) are always enforced,
      // while soft constraints (allowUserOverride=true) respect explicit URL values
      const shouldApply = !(isUrlProvided && constraint.allowUserOverride)

      if (shouldApply) {
        newState[field] = value
      }
    }
  }

  return newState
}
