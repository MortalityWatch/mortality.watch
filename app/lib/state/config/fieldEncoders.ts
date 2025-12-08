/**
 * Field Encoders Configuration
 *
 * App-specific field definitions for URL state serialization.
 * Maps field names to URL keys and optional encode/decode functions.
 */

import { encodeBool, decodeBool, decodeArray } from '../resolver/encoders'
import { VIEWS } from './views'

// Re-export encoders for backward compatibility
export { encodeBool, decodeBool, encodeString, decodeString } from '../resolver/encoders'

/**
 * Landing page defaults - alias for VIEWS.mortality.defaults
 * Single source of truth is in views.ts
 */
export const Defaults = VIEWS.mortality.defaults

export type ChartStateInput = typeof Defaults

/**
 * Field encoder definitions
 *
 * Maps state field names to:
 * - key: Short URL parameter name
 * - encode: Optional function to encode value for URL
 * - decode: Optional function to decode value from URL
 */
export const stateFieldEncoders = {
  countries: { key: 'c', decode: decodeArray },
  type: { key: 't' },
  chartType: { key: 'ct' },
  // Note: 'e' param now handled by view system (see viewDetector.ts)
  chartStyle: { key: 'cs' },
  dateFrom: { key: 'df' },
  dateTo: { key: 'dt' },
  sliderStart: { key: 'ss' },
  baselineDateFrom: { key: 'bf' },
  baselineDateTo: { key: 'bt' },
  standardPopulation: { key: 'sp' },
  ageGroups: { key: 'ag', decode: decodeArray },
  showBaseline: { key: 'sb', encode: encodeBool, decode: decodeBool },
  baselineMethod: { key: 'bm' },
  cumulative: { key: 'ce', encode: encodeBool, decode: decodeBool },
  showTotal: { key: 'st', encode: encodeBool, decode: decodeBool },
  maximize: { key: 'm', encode: encodeBool, decode: decodeBool },
  showPredictionInterval: { key: 'pi', encode: encodeBool, decode: decodeBool },
  showLabels: { key: 'sl', encode: encodeBool, decode: decodeBool },
  showPercentage: { key: 'p', encode: encodeBool, decode: decodeBool },
  showLogarithmic: { key: 'lg', encode: encodeBool, decode: decodeBool },
  userColors: { key: 'uc', decode: decodeArray },
  decimals: { key: 'dec' },
  showLogo: { key: 'l', encode: encodeBool, decode: decodeBool },
  showQrCode: { key: 'qr', encode: encodeBool, decode: decodeBool },
  showCaption: { key: 'cap', encode: encodeBool, decode: decodeBool },
  showTitle: { key: 'ti', encode: encodeBool, decode: decodeBool },
  darkMode: { key: 'dm', encode: encodeBool, decode: decodeBool }
}
