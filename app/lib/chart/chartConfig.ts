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
} from './chartConfigHelpers'

// Public API
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
  userTier?: number
) => {
  // Feature gating: Only Pro users (tier 2) can hide the watermark/QR code
  if (userTier !== undefined && userTier < 2) {
    showLogo = true
    showQrCode = true
  }

  const showDecimals = !isDeathsType && !isPopulationType

  return {
    plugins: [createBackgroundPlugin(isDark)],
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 70, // Space for logo (60px + 10px margin)
          right: 70, // Space for QR code (60px + 10px margin)
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
  userTier?: number
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
    userTier
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
