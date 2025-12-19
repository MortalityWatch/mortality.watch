/**
 * Ranking State Management
 *
 * URL-first state management for the ranking page with constraint-based resolution.
 *
 * Usage:
 * ```ts
 * import { RankingStateResolver, RANKING_VIEWS } from '@/lib/state/ranking'
 *
 * // Resolve initial state from URL
 * const resolved = RankingStateResolver.resolveInitial(route)
 *
 * // Resolve a state change
 * const newResolved = RankingStateResolver.resolveChange(
 *   { field: 'view', value: 'absolute' },
 *   resolved.state,
 *   resolved.userOverrides
 * )
 *
 * // Apply to URL
 * await RankingStateResolver.applyResolvedState(newResolved, route, router)
 * ```
 */

// Types
export * from './types'

// Views configuration
export * from './views'

// Constraints
export * from './constraints'

// Field encoders
export * from './fieldEncoders'

// State resolver - individual functions (preferred)
export {
  detectView,
  resolveInitial,
  resolveChange,
  applyResolvedState
} from './RankingStateResolver'

// State resolver - namespace object (backwards compatibility)
export { RankingStateResolver } from './RankingStateResolver'
