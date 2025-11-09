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
import { getLabelText } from './chartLabels'

/**
 * Create scales configuration
 */
export function createScalesConfig(
  data: MortalityChartData,
  isExcess: boolean,
  showPercentage: boolean,
  showDecimals: boolean,
  decimals: string,
  isDark?: boolean
) {
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
        font: getTicksFont()
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
        callback: function (
          this: Scale,
          tickValue: number | string
        ): string {
          return getLabelText(
            '',
            typeof tickValue === 'string' ? parseInt(tickValue) : tickValue,
            undefined,
            true,
            isExcess,
            showPercentage,
            showDecimals,
            decimals
          )
        }
      }
    }
  }
}
