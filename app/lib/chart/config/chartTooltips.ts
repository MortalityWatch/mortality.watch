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
 */
export function createTooltipCallbacks(
  showPi: boolean,
  isExcess: boolean,
  showPercentage: boolean,
  showDecimals: boolean,
  decimals: string
) {
  return {
    label: (context: TooltipItem<'line' | 'bar'>) => {
      let label = context.dataset.label || ''
      const value = context.parsed as unknown as ChartErrorDataPoint
      const min = value.yMin || value.yMinMin
      const max = value.yMax || value.yMaxMax
      const pi = showPi && min && max ? { min, max } : undefined
      label = getLabelText(
        label,
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
