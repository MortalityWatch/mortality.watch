/**
 * Z-Score View Configuration
 *
 * Statistical analysis showing standard deviations from baseline
 * Completely overrides base behavior for specialized statistical visualization
 */

import type { ChartViewConfig, ChartContext } from './types'
import { getAgeGroupSuffix, getBaselineDescription } from './helpers'

/**
 * Z-Score view - specialized statistical view
 * Overrides most base behavior
 */
export const ZSCORE_VIEW: ChartViewConfig = {
  /**
   * Override: Z-Score specific title
   */
  getTitleParts: (ctx: ChartContext) => {
    return ['Z-Score Analysis', getAgeGroupSuffix(ctx.ageGroups)]
  },

  /**
   * Override: Statistical explanation subtitle
   */
  getSubtitle: (ctx: ChartContext) => {
    const parts: string[] = []

    // Main z-score description
    parts.push('Statistical deviations from baseline mean · Values beyond ±2 are significant')

    // Baseline description
    parts.push(getBaselineDescription(ctx.baselineMethod, ctx.baselineDateFrom, ctx.baselineDateTo))

    return parts.filter(Boolean).join(' · ') || null
  },

  /**
   * Override: Z-Score specific Y-axis label
   */
  yAxisLabel: 'Z-Score (Standard Deviations)',

  /**
   * Override: Z-Score reference lines (sigma lines)
   * Shows -2σ, 0σ, +2σ, +4σ lines (EuroMOMO style)
   */
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
