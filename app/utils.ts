/**
 * Legacy utils.ts file - Re-exports from modular structure
 *
 * All utilities have been reorganized into domain-specific modules in lib/utils/
 * This file maintains backward compatibility by re-exporting everything.
 *
 * For new code, prefer importing from specific modules:
 * - import { round } from '~/lib/utils/formatting'
 * - import { last } from '~/lib/utils/array'
 * - import { isBrowser } from '~/lib/utils/dom'
 */

// Re-export everything from the new modular structure
// Keep the prototype extension for now but mark as deprecated
// This will be removed in a future version
import { last } from './lib/utils/array'

export * from './lib/utils'

// For backward compatibility with code using .last()
// Note: Array prototype extension removed to avoid pollution
// Use the `last()` function instead: last(myArray)
declare global {
  interface Array<T> {
    last(): T | undefined
  }
}
Array.prototype.last = function () {
  return last(this)
}
