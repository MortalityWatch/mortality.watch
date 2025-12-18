/**
 * ASD View Configuration (Age-Standardized Deaths)
 *
 * Shows age-standardized deaths using the Levitt method
 * Extends base view with ASD-specific titles and baseline reference
 */

import type { ChartViewConfig, ChartContext } from './types'
import { getAgeGroupSuffix, getBaselineDescription } from './helpers'

/**
 * ASD view - age-standardized deaths analysis
 */
export const ASD_VIEW: ChartViewConfig = {
  /**
   * Override: Add "Age-Standardized" prefix to titles
   */
  getTitleParts: (ctx: ChartContext) => {
    const parts: string[] = []

    // Add cumulative prefix if enabled
    if (ctx.cumulative) {
      parts.push('Cumulative')
    }

    // ASD specific title
    parts.push('Age-Standardized', `Deaths${getAgeGroupSuffix(ctx.ageGroups)}`)

    return parts
  },

  /**
   * Override: Subtitle always includes baseline (required for ASD)
   */
  getSubtitle: (ctx: ChartContext) => {
    const parts: string[] = []

    // Method description
    parts.push('Levitt method')

    // Baseline description (always shown for ASD)
    parts.push(getBaselineDescription(ctx.baselineMethod, ctx.baselineDateFrom, ctx.baselineDateTo))

    // Prediction interval
    if (ctx.showPredictionInterval) {
      parts.push('95% Prediction Interval')
    }

    return parts.filter(Boolean).join(' · ') || null
  },

  /**
   * Override: Y-axis labels for ASD metrics
   */
  yAxisLabel: (ctx: ChartContext) => {
    if (ctx.cumulative) {
      return 'Cumulative Age-Standardized Deaths'
    }
    return 'Age-Standardized Deaths'
  },

  /**
   * Add: Baseline reference line (similar to excess view)
   */
  referenceLines: (ctx: ChartContext, _isDark: boolean) => {
    // Only show baseline reference if not showing as percentage
    if (ctx.showBaseline && !ctx.cumulative) {
      return [
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
    return []
  }
}
