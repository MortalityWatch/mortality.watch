/**
 * Excess View Configuration
 *
 * Shows excess deaths compared to baseline
 * Extends base view with "Excess" prefix and baseline reference line
 */

import type { ChartViewConfig, ChartContext } from './types'
import { getAgeGroupSuffix, getASMRTitle, getBaselineDescription } from './helpers'

/**
 * Excess view - extends base with excess-specific logic
 */
export const EXCESS_VIEW: ChartViewConfig = {
  /**
   * Override: Add "Excess" prefix to titles
   */
  getTitleParts: (ctx: ChartContext) => {
    const parts: string[] = []

    // Add cumulative prefix if enabled
    if (ctx.cumulative) {
      parts.push('Cumulative')
    }

    // Type-specific excess titles (adds "Excess" to each type)
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
      case 'asd':
        parts.push('Age-Standardized', 'Excess Deaths')
        break
      case 'le':
        parts.push('Change in', 'Life Expectancy')
        break
    }

    return parts
  },

  /**
   * Override: Subtitle always includes baseline (required for excess)
   */
  getSubtitle: (ctx: ChartContext) => {
    const parts: string[] = []

    // ASMR standard population
    if (ctx.type === 'asmr') {
      parts.push(getASMRTitle(ctx.countries, ctx.standardPopulation))
    }

    // Baseline description (always shown for excess)
    parts.push(getBaselineDescription(ctx.baselineMethod, ctx.baselineDateFrom, ctx.baselineDateTo))

    // Prediction interval
    if (ctx.showPredictionInterval) {
      parts.push('95% Prediction Interval')
    }

    return parts.filter(Boolean).join(' · ') || null
  },

  /**
   * Override: Y-axis labels for excess metrics
   */
  yAxisLabel: (ctx: ChartContext) => {
    switch (ctx.type) {
      case 'deaths':
        return ctx.cumulative ? 'Cum. Excess Deaths' : 'Excess Deaths'
      case 'cmr':
      case 'asmr':
        return ctx.cumulative ? 'Cum. Excess per 100k' : 'Excess Deaths per 100k'
      case 'asd':
        return ctx.cumulative ? 'Cum. Excess Deaths' : 'Excess Deaths'
      case 'le':
        return 'Years'
      default:
        return ctx.cumulative ? 'Cum. Excess Deaths' : 'Excess Deaths'
    }
  },

  /**
   * Add: Baseline reference line at y=0
   */
  referenceLines: () => [
    {
      value: 0,
      label: 'Baseline',
      color: '#9ca3af',
      style: 'solid',
      width: 1.5,
      dark: { color: '#6b7280' }
    }
  ]
}
