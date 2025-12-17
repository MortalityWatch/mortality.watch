/**
 * Chart State Utilities
 *
 * Utilities for encoding/decoding chart state to/from query parameters.
 * Used for server-side chart rendering and OG image generation.
 */

import { Defaults, stateFieldEncoders, detectView, getViewDefaults, applyConstraints, isChartTypeCompatible } from './state'
import type { ViewType } from './state'

export interface ChartState {
  countries: string[]
  type: string
  // View indicators - encoded as e=1 and zs=1 in URL
  isExcess?: boolean
  isZScore?: boolean
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
  showLogarithmic: boolean
  sliderStart?: string
  userColors?: string[]
  decimals?: string
  darkMode?: boolean
}

/**
 * Decode query parameters to chart state
 *
 * This function is view-aware: it detects the view from query params
 * (e=1 for excess, zs=1 for zscore) and applies view-specific defaults
 * AND constraints. This ensures SSR chart rendering matches the explorer UI.
 *
 * The resolution flow mirrors StateResolver.resolveInitial():
 * 1. Detect view from URL params (e=1, zs=1)
 * 2. Get view-specific defaults
 * 3. Merge with URL-provided values
 * 4. Apply constraints (enforces view requirements like excess needing baseline)
 */
export function decodeChartState(query: Record<string, string | string[]>): ChartState {
  const state: Record<string, unknown> = {}

  for (const [field, config] of Object.entries(stateFieldEncoders)) {
    const key = config.key
    const value = query[key]

    if (value !== undefined) {
      if ('decode' in config && config.decode) {
        // For fields with decode function (countries, ageGroups, userColors):
        // - If value is already an array, return it as-is
        // - If value is a string, decode splits it by comma
        if (Array.isArray(value)) {
          state[field] = value
        } else {
          state[field] = config.decode(value)
        }
      } else {
        const stringValue = Array.isArray(value) ? value[0] : value
        if (Array.isArray(Defaults[field as keyof typeof Defaults])) {
          // Array field
          state[field] = Array.isArray(value) ? value : [stringValue]
        } else {
          // String field
          state[field] = stringValue
        }
      }
    }
  }

  // 1. Detect view from query params (e=1 for excess, zs=1 for zscore)
  let view = detectView(query as Record<string, unknown>) as ViewType

  // 1.5. Validate view compatibility with chart type
  // If z-score view was requested but chart type is not compatible, fall back to mortality view
  // This mirrors the logic in StateResolver.resolveInitial()
  const chartType = (state.chartType as string | undefined) ?? Defaults.chartType
  if (view === 'zscore' && !isChartTypeCompatible(chartType as string, view)) {
    console.warn(`Z-score view not compatible with chart type ${chartType}, falling back to mortality view (SSR)`)
    view = 'mortality'
  }

  // 2. Get view-specific defaults
  const viewDefaults = getViewDefaults(view)

  // 3. Merge defaults with URL-provided values
  const mergedState = {
    ...viewDefaults,
    ...state,
    view // Ensure view is set for constraint evaluation
  }

  // 4. Apply constraints to enforce view requirements
  // This ensures excess view always has showBaseline=true, etc.
  // Without this, URL params like ?e=1&bl=0 would render differently
  // in SSR vs explorer (where StateResolver enforces constraints)
  const constrainedState = applyConstraints(mergedState, view)

  return constrainedState as unknown as ChartState
}

/**
 * Encode chart state to query parameters
 * @param state - Chart state to encode
 * @param includeDefaults - If true, include values even if they match defaults (useful for OG images)
 */
export function encodeChartState(state: Partial<ChartState>, includeDefaults: boolean = false): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {}

  for (const [field, config] of Object.entries(stateFieldEncoders)) {
    const value = state[field as keyof ChartState]
    const defaultValue = Defaults[field as keyof typeof Defaults]

    // Skip if value is undefined
    if (value === undefined) continue

    // Skip values that match defaults (unless includeDefaults is true)
    if (!includeDefaults) {
      // Deep equality check for arrays
      if (Array.isArray(value) && Array.isArray(defaultValue)) {
        if (value.length === defaultValue.length && value.every((v, i) => v === defaultValue[i])) {
          continue
        }
      } else if (value === defaultValue) {
        continue
      }
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
 * @param state - Chart state to encode
 * @param includeDefaults - If true, include values even if they match defaults (useful for OG images)
 */
export function chartStateToQueryString(state: Partial<ChartState>, includeDefaults: boolean = false): string {
  const query = encodeChartState(state, includeDefaults)
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
