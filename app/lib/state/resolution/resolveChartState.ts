/**
 * Unified Chart State Resolution
 *
 * Single source of truth for resolving chart state from URL parameters.
 * Used by both SSR (chart.png) and explorer (client-side).
 *
 * This combines:
 * - View detection and defaults (from StateResolver)
 * - Constraint application (from StateResolver)
 * - Effective date/baseline range computation (from useDateRangeCalculations)
 * - Snapshot creation (from StateResolver)
 */

import { detectView, getViewDefaults, applyConstraints } from '../resolver'
import type { ViewType } from '../resolver/viewTypes'
import { stateFieldEncoders, Defaults } from '../config'
import { computeEffectiveDateRange } from './effectiveDefaults'
import { calculateBaselineRange } from '@/lib/baseline/calculateBaselineRange'

/**
 * Complete resolved state ready for chart rendering
 */
export interface ChartRenderState {
  // Core identifiers
  countries: string[]
  type: string
  chartType: string
  chartStyle: string

  // View
  view: ViewType
  isExcess: boolean
  isZScore: boolean

  // Date range (effective - never undefined)
  dateFrom: string
  dateTo: string
  sliderStart: string

  // Baseline (effective - never undefined when showBaseline is true)
  showBaseline: boolean
  baselineMethod: string
  baselineDateFrom: string
  baselineDateTo: string

  // Display options
  ageGroups: string[]
  standardPopulation: string
  cumulative: boolean
  showTotal: boolean
  maximize: boolean
  showPredictionInterval: boolean
  showLabels: boolean
  showPercentage: boolean
  showLogarithmic: boolean

  // Optional
  userColors?: string[]
  decimals: string
}

/**
 * Decode a single URL parameter value
 */
function decodeUrlParam(
  field: string,
  value: string | string[] | undefined,
  config: typeof stateFieldEncoders[keyof typeof stateFieldEncoders]
): unknown {
  if (value === undefined) return undefined

  const stringValue = Array.isArray(value) ? value[0] : value

  if ('decode' in config && config.decode) {
    return config.decode(stringValue)
  } else if (Array.isArray(Defaults[field as keyof typeof Defaults])) {
    return Array.isArray(value) ? value : [stringValue]
  }
  return stringValue
}

/**
 * Parse URL query parameters into partial state
 */
function parseQueryParams(
  query: Record<string, string | string[] | undefined>
): Record<string, unknown> {
  const state: Record<string, unknown> = {}

  for (const [field, config] of Object.entries(stateFieldEncoders)) {
    const value = query[config.key]
    if (value !== undefined) {
      state[field] = decodeUrlParam(field, value, config)
    }
  }

  return state
}

/**
 * Resolve chart state from URL parameters for rendering
 *
 * This is the single source of truth for state resolution, used by both
 * SSR and explorer. It ensures identical behavior regardless of context.
 *
 * Resolution flow:
 * 1. Detect view from URL params (e=1, zs=1)
 * 2. Get view-specific defaults
 * 3. Parse and merge URL parameters
 * 4. Apply constraints (enforce view requirements)
 * 5. Compute effective date/baseline ranges
 * 6. Return complete state ready for rendering
 *
 * @param queryParams - URL query parameters
 * @param allLabels - All available date labels (for computing effective dates)
 * @returns Complete resolved state with no undefined values for required fields
 */
export function resolveChartStateForRendering(
  queryParams: Record<string, string | string[] | undefined>,
  allLabels: string[]
): ChartRenderState {
  // 1. Detect view from URL params
  const view = detectView(queryParams as Record<string, unknown>) as ViewType

  // 2. Get view-specific defaults
  const viewDefaults = getViewDefaults(view)

  // 3. Parse URL parameters
  const urlState = parseQueryParams(queryParams)

  // 4. Merge: defaults → URL params → view field
  const mergedState = {
    ...viewDefaults,
    ...urlState,
    view
  }

  // 5. Apply constraints (enforce view requirements)
  const constrainedState = applyConstraints(mergedState, view)

  // 6. Compute effective date range
  const { effectiveDateFrom, effectiveDateTo } = computeEffectiveDateRange(
    allLabels,
    constrainedState.chartType as string,
    constrainedState.sliderStart as string | undefined,
    constrainedState.dateFrom as string | undefined,
    constrainedState.dateTo as string | undefined
  )

  // 7. Compute effective baseline range using the same logic as frontend
  // If baseline dates are explicitly set in URL, use them
  // Otherwise, use calculateBaselineRange (same as useExplorerDataOrchestration)
  let effectiveBaselineFrom = constrainedState.baselineDateFrom as string | undefined
  let effectiveBaselineTo = constrainedState.baselineDateTo as string | undefined

  if (!effectiveBaselineFrom || !effectiveBaselineTo) {
    // Calculate default baseline range (same as frontend's baselineRange computed)
    // Need yearly labels for calculateBaselineRange
    const yearlyLabels = allLabels.map(label => label.substring(0, 4))
    const baselineRange = calculateBaselineRange(
      constrainedState.chartType as string,
      allLabels,
      yearlyLabels
    )
    if (baselineRange) {
      effectiveBaselineFrom = effectiveBaselineFrom || baselineRange.from
      effectiveBaselineTo = effectiveBaselineTo || baselineRange.to
    }
  }

  // Fallback to empty strings if still undefined
  effectiveBaselineFrom = effectiveBaselineFrom || ''
  effectiveBaselineTo = effectiveBaselineTo || ''

  // 8. Build complete render state with no undefined required fields
  return {
    // Core identifiers
    countries: constrainedState.countries as string[],
    type: constrainedState.type as string,
    chartType: constrainedState.chartType as string,
    chartStyle: constrainedState.chartStyle as string,

    // View
    view,
    isExcess: view === 'excess',
    isZScore: view === 'zscore',

    // Date range (effective values)
    dateFrom: effectiveDateFrom,
    dateTo: effectiveDateTo,
    sliderStart: (constrainedState.sliderStart as string) || '2010',

    // Baseline (effective values)
    showBaseline: constrainedState.showBaseline as boolean,
    baselineMethod: constrainedState.baselineMethod as string,
    baselineDateFrom: effectiveBaselineFrom,
    baselineDateTo: effectiveBaselineTo,

    // Display options
    ageGroups: constrainedState.ageGroups as string[],
    standardPopulation: constrainedState.standardPopulation as string,
    cumulative: constrainedState.cumulative as boolean,
    showTotal: constrainedState.showTotal as boolean,
    maximize: constrainedState.maximize as boolean,
    showPredictionInterval: constrainedState.showPredictionInterval as boolean,
    showLabels: constrainedState.showLabels as boolean,
    showPercentage: (constrainedState.showPercentage as boolean) ?? false,
    showLogarithmic: constrainedState.showLogarithmic as boolean,

    // Optional
    userColors: constrainedState.userColors as string[] | undefined,
    decimals: (constrainedState.decimals as string) || 'auto'
  }
}
