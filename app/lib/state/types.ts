/**
 * State Resolver Type Definitions
 *
 * Defines types for centralized state resolution system that handles:
 * - URL state synchronization
 * - Constraint-based state resolution
 * - Priority-based conflict resolution
 * - Audit logging
 */

/**
 * A change to a single state field
 */
export interface StateChange {
  field: string // Full field name (e.g., 'isExcess')
  value: unknown // New value
  source: 'user' | 'url' | 'default' // Where the change originated
}

/**
 * Metadata about a resolved state field
 */
export interface StateFieldMetadata {
  value: unknown // The resolved value
  priority: 'default' | 'constraint' | 'user' // How it was determined
  reason: string // Human-readable explanation
  changed: boolean // Whether this field changed from before state
  urlKey?: string // Short key for URL (e.g., 'e' for isExcess)
}

/**
 * Complete resolved state with metadata and audit log
 */
export interface ResolvedState {
  // The actual state values (full field names)
  state: Record<string, unknown>

  // UI state for each field (visibility, disabled state)
  ui: Record<string, { visible: boolean, disabled: boolean }>

  // Metadata for each field
  metadata: Record<string, StateFieldMetadata>

  // Which fields changed in this resolution
  changedFields: string[]

  // Which fields were set by user (in URL)
  userOverrides: Set<string>

  // Full audit log
  log: StateResolutionLog
}

/**
 * Detailed log of a state resolution
 */
export interface StateResolutionLog {
  timestamp: string
  trigger: StateChange | 'initial' // What triggered this resolution
  before: Record<string, unknown> // State before resolution
  after: Record<string, unknown> // State after resolution
  changes: Array<{
    field: string // Field name
    urlKey: string // Short URL key
    oldValue: unknown // Previous value
    newValue: unknown // New value
    priority: string // Priority level (e.g., 'constraint (p2)')
    reason: string // Why this change was made
  }>
  userOverridesFromUrl: string[] // Fields that were in URL
}

/**
 * A constraint rule that applies conditional state changes
 */
export interface StateConstraint {
  /**
   * Condition function - when this returns true, the constraint applies
   */
  when: (state: Record<string, unknown>) => boolean

  /**
   * Field values to apply when constraint is active
   * Maps field name → value
   */
  apply: Record<string, unknown>

  /**
   * Human-readable reason for logging
   */
  reason: string

  /**
   * Can user override this constraint?
   * - false: Hard constraint, cannot be overridden (e.g., excess requires baseline)
   * - true: Soft constraint, user can override (e.g., excess defaults PI to off)
   */
  allowUserOverride: boolean

  /**
   * Priority for conflict resolution (higher wins)
   * - 0: Low priority (defaults)
   * - 1: Normal priority (default, business rules)
   * - 2: High priority (hard constraints)
   */
  priority?: number
}
