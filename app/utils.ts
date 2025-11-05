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
export * from './lib/utils'
