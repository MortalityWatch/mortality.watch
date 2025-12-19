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
import type { CustomDatalabelsConfig } from '../customDatalabelsPlugin'
import {
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
import type { MortalityChartData } from '../chartTypes'
import { resolveDecimals } from './chartLabels'
import { createTooltipCallbacks } from './chartTooltips'
import { getChartView, type ReferenceLineConfig } from '../chartViews/index'
import type { ViewType } from '../../state'

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customDatalabels = (chart.options.plugins as any)?.customDatalabels
    if (customDatalabels) {
      customDatalabels.font = getDatalabelsFont()
    }
  }
}

/**
 * Create datalabels plugin configuration
 *
 * @param data - Chart data
 * @param showPi - Whether to show prediction intervals
 * @param isExcess - Whether showing excess mortality
 * @param showPercentage - Whether to format as percentages
 * @param showDecimals - Whether to show decimal places
 * @param decimals - Decimal precision
 * @param isDark - Dark mode flag
 * @param isSSR - Server-side rendering flag (applies font metric adjustments)
 * @param chartStyle - Chart style for positioning adjustments
 * @param isCountType - Whether the data is a count type (deaths/population) that should use 0 decimals
 */
export function createDatalabelsConfig(
  data: MortalityChartData,
  showPi: boolean,
  isExcess: boolean,
  showPercentage: boolean,
  showDecimals: boolean,
  decimals: string,
  isDark?: boolean,
  isSSR?: boolean,
  chartStyle?: 'bar' | 'line' | 'matrix',
  isCountType: boolean = false
): CustomDatalabelsConfig {
  // Compute chart-wide precision for consistent label display
  const resolvedDecimals = resolveDecimals(data, decimals, showPercentage, isCountType)

  return {
    anchor: 'end' as const,
    align: 'end' as const,
    showLabels: data.showLabels,
    textColor: isDark ? '#ffffff' : '#000000',
    chartStyle,
    isSSR,
    formatterConfig: {
      showPi,
      isExcess,
      showPercentage,
      showDecimals,
      decimals: typeof resolvedDecimals === 'number' ? resolvedDecimals : parseInt(resolvedDecimals, 10)
    },
    borderRadius: 3,
    padding: 2,
    font: getDatalabelsFont(),
    offset: 1.5
  }
}

/**
 * Annotation configuration types for Chart.js annotation plugin
 */
interface BoxAnnotation {
  type: 'box'
  drawTime?: 'beforeDraw' | 'beforeDatasetsDraw' | 'afterDatasetsDraw' | 'afterDraw'
  yMin?: number
  yMax?: number
  backgroundColor?: string
  borderWidth?: number
  borderColor?: string
  z?: number
}

interface LineAnnotation {
  type: 'line'
  drawTime?: 'beforeDraw' | 'beforeDatasetsDraw' | 'afterDatasetsDraw' | 'afterDraw'
  yMin?: number
  yMax?: number
  borderColor?: string
  borderWidth?: number
  borderDash?: number[]
  z?: number
  label?: {
    display: boolean
    content: string
    position: string
    backgroundColor: string
    color?: string
    font: {
      size: number
      weight: string
    }
    padding: number
    yAdjust?: number
  }
}

type ChartAnnotation = BoxAnnotation | LineAnnotation

/**
 * Convert reference line configs from chart views to Chart.js annotations
 * Handles both lines and box (shaded area) annotations
 */
export function createAnnotationsFromReferenceLines(
  referenceLines: ReferenceLineConfig[]
): Record<string, ChartAnnotation> {
  const annotations: Record<string, ChartAnnotation> = {}

  referenceLines.forEach((line, index) => {
    const key = `reference_${line.type || 'line'}_${index}`

    if (line.type === 'box') {
      // Box annotation (shaded area)
      annotations[key] = {
        type: 'box',
        drawTime: line.drawTime || 'beforeDatasetsDraw',
        yMin: line.yMin,
        yMax: line.yMax,
        backgroundColor: line.backgroundColor,
        borderWidth: line.borderWidth ?? 0,
        borderColor: line.color || 'transparent',
        z: line.z ?? -1
      }
    } else {
      // Line annotation (default)
      annotations[key] = {
        type: 'line',
        drawTime: line.drawTime,
        yMin: line.value,
        yMax: line.value,
        borderColor: line.color,
        borderWidth: line.width || 1,
        borderDash: line.style === 'dashed' ? [5, 5] : [],
        z: line.z,
        label: {
          display: !!line.label,
          content: line.label,
          position: 'end',
          yAdjust: -4,
          backgroundColor: 'transparent',
          color: line.color,
          font: {
            size: 10,
            weight: 'normal'
          },
          padding: 2
        }
      }
    }
  })

  return annotations
}

/**
 * Create plugins configuration
 *
 * @param data - Chart data
 * @param isExcess - Whether showing excess mortality
 * @param showPi - Whether to show prediction intervals
 * @param showPercentage - Whether to format as percentages
 * @param showDecimals - Whether to show decimal places
 * @param decimals - Decimal precision
 * @param showQrCode - Whether to show QR code
 * @param showLogo - Whether to show logo
 * @param showCaption - Whether to show caption
 * @param view - Chart view type
 * @param isDark - Dark mode flag
 * @param isSSR - Server-side rendering flag (applies font metric adjustments)
 * @param chartStyle - Chart style for label positioning
 * @param isCountType - Whether the data is a count type (deaths/population) that should use 0 decimals
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
  showTitle: boolean = true,
  view: string = 'mortality',
  isDark?: boolean,
  isSSR?: boolean,
  chartStyle?: 'bar' | 'line' | 'matrix',
  isCountType: boolean = false
) {
  const basePlugins = {
    title: {
      display: showTitle,
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
    customDatalabels: createDatalabelsConfig(
      data,
      showPi,
      isExcess,
      showPercentage,
      showDecimals,
      decimals,
      isDark,
      isSSR,
      chartStyle,
      isCountType
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
