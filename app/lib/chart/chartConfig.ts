import type {
  CartesianScaleOptions,
  Chart,
  ChartDataset,
  LegendItem,
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
  getColorPalette,
  getGradientColor,
  isLightColor,
  textColor,
  textSoftColor,
  textStrongColor
} from './chartColors'
import { asPercentage, numberWithCommas, round } from './chartUtils'
import type {
  ChartErrorDataPoint,
  ChartJSConfig,
  ChartStyle,
  MatrixData,
  MatrixDatapoint,
  MortalityChartData,
  MortalityMatrixDataPoint
} from './chartTypes'
import type { Context } from 'chartjs-plugin-datalabels'
import type { MatrixDataPoint } from 'chartjs-chart-matrix'

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
  const internalData = data as unknown as MortalityChartData
  if (style == 'matrix') {
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
  } else
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
  isPopulationType: boolean
) => {
  const showDecimals = !isDeathsType && !isPopulationType
  return {
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 10 },
      onResize: (chart: Chart) => {
        chart.options.plugins!.title!.font! = getTitleFont()
        chart.options.plugins!.subtitle!.font! = getSubtitleFont()
        chart.options.plugins!.legend!.labels!.font! = getLegendFont()
        ;(
          chart.options.scales!.x! as ScaleOptionsByType<'radialLinear'>
        ).ticks.font! = getTicksFont()
        ;(chart.options.scales!.x! as CartesianScaleOptions).title.font
          = getScaleTitleFont()
        ;(
          chart.options.scales!.y! as ScaleOptionsByType<'radialLinear'>
        ).ticks.font! = getTicksFont()
        ;(chart.options.scales!.y! as CartesianScaleOptions).title.font
          = getScaleTitleFont()
        chart.options.plugins!.datalabels!.font! = getDatalabelsFont()
      },
      plugins: {
        title: {
          display: true,
          text: data.title,
          color: textColor(),
          font: getTitleFont()
        },
        subtitle: {
          display: true,
          text: data.subtitle,
          color: textStrongColor(),
          font: getSubtitleFont(),
          position: 'bottom'
        },
        legend: {
          labels: {
            color: textColor(),
            filter: (item: LegendItem): boolean => item.text.length > 0,
            font: getLegendFont()
          }
        },
        tooltip: {
          callbacks: {
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
                showDecimals
              )
              return label
            }
          }
        },
        datalabels: {
          anchor: 'end',
          align: 'end',
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
          color: (context: Context) =>
            textColor(isLightColor(bgColor(context))),
          formatter: (x: number | ChartErrorDataPoint) => {
            let label = ''
            const value = typeof x == 'number' ? x : x.y
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
              showDecimals
            )
            return label
          },
          borderRadius: 3,
          padding: 2,
          font: getDatalabelsFont(),
          offset: 1.5
        },
        qrCodeUrl: data.url
      },
      scales: {
        x: {
          offset: data.showXOffset,
          title: {
            display: true,
            text: data.xtitle,
            color: textStrongColor(),
            font: getScaleTitleFont()
          },
          grid: {
            color: borderColor()
          },
          ticks: {
            color: textSoftColor(),
            font: getTicksFont()
          }
        },
        y: {
          type: data.isLogarithmic ? 'logarithmic' : 'linear',
          beginAtZero: data.isMaximized,
          title: {
            display: true,
            text: data.ytitle,
            color: textStrongColor(),
            font: getScaleTitleFont()
          },
          grid: {
            lineWidth: (context: { tick: string }) => {
              return context.tick ? 2 : 1
            },
            color: borderColor()
          },
          ticks: {
            color: textSoftColor(),
            font: getTicksFont(),
            callback: function (
              this: Scale,
              tickValue: number | string
            ): string {
              return getLabelText(
                '',
                typeof tickValue == 'string' ? parseInt(tickValue) : tickValue,
                undefined,
                true,
                isExcess,
                showPercentage,
                showDecimals
              )
            }
          }
        }
      }
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
  isPopulationType: boolean
) => {
  const config = makeBarLineChartConfig(
    data,
    isExcess,
    showPi,
    showPercentage,
    isDeathsType,
    isPopulationType
  ) as unknown as ChartJSConfig<'matrix', MortalityMatrixDataPoint[]>

  config.options!.scales = {
    x: {
      title: {
        display: true,
        text: data.xtitle,
        color: textStrongColor(),
        font: getScaleTitleFont()
      },
      type: 'category',
      labels: data.labels,
      ticks: {
        color: textSoftColor(),
        font: getTicksFont()
      },
      grid: { display: false }
    },
    y: {
      title: {
        display: true,
        text: 'Jurisdiction',
        color: textStrongColor(),
        font: getScaleTitleFont()
      },
      type: 'category',
      offset: true,
      ticks: {
        color: textSoftColor(),
        font: getTicksFont()
      },
      grid: { display: false }
    }
  }
  const matrixData = makeMatrixData(data)
  const tileBackgroundColor = (context: Context) => {
    const datapoint = context.dataset.data[
      context.dataIndex
    ] as MortalityMatrixDataPoint
    const localMin = matrixData.localMinMax[datapoint.country].min
    const localMax = matrixData.localMinMax[datapoint.country].max
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
    if (isNaN(value)) return backgroundColor()
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
    color: (context: Context) => {
      const color = tileBackgroundColor(context)
      const isLight = isLightColor(color)
      return textColor(isLight)
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
        backgroundColor: tileBackgroundColor,
        borderColor: tileBackgroundColor,
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

const formatCI = (
  short: boolean,
  min: number,
  max: number,
  formatFn: (n: number) => string
) =>
  short
    ? ` (${formatFn(min)}, ${formatFn(max)})`
    : ` [95% PI: ${formatFn(min)}, ${formatFn(max)}]`

const getMaxDecimals = (y: number, short: boolean, showDecimals: boolean) =>
  short
    ? Math.max(0, 3 - Math.min(3, round(y).toString().length))
    : showDecimals
      ? 1
      : 0

const getLabelText = (
  label: string,
  y: number,
  pi: { min: number, max: number } | undefined,
  short: boolean,
  isExcess: boolean,
  isPercentage: boolean,
  showDecimals: boolean
) => {
  let result = label
  const prefix = label.length ? ': ' : ''
  const forcePlusSign = isExcess && !short
  const plusSign = forcePlusSign ? '' : '+'

  if (isPercentage) {
    const yText = asPercentage(
      y,
      getMaxDecimals(y * 100, short, showDecimals),
      plusSign
    )
    result += `${prefix}${yText}`
    if (pi)
      result += formatCI(short, pi.min, pi.max, n =>
        asPercentage(n, getMaxDecimals(y * 100, short, showDecimals), plusSign)
      )
  } else {
    const maxDecimals = getMaxDecimals(y, short, showDecimals)
    const yText = numberWithCommas(y, isExcess, maxDecimals)
    result += `${prefix}${yText}`

    if (pi) {
      const piText = formatCI(short, pi.min, pi.max, n =>
        numberWithCommas(n, isExcess, maxDecimals)
      )
      result += isExcess ? `${piText}` : `${piText}`
    }
  }

  return result
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
