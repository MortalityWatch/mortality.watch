/**
 * Custom Datalabels Plugin
 *
 * A minimal Chart.js plugin that draws labels above data points.
 * Replaces chartjs-plugin-datalabels to fix SSR/client parity issues.
 *
 * @see https://github.com/chartjs/chartjs-plugin-datalabels/issues/422
 */

import type { Chart, ChartType, Plugin } from 'chart.js'
import { getLabelText } from './config/chartLabels'

export interface CustomDatalabelsConfig {
  /** Whether labels should be displayed */
  showLabels?: boolean
  /** Text color */
  textColor?: string
  /** Border radius for background box */
  borderRadius?: number
  /** Padding inside background box */
  padding?: number
  /** Offset from data point */
  offset?: number
  /** Font configuration */
  font?: {
    size?: number
    weight?: number | 'normal' | 'bold' | 'lighter' | 'bolder'
    family?: string
  }
  /** Anchor position relative to data point */
  anchor?: 'start' | 'center' | 'end'
  /** Alignment of label relative to anchor */
  align?: 'start' | 'center' | 'end' | 'top' | 'bottom' | 'left' | 'right'
  /**
   * Chart style for positioning adjustments
   * - 'bar': Labels above/below bars
   * - 'line': Labels above points
   * - 'matrix': Labels centered on cells
   */
  chartStyle?: 'bar' | 'line' | 'matrix'
  /** Whether this is SSR rendering (for offset adjustments) */
  isSSR?: boolean
  /**
   * Formatter config - static values to avoid Chart.js trying to resolve functions
   * The plugin will use these to format labels internally
   */
  formatterConfig?: {
    showPi?: boolean
    isExcess?: boolean
    showPercentage?: boolean
    showDecimals?: boolean
    decimals?: number
  }
}

export interface DatalabelContext {
  chart: Chart
  dataIndex: number
  datasetIndex: number
  dataset: {
    label?: string
    backgroundColor?: string | string[]
    data: unknown[]
  }
}

/**
 * Get the y-position for a data point
 */
function getYPosition(
  chart: Chart,
  datasetIndex: number,
  dataIndex: number
): number | null {
  const meta = chart.getDatasetMeta(datasetIndex)
  if (!meta || !meta.data || !meta.data[dataIndex]) return null

  const element = meta.data[dataIndex]
  // For bar charts, use the top of the bar; for line charts, use the point position
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const y = (element as any).y
  return typeof y === 'number' && !isNaN(y) ? y : null
}

/**
 * Get the x-position for a data point
 */
function getXPosition(
  chart: Chart,
  datasetIndex: number,
  dataIndex: number
): number | null {
  const meta = chart.getDatasetMeta(datasetIndex)
  if (!meta || !meta.data || !meta.data[dataIndex]) return null

  const element = meta.data[dataIndex]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const x = (element as any).x
  return typeof x === 'number' && !isNaN(x) ? x : null
}

/**
 * Format a datalabel value using the formatter config
 */
function formatDatalabelValue(
  dataPoint: number | { y: number, yMin?: number, yMax?: number, yMinMin?: number, yMaxMax?: number },
  config?: CustomDatalabelsConfig['formatterConfig']
): string {
  const value = typeof dataPoint === 'number' ? dataPoint : dataPoint.y
  if (value === undefined || value === null) return ''

  const showPi = config?.showPi ?? false
  const isExcess = config?.isExcess ?? false
  const showPercentage = config?.showPercentage ?? false
  const showDecimals = config?.showDecimals ?? true
  const decimals = config?.decimals ?? 1

  let pi: { min: number, max: number } | undefined
  if (showPi && typeof dataPoint === 'object') {
    const min = dataPoint.yMin ?? dataPoint.yMinMin
    const max = dataPoint.yMax ?? dataPoint.yMaxMax
    if (min !== undefined && max !== undefined) {
      pi = { min, max }
    }
  }

  return getLabelText(
    '',
    value,
    pi,
    true, // showValue
    isExcess,
    showPercentage,
    showDecimals,
    decimals
  )
}

/**
 * Custom Datalabels Plugin
 *
 * Draws labels above data points with background boxes.
 * Uses consistent positioning logic for both SSR and client rendering.
 */
export const customDatalabelsPlugin: Plugin<ChartType> = {
  id: 'customDatalabels',

  afterDatasetsDraw(chart: Chart) {
    const ctx = chart.ctx
    if (!ctx) return

    // Get options from chart config (Chart.js passes them through options.plugins)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options = (chart.options.plugins as any)?.customDatalabels as CustomDatalabelsConfig | undefined
    if (!options) return

    const {
      borderRadius = 3,
      padding = 4,
      offset = 1.5,
      font = { size: 10, weight: 'bold' }
    } = options

    // Set font once for consistent measurements
    const fontStyle = `${font.weight || 'bold'} ${font.size || 10}px sans-serif`
    ctx.font = fontStyle
    ctx.textBaseline = 'bottom'
    ctx.textAlign = 'center'

    // Iterate through each dataset
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex)
      if (!meta.visible) return

      // Iterate through each data point
      dataset.data.forEach((value, dataIndex) => {
        // Check if label should be displayed
        if (options.showLabels === false) return

        // Detect matrix data (has 'v' property instead of 'y')
        const isMatrixData = value && typeof value === 'object' && 'v' in value

        // Skip datasets without labels (except matrix which uses country)
        if (!isMatrixData) {
          const hasLabel = dataset.label && dataset.label.length > 0
          if (!hasLabel) return
        }

        // Get numeric value - handle matrix (v), object (y), or number
        let numValue: number | undefined
        if (isMatrixData) {
          numValue = (value as { v: number }).v
        } else if (typeof value === 'number') {
          numValue = value
        } else if (value && typeof value === 'object' && 'y' in value) {
          numValue = (value as { y: number }).y
        }

        // Skip NaN/undefined values
        if (numValue === undefined || numValue === null || isNaN(numValue)) return

        // Get position
        const x = getXPosition(chart, datasetIndex, dataIndex)
        const y = getYPosition(chart, datasetIndex, dataIndex)
        if (x === null || y === null) return

        // Format label text
        let text = ''
        if (isMatrixData) {
          // Matrix: format the 'v' value
          text = formatDatalabelValue(numValue, options.formatterConfig)
        } else if (typeof value === 'number') {
          text = formatDatalabelValue(value, options.formatterConfig)
        } else if (value && typeof value === 'object' && 'y' in value) {
          text = formatDatalabelValue(value as { y: number, yMin?: number, yMax?: number, yMinMin?: number, yMaxMax?: number }, options.formatterConfig)
        }

        if (!text) return

        // Measure text
        const textMetrics = ctx.measureText(text)
        const textWidth = textMetrics.width
        const fontSize = font.size || 10

        // Calculate background box dimensions
        const boxWidth = textWidth + padding * 2
        const boxHeight = fontSize + padding * 2

        // Calculate position adjustments based on chart style and SSR
        // Note: increasing offset moves label AWAY from data point (higher for positive values)
        const chartStyle = options.chartStyle || 'line'

        const adjustedOffset = chartStyle === 'line' ? offset + 3 : offset

        // Determine if value is negative (for positioning below bar)
        const isNegative = numValue < 0

        // Position label based on chart style
        let labelX = x
        let labelY: number

        if (isMatrixData) {
          // Matrix: center label on cell (both horizontally and vertically)
          const element = meta.data[dataIndex]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cellWidth = (element as any).width || 40
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cellHeight = (element as any).height || 20
          // x is left edge of cell, so add half cell width to center
          labelX = x + cellWidth / 2
          labelY = y + (cellHeight - boxHeight) / 2
        } else if (isNegative) {
          // Below the bar for negative values
          labelY = y + adjustedOffset
        } else {
          // Above the bar/point for positive values
          labelY = y - adjustedOffset - boxHeight
        }

        // Get colors - derive background from dataset color
        let bgColor = 'rgba(0,0,0,0.1)'
        const datasetBg = dataset.backgroundColor
        if (typeof datasetBg === 'string') {
          bgColor = `${datasetBg.slice(0, 7)}88`
        }
        const labelTextColor = options.textColor || '#000000'

        // Draw background box with rounded corners
        ctx.save()
        ctx.fillStyle = bgColor
        ctx.beginPath()

        const boxX = labelX - boxWidth / 2
        const boxY = labelY

        if (borderRadius > 0) {
          // Rounded rectangle
          const r = Math.min(borderRadius, boxWidth / 2, boxHeight / 2)
          ctx.moveTo(boxX + r, boxY)
          ctx.lineTo(boxX + boxWidth - r, boxY)
          ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + r)
          ctx.lineTo(boxX + boxWidth, boxY + boxHeight - r)
          ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - r, boxY + boxHeight)
          ctx.lineTo(boxX + r, boxY + boxHeight)
          ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - r)
          ctx.lineTo(boxX, boxY + r)
          ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY)
        } else {
          ctx.rect(boxX, boxY, boxWidth, boxHeight)
        }

        ctx.closePath()
        ctx.fill()
        ctx.restore()

        // Draw text centered in box
        ctx.save()
        ctx.fillStyle = labelTextColor
        ctx.font = fontStyle
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        // Text center = box center
        const textY = boxY + boxHeight / 2
        ctx.fillText(text, labelX, textY)
        ctx.restore()
      })
    })
  }
}

/**
 * Get the custom datalabels plugin
 */
export function getCustomDatalabelsPlugin(): Plugin<ChartType> {
  return customDatalabelsPlugin
}
