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
import type { ChartFilterConfig, ChartStateSnapshot } from '@/lib/chart/types'
import type { Country } from '@/model'
import { getDefaultSliderStart } from '@/lib/config/constants'

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
  leAdjusted: boolean // LE seasonal adjustment

  // Optional
  userColors?: string[]
  decimals: string
  showLogo: boolean
  showQrCode: boolean
  showCaption: boolean
  showTitle: boolean
  showLegend: boolean
  showXAxisTitle: boolean
  showYAxisTitle: boolean
  darkMode: boolean
  hideSteepDrop: boolean
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

  // For array fields with decode function (countries, ageGroups, userColors):
  // - If value is already an array, return it as-is
  // - If value is a comma-separated string, decode splits it
  if ('decode' in config && config.decode) {
    if (Array.isArray(value)) {
      // Value is already an array (e.g., from Vue Router), return as-is
      return value
    }
    return config.decode(value)
  }

  const stringValue = Array.isArray(value) ? value[0] : value
  if (Array.isArray(Defaults[field as keyof typeof Defaults])) {
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
    sliderStart: (constrainedState.sliderStart as string) || getDefaultSliderStart(),

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
    leAdjusted: (constrainedState.leAdjusted as boolean) ?? true,

    // Optional
    userColors: constrainedState.userColors as string[] | undefined,
    decimals: (constrainedState.decimals as string) || 'auto',
    showLogo: (constrainedState.showLogo as boolean) ?? true,
    showQrCode: (constrainedState.showQrCode as boolean) ?? true,
    showCaption: (constrainedState.showCaption as boolean) ?? true,
    showTitle: (constrainedState.showTitle as boolean) ?? true,
    showLegend: (constrainedState.showLegend as boolean) ?? true,
    showXAxisTitle: (constrainedState.showXAxisTitle as boolean) ?? true,
    showYAxisTitle: (constrainedState.showYAxisTitle as boolean) ?? true,
    darkMode: (constrainedState.darkMode as boolean) ?? false,
    hideSteepDrop: (constrainedState.hideSteepDrop as boolean) ?? false
  }
}

/**
 * Resolve chart state from a ChartStateSnapshot.
 *
 * This allows the client to use the same resolution logic as SSR,
 * but starting from a snapshot (from refs) rather than URL params.
 *
 * @param snapshot - Current state snapshot from refs
 * @param allLabels - All available date labels (for computing effective dates)
 * @returns Complete resolved state with effective dates/baselines computed
 */
export function resolveChartStateFromSnapshot(
  snapshot: ChartStateSnapshot,
  allLabels: string[]
): ChartRenderState {
  // Detect view from snapshot
  const view = (snapshot.view as ViewType) || 'mortality'

  // Note: We don't apply constraints here because the snapshot has already been
  // constrained by StateResolver on the client. This function is only used by
  // the client (SSR uses resolveChartStateForRendering which starts from URL params).
  // We just need to compute effective dates for undefined values.

  // Compute effective date range
  const { effectiveDateFrom, effectiveDateTo } = computeEffectiveDateRange(
    allLabels,
    snapshot.chartType as string,
    snapshot.sliderStart,
    snapshot.dateFrom,
    snapshot.dateTo
  )

  // Compute effective baseline range
  let effectiveBaselineFrom = snapshot.baselineDateFrom
  let effectiveBaselineTo = snapshot.baselineDateTo

  if (!effectiveBaselineFrom || !effectiveBaselineTo) {
    const yearlyLabels = allLabels.map(label => label.substring(0, 4))
    const baselineRange = calculateBaselineRange(
      snapshot.chartType as string,
      allLabels,
      yearlyLabels
    )
    if (baselineRange) {
      effectiveBaselineFrom = effectiveBaselineFrom || baselineRange.from
      effectiveBaselineTo = effectiveBaselineTo || baselineRange.to
    }
  }

  effectiveBaselineFrom = effectiveBaselineFrom || ''
  effectiveBaselineTo = effectiveBaselineTo || ''

  return {
    countries: snapshot.countries,
    type: snapshot.type,
    chartType: snapshot.chartType,
    chartStyle: snapshot.chartStyle,
    view,
    isExcess: snapshot.isExcess,
    isZScore: snapshot.isZScore,
    dateFrom: effectiveDateFrom,
    dateTo: effectiveDateTo,
    sliderStart: snapshot.sliderStart || getDefaultSliderStart(),
    showBaseline: snapshot.showBaseline,
    baselineMethod: snapshot.baselineMethod,
    baselineDateFrom: effectiveBaselineFrom,
    baselineDateTo: effectiveBaselineTo,
    ageGroups: snapshot.ageGroups,
    standardPopulation: snapshot.standardPopulation,
    cumulative: snapshot.cumulative,
    showTotal: snapshot.showTotal,
    maximize: snapshot.maximize,
    showPredictionInterval: snapshot.showPredictionInterval,
    showLabels: snapshot.showLabels,
    showPercentage: snapshot.showPercentage ?? false,
    showLogarithmic: snapshot.showLogarithmic,
    leAdjusted: snapshot.leAdjusted ?? true,
    userColors: snapshot.userColors,
    decimals: snapshot.decimals || 'auto',
    // These fields aren't in ChartStateSnapshot - use defaults
    // (They're only needed for SSR chart rendering, not client-side)
    showLogo: true,
    showQrCode: true,
    showCaption: true,
    showTitle: true,
    showLegend: true,
    showXAxisTitle: true,
    showYAxisTitle: true,
    darkMode: false,
    hideSteepDrop: false
  }
}

/**
 * Generate explorer URL from resolved state.
 *
 * Single source of truth for URL generation - used by both client and SSR
 * to ensure QR codes are identical.
 *
 * @param state - Resolved chart state (with effective dates/baselines computed)
 * @param siteUrl - Base site URL (default: https://www.mortality.watch)
 * @returns Full explorer URL with all state parameters
 */
export function generateUrlFromState(
  state: ChartRenderState,
  siteUrl = 'https://www.mortality.watch'
): string {
  const params = new URLSearchParams()

  // Core fields
  if (state.countries.length) params.set('c', state.countries.join(','))
  params.set('t', state.type)
  params.set('ct', state.chartType)
  params.set('cs', state.chartStyle)

  // Date range - use effective values
  if (state.dateFrom) params.set('df', state.dateFrom)
  if (state.dateTo) params.set('dt', state.dateTo)
  if (state.sliderStart) params.set('ss', state.sliderStart)

  // Baseline - use effective values
  if (state.showBaseline) params.set('sb', '1')
  params.set('bm', state.baselineMethod)
  if (state.baselineDateFrom) params.set('bf', state.baselineDateFrom)
  if (state.baselineDateTo) params.set('bt', state.baselineDateTo)

  // Display options
  if (state.ageGroups.length && state.ageGroups[0] !== 'all') params.set('ag', state.ageGroups.join(','))
  if (state.standardPopulation && state.standardPopulation !== 'esp') params.set('sp', state.standardPopulation)
  if (state.cumulative) params.set('ce', '1')
  if (state.showTotal) params.set('st', '1')
  if (state.maximize) params.set('m', '1')
  if (state.showPredictionInterval) params.set('pi', '1')
  if (state.showLabels) params.set('sl', '1')
  if (state.showPercentage) params.set('p', '1')
  if (state.showLogarithmic) params.set('lg', '1')

  // View indicators
  if (state.isExcess) params.set('e', '1')
  if (state.isZScore) params.set('zs', '1')

  // Optional
  if (state.userColors?.length) params.set('uc', state.userColors.join(','))
  if (state.decimals && state.decimals !== 'auto') params.set('dec', state.decimals)

  return `${siteUrl}/explorer?${params.toString()}`
}

/**
 * Convert ChartRenderState to ChartFilterConfig.
 *
 * This is the bridge between the unified state resolution and the chart
 * filtering/rendering pipeline. Both SSR and client use this to ensure
 * identical chart output.
 *
 * @param state - Resolved chart state
 * @param allCountries - Country metadata for chart generation
 * @param colors - Chart colors
 * @param url - URL for QR code
 * @returns ChartFilterConfig ready for getFilteredChartDataFromConfig
 */
export function toChartFilterConfig(
  state: ChartRenderState,
  allCountries: Record<string, Country>,
  colors: string[],
  url: string
): ChartFilterConfig {
  // Compute derived flags from resolved state
  const isBarChartStyle = state.chartStyle === 'bar'
  const isMatrixChartStyle = state.chartStyle === 'matrix'
  const isAsmrType = state.type === 'asmr' || state.type.startsWith('asmr_')
  const isASD = state.type === 'asd'
  const isPopulationType = state.type === 'population'
  const isDeathsType = state.type === 'deaths'

  // Error bars shown on bar charts in excess mode (matches useExplorerHelpers.isErrorBarType)
  const isErrorBarType = isBarChartStyle && state.isExcess

  // Use shared computeShowCumPi - same logic as useExplorerHelpers.showCumPi()
  const showCumPi = computeShowCumPi(state.cumulative, state.chartType, state.baselineMethod)

  return {
    // Data selection
    countries: state.countries,
    ageGroups: isAsmrType ? ['all'] : state.ageGroups,

    // Chart type settings
    type: state.type,
    chartType: state.chartType,
    standardPopulation: state.standardPopulation,

    // View and style
    view: state.view,
    isExcess: state.isExcess,
    chartStyle: state.chartStyle,
    isBarChartStyle,
    isMatrixChartStyle,
    isErrorBarType,
    isAsmrType,
    isASD,
    isPopulationType,
    isDeathsType,

    // Date range (already effective values)
    dateFrom: state.dateFrom,
    dateTo: state.dateTo,

    // Baseline (already effective values)
    baselineMethod: state.baselineMethod,
    baselineDateFrom: state.baselineDateFrom,
    baselineDateTo: state.baselineDateTo,
    showBaseline: state.showBaseline,

    // Display options
    cumulative: state.cumulative,
    showTotal: state.showTotal,
    showPredictionInterval: state.showPredictionInterval,
    showPercentage: state.showPercentage,
    showCumPi,
    maximize: state.maximize,
    showLabels: state.showLabels,
    showLogarithmic: state.showLogarithmic,
    leAdjusted: state.leAdjusted,

    // Visual
    colors,

    // Context
    allCountries,
    url
  }
}

/**
 * Check if chart type is yearly (fluseason, yearly, midyear).
 * Pure function - can be used in both client and SSR.
 */
export function isYearlyChartType(chartType: string): boolean {
  return chartType.includes('year')
    || chartType.includes('fluseason')
    || chartType.includes('midyear')
}

/**
 * Compute whether cumulative prediction intervals should be used.
 * This determines if the /cum endpoint is used for baseline calculations.
 *
 * Cumulative PIs are only valid when:
 * - Cumulative mode is enabled
 * - Chart type is yearly (fluseason, yearly, midyear)
 * - Baseline method supports PIs (lin_reg or mean)
 *
 * Pure function - matches useExplorerHelpers.showCumPi() logic.
 * Used by both SSR data fetching and client-side data orchestration.
 */
export function computeShowCumPi(
  cumulative: boolean,
  chartType: string,
  baselineMethod: string
): boolean {
  return cumulative
    && isYearlyChartType(chartType)
    && ['lin_reg', 'mean'].includes(baselineMethod)
}
