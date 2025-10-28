/**
 * Chart Configuration Helper Functions
 *
 * Extracted from makeBarLineChartConfig to reduce complexity
 * and improve maintainability.
 */

import type {
  CartesianScaleOptions,
  Chart,
  Scale,
  ScaleOptionsByType,
  TooltipItem
} from 'chart.js'
import {
  bgColor,
  getDatalabelsFont,
  getLegendFont,
  getScaleTitleFont,
  getSubtitleFont,
  getTicksFont,
  getTitleFont
} from './chartStyling'
import {
  backgroundColor,
  borderColor,
  textColor,
  textSoftColor,
  textStrongColor
} from './chartColors'
import { asPercentage, numberWithCommas, round } from './chartUtils'
import type { ChartErrorDataPoint, MortalityChartData } from './chartTypes'
import type { Context } from 'chartjs-plugin-datalabels'

/**
 * Create custom background color plugin
 */
export function createBackgroundPlugin(isDark?: boolean) {
  return {
    id: 'customCanvasBackgroundColor',
    beforeDraw: (chart: Chart) => {
      const { ctx } = chart
      ctx.save()
      ctx.fillStyle = backgroundColor(isDark)
      ctx.fillRect(0, 0, chart.width, chart.height)
      ctx.restore()
    }
  }
}

/**
 * Create onResize handler for font updates
 */
export function createOnResizeHandler() {
  return (chart: Chart) => {
    chart.options.plugins!.title!.font! = getTitleFont()
    chart.options.plugins!.subtitle!.font! = getSubtitleFont()
    chart.options.plugins!.legend!.labels!.font! = getLegendFont()
    ;(chart.options.scales!.x! as ScaleOptionsByType<'radialLinear'>).ticks
      .font! = getTicksFont()
    ;(chart.options.scales!.x! as CartesianScaleOptions).title.font
      = getScaleTitleFont()
    ;(chart.options.scales!.y! as ScaleOptionsByType<'radialLinear'>).ticks
      .font! = getTicksFont()
    ;(chart.options.scales!.y! as CartesianScaleOptions).title.font
      = getScaleTitleFont()
    chart.options.plugins!.datalabels!.font! = getDatalabelsFont()
  }
}

/**
 * Format confidence interval text
 */
function formatCI(
  short: boolean,
  min: number,
  max: number,
  formatFn: (n: number) => string
) {
  return short
    ? ` (${formatFn(min)}, ${formatFn(max)})`
    : ` [95% PI: ${formatFn(min)}, ${formatFn(max)}]`
}

/**
 * Get maximum decimal places for display
 */
function getMaxDecimals(
  y: number,
  short: boolean,
  showDecimals: boolean,
  decimals: string = 'auto'
) {
  if (decimals !== 'auto') {
    return parseInt(decimals)
  }
  return short
    ? Math.max(0, 3 - Math.min(3, round(y).toString().length))
    : showDecimals
      ? 1
      : 0
}

/**
 * Get formatted label text with optional prediction interval
 */
export function getLabelText(
  label: string,
  y: number,
  pi: { min: number, max: number } | undefined,
  short: boolean,
  isExcess: boolean,
  isPercentage: boolean,
  showDecimals: boolean,
  decimals: string = 'auto'
) {
  let result = label
  const prefix = label.length ? ': ' : ''
  const forcePlusSign = isExcess && !short
  const plusSign = forcePlusSign ? '' : '+'

  if (isPercentage) {
    const yText = asPercentage(
      y,
      getMaxDecimals(y * 100, short, showDecimals, decimals),
      plusSign
    )
    result += `${prefix}${yText}`
    if (pi)
      result += formatCI(short, pi.min, pi.max, n =>
        asPercentage(n, getMaxDecimals(y * 100, short, showDecimals, decimals), plusSign)
      )
  } else {
    const maxDecimals = getMaxDecimals(y, short, showDecimals, decimals)
    const yText = numberWithCommas(y, isExcess, maxDecimals)
    result += `${prefix}${yText}`

    if (pi) {
      const piText = formatCI(short, pi.min, pi.max, n =>
        numberWithCommas(n, isExcess, maxDecimals)
      )
      result += piText
    }
  }

  return result
}

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

/**
 * Create datalabels plugin configuration
 */
export function createDatalabelsConfig(
  data: MortalityChartData,
  showPi: boolean,
  isExcess: boolean,
  showPercentage: boolean,
  showDecimals: boolean,
  decimals: string,
  isDark?: boolean
) {
  return {
    anchor: 'end' as const,
    align: 'end' as const,
    display: (context: Context): boolean => {
      const showLabels = data.showLabels
      const hasLabels = context.dataset.label
        ? context.dataset.label.length > 0
        : false
      const x = context.dataset.data[context.dataIndex]
      if (
        x
        && typeof x === 'object'
        && isNaN((x as ChartErrorDataPoint).y)
      )
        return false
      const isErrorPoint = typeof x === 'object'
      const hasValue = !isNaN(x as number)
      return showLabels && hasLabels && (isErrorPoint || hasValue)
    },
    backgroundColor: bgColor,
    color: () => {
      return isDark ? '#ffffff' : '#000000'
    },
    formatter: (x: number | ChartErrorDataPoint) => {
      let label = ''
      const value = typeof x === 'number' ? x : x.y
      const val = x as ChartErrorDataPoint
      const min = val.yMin || val.yMinMin
      const max = val.yMax || val.yMaxMax
      const pi = showPi && min && max ? { min, max } : undefined
      label = getLabelText(
        label,
        value,
        pi,
        true,
        isExcess,
        showPercentage,
        showDecimals,
        decimals
      )
      return label
    },
    borderRadius: 3,
    padding: 2,
    font: getDatalabelsFont(),
    offset: 1.5
  }
}

/**
 * Create plugins configuration
 */
export function createPluginsConfig(
  data: MortalityChartData,
  isExcess: boolean,
  showPi: boolean,
  showPercentage: boolean,
  showDecimals: boolean,
  decimals: string,
  showQrCode: boolean,
  showLogo: boolean,
  isDark?: boolean
) {
  return {
    title: {
      display: true,
      text: data.title,
      color: textColor(isDark),
      font: getTitleFont()
    },
    subtitle: {
      display: true,
      text: data.subtitle,
      color: textSoftColor(isDark),
      font: getSubtitleFont(),
      position: 'bottom' as const
    },
    legend: {
      labels: {
        color: textColor(isDark),
        filter: (item: { text: string }): boolean => item.text.length > 0,
        font: getLegendFont()
      }
    },
    tooltip: {
      callbacks: createTooltipCallbacks(
        showPi,
        isExcess,
        showPercentage,
        showDecimals,
        decimals
      )
    },
    datalabels: createDatalabelsConfig(
      data,
      showPi,
      isExcess,
      showPercentage,
      showDecimals,
      decimals,
      isDark
    ),
    ...(showQrCode && data.url ? { qrCodeUrl: data.url } : {}),
    showLogo
  }
}

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
      type: data.isLogarithmic ? 'logarithmic' as const : 'linear' as const,
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
