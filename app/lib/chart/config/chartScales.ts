/**
 * Chart Scales Configuration Functions
 *
 * Functions for configuring Chart.js scales (x and y axes)
 */

import type { Scale } from 'chart.js'
import {
  getScaleTitleFont,
  getTicksFont
} from '../chartStyling'
import {
  borderColor,
  textSoftColor,
  textStrongColor
} from '../chartColors'
import type { MortalityChartData } from '../chartTypes'
import { extractYValues, getLabelText } from './chartLabels'

/**
 * Compute axis tick precision based on data range.
 * Uses 0 decimals for large values, more for small ranges.
 */
function computeAxisPrecision(data: MortalityChartData, isPercentage: boolean): number {
  const values = extractYValues(data)
  if (values.length === 0) return 0

  // For percentages, multiply by 100 to get display values
  const displayValues = isPercentage ? values.map(v => v * 100) : values
  const maxAbs = Math.max(...displayValues.map(v => Math.abs(v)))

  // Axis ticks need less precision than data labels
  // Only show decimals if the max value is small
  if (maxAbs >= 10) return 0 // 10+ -> no decimals (10%, 20%, 100, 200)
  if (maxAbs >= 1) return 1 // 1-10 -> 1 decimal (1.5%, 5.0%)
  return 2 // <1 -> 2 decimals (0.50%)
}

/**
 * Create scales configuration
 *
 * @param data - Chart data with axis titles and display options
 * @param isExcess - Whether showing excess mortality
 * @param showPercentage - Whether to format as percentages
 * @param showDecimals - Whether to show decimal places
 * @param decimals - Decimal precision ('auto' or number string)
 * @param isDark - Dark mode flag
 * @param isSSR - Server-side rendering flag (applies font metric adjustments)
 */
export function createScalesConfig(
  data: MortalityChartData,
  isExcess: boolean,
  showPercentage: boolean,
  showDecimals: boolean,
  decimals: string,
  isDark?: boolean,
  isSSR?: boolean
) {
  // Compute axis-specific precision (less than data labels)
  const axisPrecision = decimals === 'auto'
    ? computeAxisPrecision(data, showPercentage)
    : parseInt(decimals)

  // SSR font adjustments: node-canvas has slightly different text metrics
  // These offsets help align SSR output with browser rendering
  const ssrTickPadding = isSSR ? 2 : 0

  return {
    x: {
      offset: data.showXOffset,
      title: {
        display: true,
        text: data.xtitle,
        color: textStrongColor(isDark),
        font: getScaleTitleFont()
      },
      grid: {
        color: borderColor(isDark)
      },
      ticks: {
        color: textSoftColor(isDark),
        font: getTicksFont(),
        padding: ssrTickPadding
      }
    },
    y: {
      type: data.showLogarithmic ? 'logarithmic' as const : 'linear' as const,
      beginAtZero: data.isMaximized,
      title: {
        display: true,
        text: data.ytitle,
        color: textStrongColor(isDark),
        font: getScaleTitleFont()
      },
      grid: {
        lineWidth: (context: { tick: string }) => {
          return context.tick ? 2 : 1
        },
        color: borderColor(isDark)
      },
      ticks: {
        color: textSoftColor(isDark),
        font: getTicksFont(),
        padding: ssrTickPadding,
        callback: function (
          this: Scale,
          tickValue: number | string
        ): string {
          const value = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue
          return getLabelText(
            '',
            value,
            undefined,
            true,
            isExcess,
            showPercentage,
            showDecimals,
            axisPrecision
          )
        }
      }
    }
  }
}
