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

// Global constraints
export { STATE_CONSTRAINTS } from './constraints'

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
