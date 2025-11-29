/**
 * View Constraints Generator
 *
 * Generates StateConstraints from view configurations.
 * View constraints are injected as hard constraints (priority 2) into StateResolver.
 */

import type { StateConstraint } from './types'
import type { ViewType } from './viewTypes'
import { VIEWS } from '../config/views'

/**
 * Get constraints for a specific view
 * Returns the view-specific constraints defined in the view configuration
 */
export function getViewConstraints(view: ViewType): StateConstraint[] {
  const config = VIEWS[view]

  // Return view-specific constraints from config
  // These are already properly defined with correct state field names
  return [...config.constraints]
}
