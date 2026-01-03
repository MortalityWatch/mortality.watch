/**
 * Shared UI Condition Evaluation Utility
 *
 * Evaluates UI conditions against state for visibility and disabled rules.
 * Used by both explorer and ranking state resolvers.
 *
 * Supports:
 * - Simple field comparisons: { field: 'chartStyle', is: 'line' }
 * - Negation: { field: 'chartStyle', isNot: 'bar' }
 * - Boolean AND: { and: [condition1, condition2, ...] }
 * - Boolean OR: { or: [condition1, condition2, ...] }
 */

/**
 * Base condition interface - matches both UICondition and RankingUICondition
 * Uses a generic approach to support different state field types
 */
export interface BaseCondition {
  field?: string
  is?: unknown
  isNot?: unknown
  and?: BaseCondition[]
  or?: BaseCondition[]
}

/**
 * Evaluate a UI condition against current state
 *
 * @param condition - The condition to evaluate
 * @param state - Current state values as a record
 * @returns true if condition is satisfied, false otherwise
 *
 * @example
 * ```typescript
 * // Simple field comparison
 * evaluateCondition({ field: 'chartStyle', is: 'line' }, { chartStyle: 'line' }) // true
 *
 * // Negation
 * evaluateCondition({ field: 'chartStyle', isNot: 'bar' }, { chartStyle: 'line' }) // true
 *
 * // AND condition
 * evaluateCondition({
 *   and: [
 *     { field: 'showBaseline', is: true },
 *     { field: 'cumulative', is: false }
 *   ]
 * }, state)
 *
 * // OR condition
 * evaluateCondition({
 *   or: [
 *     { field: 'chartStyle', is: 'line' },
 *     { field: 'chartStyle', is: 'bar' }
 *   ]
 * }, state)
 * ```
 */
export function evaluateCondition(
  condition: BaseCondition,
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
  if ('field' in condition && condition.field) {
    const value = state[condition.field]

    // Check equality
    if ('is' in condition) {
      return value === condition.is
    }

    // Check inequality
    if ('isNot' in condition) {
      return value !== condition.isNot
    }
  }

  return false
}
