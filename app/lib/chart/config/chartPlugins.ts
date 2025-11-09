/**
 * Chart Plugin Configuration Functions
 *
 * Functions for configuring Chart.js plugins (background, datalabels, legend, etc.)
 */

import type {
  CartesianScaleOptions,
  Chart,
  ScaleOptionsByType
} from 'chart.js'
import type { Context } from 'chartjs-plugin-datalabels'
import {
  bgColor,
  getDatalabelsFont,
  getLegendFont,
  getScaleTitleFont,
  getSubtitleFont,
  getTicksFont,
  getTitleFont
} from '../chartStyling'
import {
  backgroundColor,
  textColor,
  textSoftColor
} from '../chartColors'
import type { ChartErrorDataPoint, MortalityChartData } from '../chartTypes'
import { getLabelText } from './chartLabels'
import { createTooltipCallbacks } from './chartTooltips'
import { getChartView, type ReferenceLineConfig } from '../chartViews'
import type { ViewType } from '../../state/viewTypes'

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
 * Convert reference line configs from chart views to Chart.js annotations
 * Handles reference lines for any view (excess baseline, z-score lines, etc.)
 */
export function createAnnotationsFromReferenceLines(
  referenceLines: ReferenceLineConfig[]
): Record<string, {
  type: string
  yMin: number
  yMax: number
  borderColor: string
  borderWidth: number
  borderDash: number[]
  label: {
    display: boolean
    content: string
    position: string
    backgroundColor: string
    color: string
    font: {
      size: number
      weight: string
    }
    padding: number
  }
}> {
  const annotations: Record<string, {
    type: string
    yMin: number
    yMax: number
    borderColor: string
    borderWidth: number
    borderDash: number[]
    label: {
      display: boolean
      content: string
      position: string
      backgroundColor: string
      color: string
      font: {
        size: number
        weight: string
      }
      padding: number
    }
  }> = {}

  referenceLines.forEach((line, index) => {
    const key = `reference_line_${index}`
    annotations[key] = {
      type: 'line',
      yMin: line.value,
      yMax: line.value,
      borderColor: line.color,
      borderWidth: line.width || 1,
      borderDash: line.style === 'dashed' ? [5, 5] : [],
      label: {
        display: true,
        content: line.label,
        position: 'end',
        backgroundColor: 'transparent',
        color: line.color,
        font: {
          size: 10,
          weight: 'normal'
        },
        padding: 2
      }
    }
  })

  return annotations
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
  showCaption: boolean = true,
  view: string = 'mortality',
  isDark?: boolean
) {
  const basePlugins = {
    title: {
      display: true,
      text: data.title,
      color: textColor(isDark),
      font: getTitleFont()
    },
    subtitle: {
      display: showCaption,
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
    showLogo,
    isDarkMode: isDark
  }

  // Get reference lines from chart view configuration
  const chartView = getChartView((view as ViewType) || 'mortality')

  // For reference lines, we need a minimal context
  // Most reference lines only need isDark, not the full context
  const minimalContext = {
    countries: [],
    type: '',
    ageGroups: [],
    standardPopulation: '',
    cumulative: false,
    showBaseline: false,
    showPredictionInterval: false,
    showTotal: false,
    chartType: '',
    baselineMethod: '',
    baselineDateFrom: '',
    baselineDateTo: '',
    view: (view as ViewType) || 'mortality'
  }

  const referenceLines = chartView.referenceLines?.(minimalContext, isDark ?? false) || []

  // Add reference line annotations if any are defined
  if (referenceLines.length > 0) {
    return {
      ...basePlugins,
      annotation: {
        annotations: createAnnotationsFromReferenceLines(referenceLines)
      }
    }
  }

  return basePlugins
}
