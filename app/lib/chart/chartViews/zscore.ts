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
   * Override: Z-Score specific title — includes the active metric
   * (Deaths / CMR / ASMR / ASD / LE / Population) so exports and
   * shared screenshots remain unambiguous.
   */
  getTitleParts: (ctx: ChartContext) => {
    const parts: string[] = ['Z-Score']

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
      case 'asd':
        parts.push('Age-Standardized', 'Deaths')
        break
      case 'le':
        parts.push('Life Expectancy')
        break
      default:
        parts.push(`Analysis${getAgeGroupSuffix(ctx.ageGroups)}`)
    }

    return parts
  },

  /**
   * Override: Statistical explanation subtitle
   */
  getSubtitle: (ctx: ChartContext) => {
    const parts: string[] = []

    // Main z-score description
    parts.push('Statistical deviations from baseline mean · Values beyond ±2 are significant')

    // Method indicator — two methods produce different y-axis scales
    parts.push(
      ctx.zscoreMethod === 'variance_stabilized'
        ? 'Method: Variance-stabilized (Box-Cox)'
        : 'Method: Standard'
    )

    // Baseline description
    parts.push(getBaselineDescription(ctx.baselineMethod, ctx.baselineDateFrom, ctx.baselineDateTo))

    return parts.filter(Boolean).join(' · ') || null
  },

  /**
   * Override: Z-Score specific Y-axis label
   */
  yAxisLabel: (ctx: ChartContext) =>
    ctx.zscoreMethod === 'variance_stabilized'
      ? 'Z-Score (Standard Deviations, variance-stabilized)'
      : 'Z-Score (Standard Deviations)',

  /**
   * Override: Z-Score reference lines (sigma lines)
   * EuroMOMO style: shaded confidence band and reference lines
   */
  referenceLines: (_, isDark) => [
    // Shaded area for ±2σ confidence band (95%)
    {
      drawTime: 'beforeDatasetsDraw',
      type: 'box',
      yMin: -2,
      yMax: 2,
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.15)', // blue-500 with transparency
      borderWidth: 0,
      label: '',
      z: -1000
    },
    // 0σ line (baseline mean)
    {
      drawTime: 'beforeDatasetsDraw',
      value: 0,
      label: '',
      color: isDark ? '#525252' : '#a1a1a1', // neutral-600 / neutral-400
      style: 'solid',
      width: 1.5
    },
    // +2σ line (upper confidence bound)
    {
      drawTime: 'beforeDatasetsDraw',
      value: 2,
      label: '+2σ',
      color: isDark ? '#60a5fa' : '#3b82f6', // blue-400 / blue-500
      style: 'dashed',
      width: 1
    },
    // -2σ line (lower confidence bound)
    {
      drawTime: 'beforeDatasetsDraw',
      value: -2,
      label: '-2σ',
      color: isDark ? '#60a5fa' : '#3b82f6', // blue-400 / blue-500
      style: 'dashed',
      width: 1
    },
    // +4σ line (extreme deviation threshold)
    {
      drawTime: 'beforeDatasetsDraw',
      value: 4,
      label: '+4σ',
      color: isDark ? '#f87171' : '#ef4444', // red-400 / red-500
      style: 'dashed',
      width: 1.5
    }
  ]
}
