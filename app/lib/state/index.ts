/**
 * State Management System
 *
 * URL-first state management with constraint-based resolution.
 *
 * This module is organized into two parts:
 *
 * - `resolver/` - Framework-agnostic library code (StateResolver, types, utilities)
 * - `config/` - App-specific configuration (views, constraints, field encoders)
 *
 * Usage:
 * ```ts
 * // Import from specific submodules
 * import { StateResolver } from '@/lib/state/resolver'
 * import { VIEWS, stateFieldEncoders } from '@/lib/state/config'
 *
 * // Or import everything from the main module
 * import { StateResolver, VIEWS } from '@/lib/state'
 * ```
 */

// Re-export everything from resolver
export * from './resolver'

// Re-export everything from config
export * from './config'
