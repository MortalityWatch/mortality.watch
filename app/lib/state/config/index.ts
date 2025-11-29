/**
 * State Configuration
 *
 * App-specific configuration for the state resolution system:
 * - View definitions (mortality, excess, zscore)
 * - Global constraints
 * - Field encoders for URL serialization
 */

// View configurations
export { VIEWS } from './views'

// Global constraints and field update strategy
export {
  STATE_CONSTRAINTS,
  FIELD_UPDATE_STRATEGY,
  type FieldUpdateType,
  getFieldUpdateType,
  requiresDataDownload,
  requiresDatasetUpdate,
  requiresFilterUpdate
} from './constraints'

// Field encoders and defaults
export {
  stateFieldEncoders,
  Defaults,
  type ChartStateInput,
  // Re-exported from core for convenience
  encodeBool,
  decodeBool,
  encodeString,
  decodeString
} from './fieldEncoders'
