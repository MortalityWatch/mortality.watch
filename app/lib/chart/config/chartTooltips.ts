/**
 * Chart Tooltip Configuration Functions
 *
 * Functions for configuring Chart.js tooltips
 */

import type { TooltipItem } from 'chart.js'
import type { ChartErrorDataPoint } from '../chartTypes'
import { getLabelText } from './chartLabels'

/**
 * Create tooltip callbacks configuration
 *
 * Tooltips show:
 * - Title: Country name and period (e.g., "Sweden - 2023")
 * - Label: Formatted value with optional prediction interval
 */
export function createTooltipCallbacks(
  showPi: boolean,
  isExcess: boolean,
  showPercentage: boolean,
  showDecimals: boolean,
  decimals: string
) {
  return {
    // Show country name and period as title
    title: (items: TooltipItem<'line' | 'bar'>[]) => {
      if (!items.length) return ''
      const item = items[0]
      const country = item.dataset.label || ''
      const period = item.label || ''
      if (!country) return period
      return `${country} - ${period}`
    },
    // Show formatted value as label (without country prefix since it's in title)
    label: (context: TooltipItem<'line' | 'bar'>) => {
      const value = context.parsed as unknown as ChartErrorDataPoint
      // Skip tooltip for null values (gaps in chart)
      if (value.y === null) return ''
      const min = value.yMin || value.yMinMin
      const max = value.yMax || value.yMaxMax
      const pi = showPi && min && max ? { min, max } : undefined
      // Use empty label prefix since country is shown in title
      const label = getLabelText(
        '',
        value.y,
        pi,
        false,
        isExcess,
        showPercentage,
        showDecimals,
        decimals
      )
      return label
    }
  }
}
