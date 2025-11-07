import type {
  Chart,
  ChartDataset
} from 'chart.js'
import {
  getDatalabelsFont,
  getScaleTitleFont,
  getTicksFont
} from './chartStyling'
import {
  backgroundColor,
  getColorPalette,
  getGradientColor,
  textSoftColor,
  textStrongColor
} from './chartColors'
import { asPercentage, numberWithCommas, round } from './chartUtils'
import type {
  ChartJSConfig,
  ChartStyle,
  MatrixData,
  MatrixDatapoint,
  MortalityChartData,
  MortalityMatrixDataPoint
} from './chartTypes'
import type { Context } from 'chartjs-plugin-datalabels'
import type { MatrixDataPoint } from 'chartjs-chart-matrix'
import {
  createBackgroundPlugin,
  createOnResizeHandler,
  createPluginsConfig,
  createScalesConfig
} from './config'

/**
 * Creates a chart configuration based on the specified style and data type.
 *
 * This is the main entry point for generating Chart.js configurations.
 * It routes to the appropriate configuration builder based on the chart style.
 *
 * @param style - The chart style ('bar', 'line', or 'matrix')
 * @param data - Raw chart data containing datasets and labels
 * @param isDeathsType - Whether the data represents death counts
 * @param isExcess - Whether to show excess mortality
 * @param isLE - Whether the data represents life expectancy
 * @param isPopulationType - Whether the data represents population counts
 * @param showLabels - Whether to display data labels on the chart
 * @param showPercentage - Whether to format values as percentages
 * @param showPi - Whether to show prediction intervals
 * @returns Chart.js configuration object
 *
 * @example
 * ```typescript
 * const config = makeChartConfig(
 *   'bar',
 *   mortalityData,
 *   true,
 *   true,
 *   false,
 *   false,
 *   true,
 *   false,
 *   true
 * )
 * // Returns bar chart configuration with excess mortality and prediction intervals
 * ```
 */
export const makeChartConfig = (
  style: ChartStyle,
  data: Array<Record<string, unknown>>,
  isDeathsType: boolean,
  isExcess: boolean,
  isLE: boolean,
  isPopulationType: boolean,
  showLabels: boolean,
  showPercentage: boolean,
  showPi: boolean
): Record<string, unknown> => {
  // Cast from generic data structure to MortalityChartData
  // The caller is responsible for providing properly structured data
  const internalData = data as unknown as MortalityChartData
  if (style === 'matrix') {
    return makeMatrixChartConfig(
      internalData,
      isExcess,
      isLE,
      showPi,
      showPercentage,
      showLabels,
      isDeathsType,
      isPopulationType
    ) as unknown as Record<string, unknown>
  }
  return makeBarLineChartConfig(
    internalData,
    isExcess,
    showPi,
    showPercentage,
    isDeathsType,
    isPopulationType
  ) as unknown as Record<string, unknown>
}

/**
 * Creates a bar or line chart configuration for mortality data.
 *
 * Generates a complete Chart.js configuration with responsive layout, custom plugins,
 * scales, and data formatting. Supports feature gating for Pro users who can hide
 * watermarks and QR codes.
 *
 * @param data - Structured mortality chart data with datasets and labels
 * @param isExcess - Whether to display excess mortality calculations
 * @param showPi - Whether to show prediction intervals/error bars
 * @param showPercentage - Whether to format values as percentages
 * @param isDeathsType - Whether the data represents death counts (affects decimal display)
 * @param isPopulationType - Whether the data represents population (affects decimal display)
 * @param showQrCode - Whether to display QR code overlay (default: true)
 * @param showLogo - Whether to display logo watermark (default: true)
 * @param decimals - Decimal precision: 'auto', '0', '1', '2', or '3' (default: 'auto')
 * @param isDark - Whether to use dark mode styling
 * @param userTier - User subscription tier for feature gating (tier 2+ can hide watermarks)
 * @param showCaption - Whether to display chart caption (default: true)
 * @returns Complete Chart.js configuration object with plugins, scales, and data
 *
 * @example
 * ```typescript
 * const config = makeBarLineChartConfig(
 *   mortalityData,
 *   true,  // isExcess
 *   true,  // showPi
 *   false, // showPercentage
 *   true,  // isDeathsType
 *   false, // isPopulationType
 *   true,  // showQrCode
 *   true,  // showLogo
 *   'auto',
 *   false, // isDark
 *   2,     // userTier (Pro)
 *   true   // showCaption
 * )
 * // Returns bar/line chart with excess mortality, prediction intervals, and watermark
 * ```
 */
export const makeBarLineChartConfig = (
  data: MortalityChartData,
  isExcess: boolean,
  showPi: boolean,
  showPercentage: boolean,
  isDeathsType: boolean,
  isPopulationType: boolean,
  showQrCode: boolean = true,
  showLogo: boolean = true,
  decimals: string = 'auto',
  isDark?: boolean,
  userTier?: number,
  showCaption: boolean = true
) => {
  // Feature gating: Only Pro users (tier 2) can hide the watermark/QR code
  if (userTier !== undefined && userTier < 2) {
    showLogo = true
    showQrCode = true
  }

  const showDecimals = !isDeathsType && !isPopulationType

  // Logo and QR code plugins overlay the chart, so no padding needed for them
  // They draw at absolute positions in corners without affecting chart layout

  return {
    plugins: [createBackgroundPlugin(isDark)],
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        }
      },
      onResize: createOnResizeHandler(),
      plugins: createPluginsConfig(
        data,
        isExcess,
        showPi,
        showPercentage,
        showDecimals,
        decimals,
        showQrCode,
        showLogo,
        showCaption,
        data.ytitle.includes('Z-Score'), // Detect Z-scores from ytitle
        isDark
      ),
      scales: createScalesConfig(
        data,
        isExcess,
        showPercentage,
        showDecimals,
        decimals,
        isDark
      )
    },
    data: {
      datasets: data.datasets as ChartDataset<ChartStyle, (number | null)[]>[],
      labels: data.labels
    }
  }
}

/**
 * Creates a matrix/heatmap chart configuration for mortality data.
 *
 * Extends the bar/line configuration with matrix-specific features including:
 * - Custom x/y categorical scales
 * - Dynamic tile coloring based on gradient palettes
 * - Local vs global min/max normalization
 * - Configurable data labels with smart formatting
 *
 * Matrix charts are ideal for visualizing data across multiple jurisdictions and time periods.
 *
 * @param data - Structured mortality chart data with datasets and labels
 * @param isExcess - Whether to display excess mortality (affects color palette)
 * @param isLE - Whether the data represents life expectancy (affects formatting)
 * @param showPi - Whether to show prediction intervals
 * @param showPercentage - Whether to format values as percentages
 * @param showLabels - Whether to display data labels on matrix tiles
 * @param isDeathsType - Whether the data represents death counts (affects normalization)
 * @param isPopulationType - Whether the data represents population (affects normalization)
 * @param showQrCode - Whether to display QR code overlay (default: true)
 * @param showLogo - Whether to display logo watermark (default: true)
 * @param isDark - Whether to use dark mode styling (affects label colors)
 * @param decimals - Decimal precision: 'auto', '0', '1', '2', or '3' (default: 'auto')
 * @param userTier - User subscription tier for feature gating
 * @param showCaption - Whether to display chart caption (default: true)
 * @returns Chart.js matrix configuration with custom scales and tile coloring
 *
 * @example
 * ```typescript
 * const config = makeMatrixChartConfig(
 *   mortalityData,
 *   true,  // isExcess
 *   false, // isLE
 *   false, // showPi
 *   true,  // showPercentage
 *   true,  // showLabels
 *   false, // isDeathsType
 *   false, // isPopulationType
 *   true,  // showQrCode
 *   true,  // showLogo
 *   true,  // isDark
 *   '1',   // decimals
 *   1,     // userTier
 *   true   // showCaption
 * )
 * // Returns heatmap with excess mortality percentage and data labels
 * ```
 */
export const makeMatrixChartConfig = (
  data: MortalityChartData,
  isExcess: boolean,
  isLE: boolean,
  showPi: boolean,
  showPercentage: boolean,
  showLabels: boolean,
  isDeathsType: boolean,
  isPopulationType: boolean,
  showQrCode: boolean = true,
  showLogo: boolean = true,
  isDark?: boolean,
  decimals: string = 'auto',
  userTier?: number,
  showCaption: boolean = true
) => {
  const config = makeBarLineChartConfig(
    data,
    isExcess,
    showPi,
    showPercentage,
    isDeathsType,
    isPopulationType,
    showQrCode,
    showLogo,
    decimals,
    isDark,
    userTier,
    showCaption
  ) as unknown as ChartJSConfig<'matrix', MortalityMatrixDataPoint[]>

  config.options!.scales = {
    x: {
      title: {
        display: true,
        text: data.xtitle,
        color: textStrongColor(isDark),
        font: getScaleTitleFont()
      },
      type: 'category',
      labels: data.labels,
      ticks: {
        color: textSoftColor(isDark),
        font: getTicksFont()
      },
      grid: { display: false }
    },
    y: {
      title: {
        display: true,
        text: 'Jurisdiction',
        color: textStrongColor(isDark),
        font: getScaleTitleFont()
      },
      type: 'category',
      offset: true,
      ticks: {
        color: textSoftColor(isDark),
        font: getTicksFont()
      },
      grid: { display: false }
    }
  }
  const matrixData = makeMatrixData(data)
  // Capture isDark in closure for callbacks
  const bgColor = backgroundColor(isDark)
  const tileBackgroundColor = (context: Context) => {
    const datapoint = context.dataset.data[
      context.dataIndex
    ] as MortalityMatrixDataPoint
    const localMin = matrixData.localMinMax[datapoint.country]?.min || 0
    const localMax = matrixData.localMinMax[datapoint.country]?.max || 0
    const globalMin = matrixData.min
    const globalMax = matrixData.max
    const deathsOrPop = isDeathsType || isPopulationType
    let max = deathsOrPop ? localMax : globalMax
    let min = deathsOrPop ? localMin : globalMin
    if (isExcess) {
      if (showPercentage) max = Math.min(max, 1)
      if (Math.abs(max) > Math.abs(min)) min = -max
      if (Math.abs(min) < Math.abs(max)) max = -min
    }
    let value = (datapoint.v - min) / (max - min)
    if (isExcess && showPercentage) {
      value = Math.min(1, Math.max(-1, value))
    }
    if (isNaN(value)) return bgColor
    else
      return getGradientColor(
        getColorPalette(isPopulationType, isLE, isExcess),
        value
      )
  }
  config.options!.plugins!.datalabels = {
    display: (context: Context): boolean =>
      showLabels
      && !isNaN((context.dataset.data[context.dataIndex] as MatrixDatapoint).v),
    color: () => {
      // White in dark mode, black in light mode
      return isDark ? '#ffffff' : '#000000'
    },
    formatter: (x: { v: number }) => {
      if (showPercentage) {
        return asPercentage(x.v, data.labels.length > 15 ? 0 : 1)
      } else if (isLE) {
        return numberWithCommas(round(x.v, 1))
      } else {
        return isExcess
          ? numberWithCommas(round(x.v), true)
          : numberWithCommas(round(x.v))
      }
    },
    font: getDatalabelsFont()
  }
  config.data = {
    datasets: [
      {
        label: '',
        data: matrixData.data as MortalityMatrixDataPoint[],
        // Chart.js matrix plugin supports callback functions for colors
        // Type casting is necessary because ChartDataset type doesn't reflect this capability
        backgroundColor: tileBackgroundColor as unknown as string | CanvasGradient | CanvasPattern,
        borderColor: tileBackgroundColor as unknown as string | CanvasGradient | CanvasPattern,
        borderWidth: 1,
        width: ({ chart }: { chart: Chart }) =>
          (chart.chartArea || {}).width / data.labels.length,
        height: ({ chart }: { chart: Chart }) =>
          (chart.chartArea || {}).height
          / data.datasets.filter(a => a.label && a.label?.length > 0).length
      }
    ]
  }
  return config
}

/**
 * Transforms mortality chart data into matrix format.
 *
 * Converts the standard chart data structure (datasets with arrays of values)
 * into matrix data points with x, y coordinates and values. Also calculates:
 * - Global minimum and maximum values across all data
 * - Local minimum and maximum values per jurisdiction
 *
 * This data structure is required for the Chart.js matrix plugin and supports
 * both global and local normalization for heatmap coloring.
 *
 * @param chartData - Source mortality chart data with datasets and labels
 * @returns Matrix data with flattened data points and min/max statistics
 *
 * @example
 * ```typescript
 * const matrixData = makeMatrixData({
 *   datasets: [
 *     { label: 'USA', data: [100, 200, 150] },
 *     { label: 'CAN', data: [90, 180, 140] }
 *   ],
 *   labels: ['2020', '2021', '2022']
 * })
 * // Returns:
 * // {
 * //   data: [
 * //     { country: 'USA', x: '2020', y: 'USA', v: 100 },
 * //     { country: 'USA', x: '2021', y: 'USA', v: 200 },
 * //     ...
 * //   ],
 * //   min: 90,
 * //   max: 200,
 * //   localMinMax: {
 * //     'USA': { min: 100, max: 200 },
 * //     'CAN': { min: 90, max: 180 }
 * //   }
 * // }
 * ```
 */
const makeMatrixData = (chartData: MortalityChartData): MatrixData => {
  const data: MortalityMatrixDataPoint[] = []
  let min = Number.MAX_SAFE_INTEGER
  let max = Number.MIN_SAFE_INTEGER
  const localMinMax: Record<string, { min: number, max: number }> = {}

  for (const ds of chartData.datasets) {
    let i = 0
    let localMin = Number.MAX_SAFE_INTEGER
    let localMax = Number.MIN_SAFE_INTEGER
    for (const label of chartData.labels) {
      if (!ds.label || !ds.label?.length) continue
      const v = ds.data[i++] as number
      min = min > v ? v : min
      max = max < v ? v : max
      localMin = localMin > v ? v : localMin
      localMax = localMax < v ? v : localMax
      data.push({
        country: ds.label,
        x: label,
        y: ds.label,
        v
      })
    }
    if (ds.label) localMinMax[ds.label] = { min: localMin, max: localMax }
  }
  return { data: data as MatrixDataPoint[], min, max, localMinMax }
}
