/**
 * Base Chart View Configuration
 *
 * Master config with default implementations that all views can inherit
 */

import type { CompleteChartViewConfig } from './types'
import { getAgeGroupSuffix, getASMRTitle, getBaselineDescription } from './helpers'

/**
 * Base view configuration
 * Provides standard mortality visualization behavior
 */
export const BASE_VIEW: CompleteChartViewConfig = {
  /**
   * Default title generation
   * Handles all metric types with standard (non-excess) titles
   */
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

  /**
   * Default subtitle generation
   * Shows ASMR standard population, life expectancy note, baseline, and prediction interval
   */
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

  /**
   * Default Y-axis label
   * Handles all metric types
   */
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

  /**
   * Default reference lines (none for standard mortality view)
   */
  referenceLines: () => []
}
