/**
 * Chart View Configuration System
 *
 * Defines chart-specific configuration for each view type (mortality, excess, zscore).
 * This complements the UI view system (app/lib/state/views.ts) by handling
 * chart rendering concerns: titles, labels, annotations, data strategies.
 *
 * Benefits:
 * - Centralizes view-specific chart logic
 * - Easy to add new views (just add config)
 * - Eliminates scattered conditionals
 * - Type-safe view configuration
 */

import type { ViewType } from '../state/viewTypes'

/**
 * Chart state passed to title/subtitle generators
 */
export interface ChartContext {
  // Data selection
  countries: string[]
  type: string // 'deaths', 'cmr', 'asmr', etc.
  ageGroups: string[]
  standardPopulation: string

  // Display options
  cumulative: boolean
  showBaseline: boolean
  showPredictionInterval: boolean
  showTotal: boolean
  chartType: string

  // Baseline
  baselineMethod: string
  baselineDateFrom: string
  baselineDateTo: string

  // View
  view: ViewType
}

/**
 * Annotation/Reference line configuration
 */
export interface ReferenceLineConfig {
  value: number // Y-axis value
  label: string // Display text (e.g., '0σ', '+2σ')
  color: string // Line color
  style: 'solid' | 'dashed' // Line style
  width?: number // Line width (default: 1)
  dark?: { // Optional dark mode overrides
    color?: string
  }
}

/**
 * Chart view configuration
 */
export interface ChartViewConfig {
  /**
   * Generate chart title parts
   * Returns array of title parts to be joined
   */
  getTitleParts: (ctx: ChartContext) => string[]

  /**
   * Generate subtitle (optional)
   * Returns subtitle string or null
   */
  getSubtitle?: (ctx: ChartContext) => string | null

  /**
   * Y-axis label
   * Can be string or function for dynamic labels
   */
  yAxisLabel: string | ((ctx: ChartContext) => string)

  /**
   * X-axis label (optional)
   * Usually determined by chart type, but can be overridden
   */
  xAxisLabel?: string | ((ctx: ChartContext) => string)

  /**
   * Reference lines / annotations
   * Function allows dynamic annotations based on data
   */
  referenceLines?: (ctx: ChartContext, isDark: boolean) => ReferenceLineConfig[]
}

/**
 * Chart view configurations for each view type
 */
export const CHART_VIEWS: Record<ViewType, ChartViewConfig> = {
  /**
   * Mortality View (Default)
   * Standard mortality data visualization
   */
  mortality: {
    getTitleParts: (ctx) => {
      const parts: string[] = []

      // Add cumulative prefix if enabled
      if (ctx.cumulative) {
        parts.push('Cumulative')
      }

      // Type-specific title parts
      switch (ctx.type) {
        case 'population':
          parts.push(`Population${getAgeGroupSuffix(ctx.ageGroups)}`)
          break
        case 'deaths':
          parts.push(`Deaths${getAgeGroupSuffix(ctx.ageGroups)}`)
          break
        case 'cmr':
          parts.push('Crude', `Mortality Rate${getAgeGroupSuffix(ctx.ageGroups)}`)
          break
        case 'asmr':
          parts.push('Age-Standardized', 'Mortality Rate')
          break
        case 'le':
          parts.push('Life Expectancy')
          break
      }

      return parts
    },

    getSubtitle: (ctx) => {
      const parts: string[] = []

      // ASMR standard population
      if (ctx.type === 'asmr') {
        parts.push(getASMRTitle(ctx.countries, ctx.standardPopulation))
      }

      // Life expectancy note
      if (ctx.type === 'le') {
        parts.push('Based on WHO2015 Std. Pop.')
      }

      // Baseline description
      if (ctx.showBaseline) {
        parts.push(getBaselineDescription(ctx.baselineMethod, ctx.baselineDateFrom, ctx.baselineDateTo))
      }

      // Prediction interval
      if (ctx.showBaseline && ctx.showPredictionInterval) {
        parts.push('95% Prediction Interval')
      }

      return parts.filter(Boolean).join(' · ') || null
    },

    yAxisLabel: (ctx) => {
      switch (ctx.type) {
        case 'population':
          return 'People'
        case 'deaths':
          return ctx.cumulative ? 'Cumulative Deaths' : 'Deaths'
        case 'cmr':
        case 'asmr':
          return 'Deaths per 100k'
        case 'le':
          return 'Years'
        default:
          return 'Deaths per 100k'
      }
    },

    referenceLines: () => [] // No reference lines in mortality view
  },

  /**
   * Excess View
   * Shows excess deaths compared to baseline
   */
  excess: {
    getTitleParts: (ctx) => {
      const parts: string[] = []

      // Add cumulative prefix if enabled
      if (ctx.cumulative) {
        parts.push('Cumulative')
      }

      // Type-specific excess titles
      switch (ctx.type) {
        case 'deaths':
          parts.push(`Excess Deaths${getAgeGroupSuffix(ctx.ageGroups)}`)
          break
        case 'cmr':
          parts.push('Crude Excess', `Mortality${getAgeGroupSuffix(ctx.ageGroups)}`)
          break
        case 'asmr':
          parts.push('Age-Standardized', 'Excess Mortality')
          break
        case 'le':
          parts.push('Change in', 'Life Expectancy')
          break
      }

      return parts
    },

    getSubtitle: (ctx) => {
      const parts: string[] = []

      // ASMR standard population
      if (ctx.type === 'asmr') {
        parts.push(getASMRTitle(ctx.countries, ctx.standardPopulation))
      }

      // Baseline description
      parts.push(getBaselineDescription(ctx.baselineMethod, ctx.baselineDateFrom, ctx.baselineDateTo))

      // Prediction interval
      if (ctx.showPredictionInterval) {
        parts.push('95% Prediction Interval')
      }

      return parts.filter(Boolean).join(' · ') || null
    },

    yAxisLabel: (ctx) => {
      switch (ctx.type) {
        case 'deaths':
          return ctx.cumulative ? 'Cum. Excess Deaths' : 'Excess Deaths'
        case 'cmr':
        case 'asmr':
          return 'Excess Deaths per 100k'
        case 'le':
          return 'Years'
        default:
          return 'Excess Deaths'
      }
    },

    referenceLines: () => [
      // Zero line (baseline)
      {
        value: 0,
        label: 'Baseline',
        color: '#9ca3af',
        style: 'solid',
        width: 1.5,
        dark: { color: '#6b7280' }
      }
    ]
  },

  /**
   * Z-Score View
   * Statistical analysis showing standard deviations from baseline
   */
  zscore: {
    getTitleParts: (ctx) => {
      return ['Z-Score Analysis', getAgeGroupSuffix(ctx.ageGroups)]
    },

    getSubtitle: (ctx) => {
      const parts: string[] = []

      // Main z-score description
      parts.push('Statistical deviations from baseline mean · Values beyond ±2 are significant')

      // Baseline description
      parts.push(getBaselineDescription(ctx.baselineMethod, ctx.baselineDateFrom, ctx.baselineDateTo))

      return parts.filter(Boolean).join(' · ') || null
    },

    yAxisLabel: 'Z-Score (Standard Deviations)',

    referenceLines: (_, isDark) => [
      // 0σ line (baseline mean)
      {
        value: 0,
        label: '0σ',
        color: isDark ? '#6b7280' : '#9ca3af',
        style: 'solid',
        width: 1.5
      },
      // +2σ line (95% confidence)
      {
        value: 2,
        label: '+2σ',
        color: isDark ? '#eab308' : '#ca8a04',
        style: 'dashed',
        width: 1
      },
      // -2σ line
      {
        value: -2,
        label: '-2σ',
        color: isDark ? '#eab308' : '#ca8a04',
        style: 'dashed',
        width: 1
      },
      // +4σ line (extreme deviation)
      {
        value: 4,
        label: '+4σ',
        color: isDark ? '#ef4444' : '#dc2626',
        style: 'dashed',
        width: 1
      }
    ]
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get age group suffix for title
 * Returns empty string for 'all', otherwise returns [ageGroup]
 */
function getAgeGroupSuffix(ageGroups: string[]): string {
  if (ageGroups.length === 1 && ageGroups[0] !== 'all') {
    return ` [${ageGroups[0]}]`
  }
  return ''
}

/**
 * Get ASMR standard population title
 */
function getASMRTitle(countries: string[], standardPopulation: string): string {
  const asmrTitles: Record<string, string> = {
    who: 'WHO Standard Population',
    esp: 'European Standard Population',
    usa: 'U.S. Standard Population'
  }

  if (standardPopulation === 'country') {
    return `${countries.join(',')} 2020 Standard Population`
  }

  const title = asmrTitles[standardPopulation]
  if (!title) {
    throw new Error(`Unrecognized standard population key: ${standardPopulation}`)
  }

  return title
}

/**
 * Get baseline description text
 */
function getBaselineDescription(
  baselineMethod: string,
  baselineDateFrom: string,
  baselineDateTo: string
): string {
  const methodNames: Record<string, string> = {
    mean: 'Mean',
    median: 'Median',
    naive: 'Naive'
  }

  const methodName = methodNames[baselineMethod] || baselineMethod

  if (baselineMethod === 'naive') {
    return `Baseline: ${methodName} ${baselineDateTo}`
  }

  return `Baseline: ${methodName} ${baselineDateFrom}-${baselineDateTo}`
}

/**
 * Get chart view configuration for a given view type
 * Always returns a valid config (defaults to mortality view)
 */
export function getChartView(view: ViewType): ChartViewConfig {
  const config = CHART_VIEWS[view]
  if (!config) {
    return CHART_VIEWS.mortality
  }
  return config
}
