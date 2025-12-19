/**
 * Ranking Field Encoders Configuration
 *
 * Maps ranking state field names to URL query parameters.
 * Follows the same pattern as explorer's fieldEncoders.ts
 */

import { encodeBool, decodeBool } from '../resolver/encoders'
import type { MetricType } from './types'

// Valid metric types for validation
const VALID_METRIC_TYPES = ['cmr', 'asmr', 'le'] as const

/**
 * Decode metric type with backwards compatibility for legacy 'a' param
 *
 * @param mValue - The 'm' query param value
 * @param aValue - The legacy 'a' query param value (for backwards compat)
 */
export function decodeMetricType(mValue?: string, aValue?: string): MetricType {
  // First check new 'm' param
  if (mValue && VALID_METRIC_TYPES.includes(mValue as MetricType)) {
    return mValue as MetricType
  }
  // Fall back to legacy 'a' param for backwards compatibility
  if (aValue !== undefined) {
    return decodeBool(aValue) ? 'asmr' : 'cmr'
  }
  // Default to ASMR for standardized comparison
  return 'asmr'
}

/**
 * Field encoder definitions for ranking state
 *
 * Maps state field names to:
 * - key: Short URL parameter name
 * - encode: Optional function to encode value for URL
 * - decode: Optional function to decode value from URL
 */
export const rankingFieldEncoders = {
  // View (e=0 for absolute, absent or any other value for relative)
  // Using 'e' key for consistency with explorer's excess mode
  view: {
    key: 'e',
    encode: (v: string) => v === 'relative' ? undefined : '0',
    decode: (v: string) => v === '0' ? 'absolute' : 'relative'
  },

  // Period configuration
  periodOfTime: { key: 'p' },
  jurisdictionType: { key: 'j' },

  // Metric type (new 'm' param, replaces legacy 'a')
  metricType: {
    key: 'm',
    // No encode - just use the value as-is
    decode: (v: string) => {
      if (VALID_METRIC_TYPES.includes(v as MetricType)) {
        return v as MetricType
      }
      return 'asmr' // default
    }
  },

  // Metric configuration
  standardPopulation: { key: 'sp' },

  // Display toggles
  showTotals: { key: 't', encode: encodeBool, decode: decodeBool },
  showTotalsOnly: { key: 'to', encode: encodeBool, decode: decodeBool },
  showPercentage: { key: 'r', encode: encodeBool, decode: decodeBool },
  showPI: { key: 'pi', encode: encodeBool, decode: decodeBool },
  cumulative: { key: 'c', encode: encodeBool, decode: decodeBool },

  // Hide incomplete is inverted in URL (i=1 means show incomplete, i=0 or absent means hide)
  hideIncomplete: {
    key: 'i',
    encode: (v: boolean) => encodeBool(!v),
    decode: (v: string) => !decodeBool(v)
  },

  // Decimal precision
  decimalPrecision: { key: 'dp' },

  // Baseline configuration
  baselineMethod: { key: 'bm' },
  baselineDateFrom: { key: 'bf' },
  baselineDateTo: { key: 'bt' },

  // Date range
  dateFrom: { key: 'df' },
  dateTo: { key: 'dt' }
} as const

/**
 * Type for the field encoder keys
 */
export type RankingFieldKey = keyof typeof rankingFieldEncoders

/**
 * Get URL key for a field
 */
export function getUrlKey(field: RankingFieldKey): string {
  return rankingFieldEncoders[field].key
}

/**
 * Legacy 'a' param key for backwards compatibility
 * Used when decoding old URLs that used a=0/a=1 for CMR/ASMR
 */
export const LEGACY_ASMR_KEY = 'a'

/**
 * Ranking-specific defaults
 * These are the defaults when no URL params are present
 */
export const RANKING_DEFAULTS = {
  view: 'relative' as const,
  periodOfTime: 'fluseason' as const,
  jurisdictionType: 'countries' as const,
  metricType: 'asmr' as const,
  standardPopulation: 'who' as const,
  showTotals: true,
  showTotalsOnly: false,
  showPercentage: true,
  showPI: false,
  cumulative: false,
  hideIncomplete: true, // Hide incomplete data by default
  decimalPrecision: '1' as const,
  baselineMethod: 'mean' as const,
  baselineDateFrom: undefined as string | undefined,
  baselineDateTo: undefined as string | undefined,
  dateFrom: undefined as string | undefined,
  dateTo: undefined as string | undefined
}
