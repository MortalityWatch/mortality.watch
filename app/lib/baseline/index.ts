/**
 * Baseline calculation module
 *
 * Exports shared baseline calculation logic used by both client and server.
 */

export {
  cumulativeSumFrom,
  calculateExcess,
  getSeasonType,
  labelToXsParam
} from './core'

export {
  calculateBaseline,
  calculateBaselines,
  type BaselineFetchFn,
  type QueueEnqueueFn,
  type BaselineDependencies
} from './calculateBaseline'

// Re-export calculateBaselineRange for convenience
export { calculateBaselineRange } from './calculateBaselineRange'
