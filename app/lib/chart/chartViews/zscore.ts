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
   * EuroMOMO style: shaded confidence band and reference lines
   */
  referenceLines: (_, isDark) => [
    // Shaded area for ±2σ confidence band (95%)
    {
      type: 'box',
      yMin: -2,
      yMax: 2,
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.15)', // blue-500 with transparency
      borderWidth: 0,
      label: ''
    },
    // 0σ line (baseline mean)
    {
      value: 0,
      label: '0σ',
      color: isDark ? '#60a5fa' : '#3b82f6', // blue-400 / blue-500
      style: 'solid',
      width: 1.5
    },
    // +2σ line (upper confidence bound)
    {
      value: 2,
      label: '+2σ',
      color: isDark ? '#60a5fa' : '#3b82f6', // blue-400 / blue-500
      style: 'dashed',
      width: 1
    },
    // -2σ line (lower confidence bound)
    {
      value: -2,
      label: '-2σ',
      color: isDark ? '#60a5fa' : '#3b82f6', // blue-400 / blue-500
      style: 'dashed',
      width: 1
    },
    // +4σ line (extreme deviation threshold)
    {
      value: 4,
      label: '+4σ',
      color: isDark ? '#f87171' : '#ef4444', // red-400 / red-500
      style: 'dashed',
      width: 1.5
    }
  ]
}
