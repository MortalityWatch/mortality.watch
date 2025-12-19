/**
 * Ranking State Constraints
 *
 * Defines all business rule constraints for ranking state resolution.
 * Constraints are applied in priority order (higher priority wins).
 *
 * Priority levels:
 * - 2: Hard constraints (cannot be overridden by user)
 * - 1: Normal business rules
 * - 0: Soft defaults (lowest priority, allow user override)
 */

import type { StateConstraint } from '../resolver/types'

// ============================================================================
// PRIORITY 2: HARD CONSTRAINTS
// ============================================================================

/**
 * Absolute Mode Constraints
 *
 * In absolute mode, percentage and prediction intervals are disabled
 * because there's no baseline to calculate excess from.
 */
const absoluteModeConstraint: StateConstraint = {
  when: state => state.view === 'absolute',
  apply: {
    showPercentage: false,
    showPI: false
  },
  reason: 'Percentage and prediction intervals require baseline (relative mode)',
  allowUserOverride: false,
  priority: 2
}

// ============================================================================
// PRIORITY 1: BUSINESS RULES
// ============================================================================

/**
 * Totals Only Constraint
 *
 * showTotalsOnly requires showTotals to be enabled.
 * If showTotals is false, showTotalsOnly must also be false.
 */
const totalsOnlyConstraint: StateConstraint = {
  when: state => state.showTotals === false,
  apply: {
    showTotalsOnly: false
  },
  reason: 'Show totals only requires show totals to be enabled',
  allowUserOverride: false,
  priority: 1
}

/**
 * Prediction Interval - Cumulative Constraint
 *
 * PI is per-period, but cumulative sums aggregate across periods,
 * making PI not meaningful.
 */
const piCumulativeConstraint: StateConstraint = {
  when: state => state.cumulative === true,
  apply: {
    showPI: false
  },
  reason: 'Prediction intervals are not available in cumulative mode',
  allowUserOverride: false,
  priority: 1
}

/**
 * Prediction Interval - Totals Only Constraint
 *
 * PI is per-period, but totals-only aggregates all periods,
 * making PI not meaningful.
 */
const piTotalsOnlyConstraint: StateConstraint = {
  when: state => state.showTotalsOnly === true,
  apply: {
    showPI: false
  },
  reason: 'Prediction intervals are not available in totals-only mode',
  allowUserOverride: false,
  priority: 1
}

// ============================================================================
// ALL CONSTRAINTS
// ============================================================================

/**
 * All ranking state constraints in order of priority
 */
export const RANKING_CONSTRAINTS: StateConstraint[] = [
  // Priority 2: Hard constraints
  absoluteModeConstraint,

  // Priority 1: Business rules
  totalsOnlyConstraint,
  piCumulativeConstraint,
  piTotalsOnlyConstraint
]

/**
 * Get constraints that apply to a specific view
 */
export function getViewConstraints(view: string): StateConstraint[] {
  if (view === 'absolute') {
    return [absoluteModeConstraint]
  }
  return []
}
