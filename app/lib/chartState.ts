/**
 * Chart State Utilities
 *
 * Utilities for encoding/decoding chart state to/from query parameters.
 * Used for server-side chart rendering and OG image generation.
 */

import { Defaults, stateFieldEncoders } from './state/stateSerializer'

export interface ChartState {
  countries: string[]
  type: string
  // NOTE: isExcess removed - now handled by view system (see viewDetector.ts)
  // View is derived from URL params (e=1, zs=1, etc.) not stored in state
  chartType: string
  chartStyle: string
  dateFrom?: string
  dateTo?: string
  baselineDateFrom?: string
  baselineDateTo?: string
  standardPopulation: string
  ageGroups: string[]
  showBaseline: boolean
  baselineMethod: string
  cumulative: boolean
  showTotal: boolean
  maximize: boolean
  showPredictionInterval: boolean
  showLabels: boolean
  showPercentage?: boolean
  isLogarithmic: boolean
  sliderStart?: string
  userColors?: string[]
  decimals?: string
  darkMode?: boolean
}

/**
 * Decode query parameters to chart state
 */
export function decodeChartState(query: Record<string, string | string[]>): ChartState {
  const state: Record<string, unknown> = {}

  for (const [field, config] of Object.entries(stateFieldEncoders)) {
    const key = config.key
    const value = query[key]

    if (value !== undefined) {
      const stringValue = Array.isArray(value) ? value[0] : value

      if ('decode' in config && config.decode) {
        // Use custom decoder (e.g., for booleans)
        state[field] = config.decode(stringValue)
      } else if (Array.isArray(Defaults[field as keyof typeof Defaults])) {
        // Array field
        state[field] = Array.isArray(value) ? value : [stringValue]
      } else {
        // String field
        state[field] = stringValue
      }
    }
  }

  // Fill in defaults for missing values
  return {
    ...Defaults,
    ...state
  } as ChartState
}

/**
 * Encode chart state to query parameters
 */
export function encodeChartState(state: Partial<ChartState>): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {}

  for (const [field, config] of Object.entries(stateFieldEncoders)) {
    const value = state[field as keyof ChartState]
    const defaultValue = Defaults[field as keyof typeof Defaults]

    // Skip if value is undefined or matches default
    if (value === undefined) continue

    // Deep equality check for arrays
    if (Array.isArray(value) && Array.isArray(defaultValue)) {
      if (value.length === defaultValue.length && value.every((v, i) => v === defaultValue[i])) {
        continue
      }
    } else if (value === defaultValue) {
      continue
    }

    const key = config.key

    if ('encode' in config && config.encode && typeof config.encode === 'function') {
      // Use custom encoder (e.g., for booleans)
      const encoded = (config.encode as (val: unknown) => unknown)(value)
      if (encoded !== undefined) {
        query[key] = String(encoded)
      }
    } else if (Array.isArray(value)) {
      // Array field
      query[key] = value
    } else {
      // String/number field
      query[key] = String(value)
    }
  }

  return query
}

/**
 * Convert chart state to URL query string
 */
export function chartStateToQueryString(state: Partial<ChartState>): string {
  const query = encodeChartState(state)
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v))
    } else {
      params.set(key, value)
    }
  }

  return params.toString()
}

/**
 * Parse URL query string to chart state
 */
export function queryStringToChartState(queryString: string): ChartState {
  const params = new URLSearchParams(queryString)
  const query: Record<string, string | string[]> = {}

  for (const [key, value] of params.entries()) {
    if (query[key]) {
      // Multiple values for same key
      if (Array.isArray(query[key])) {
        (query[key] as string[]).push(value)
      } else {
        query[key] = [query[key] as string, value]
      }
    } else {
      query[key] = value
    }
  }

  return decodeChartState(query)
}
