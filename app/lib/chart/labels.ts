/**
 * Chart label builders
 */

import { baselineMethods, type ChartLabels } from '~/model'
import { isMobile } from '~/utils'
import { getChartView, type ChartContext } from './chartViews/index'
import type { ViewType } from '../state'

const getMethodDescription = (baselineMethod: string) =>
  baselineMethods.filter(x => x.value === baselineMethod)[0]?.name ?? baselineMethod

export const blDescription = (
  baselineMethod: string,
  baselineDateFrom: string,
  baselineDateTo: string
) =>
  baselineMethod === 'naive'
    ? `Baseline: ${getMethodDescription(baselineMethod)} ${baselineDateTo}`
    : `Baseline: ${getMethodDescription(baselineMethod)} ${baselineDateFrom}-${baselineDateTo}`

export const getChartLabels = (
  countries: string[],
  standardPopulation: string,
  ageGroups: string[],
  showPredictionInterval: boolean,
  isExcess: boolean,
  type: string,
  cumulative: boolean,
  showBaseline: boolean,
  baselineMethod: string,
  baselineDateFrom: string,
  baselineDateTo: string,
  showTotal: boolean,
  chartType: string,
  view?: string
): ChartLabels => {
  // Derive view from parameters if not explicitly provided
  // This maintains backward compatibility with isExcess parameter
  const derivedView: ViewType = view
    ? (view as ViewType)
    : isExcess
      ? 'excess'
      : 'mortality'

  // Build chart context for view-based configuration
  const ctx: ChartContext = {
    countries,
    type,
    ageGroups,
    standardPopulation,
    cumulative,
    showBaseline,
    showPredictionInterval,
    showTotal,
    chartType,
    baselineMethod,
    baselineDateFrom,
    baselineDateTo,
    view: derivedView
  }

  // Get chart view configuration
  const chartView = getChartView(ctx.view)

  // Generate title from view configuration
  const title = chartView.getTitleParts(ctx)

  // Generate subtitle from view configuration
  let subtitle = chartView.getSubtitle?.(ctx) || ''

  // Generate Y-axis label from view configuration
  const ytitle = typeof chartView.yAxisLabel === 'function'
    ? chartView.yAxisLabel(ctx)
    : chartView.yAxisLabel

  // Generate X-axis label (chart type specific)
  let xtitle = ''

  if (showTotal) {
    // Cumulative Total
    xtitle = ''
  } else {
    // Chart type specific X-axis labels and subtitle additions
    switch (chartType) {
      case 'weekly_104w_sma':
        subtitle = ['104 week moving average (SMA)', subtitle]
          .filter(x => x)
          .join(' · ')
        xtitle = 'Week of Year'
        break
      case 'weekly_52w_sma':
        subtitle = ['52 week moving average (SMA)', subtitle]
          .filter(x => x)
          .join(' · ')
        xtitle = 'Week of Year'
        break
      case 'weekly_26w_sma':
        subtitle = ['26 week moving average (SMA)', subtitle]
          .filter(x => x)
          .join(' · ')
        xtitle = 'Week of Year'
        break
      case 'weekly_13w_sma':
        subtitle = ['13 week moving average (SMA)', subtitle]
          .filter(x => x)
          .join(' · ')
        xtitle = 'Week of Year'
        break
      case 'midyear':
        subtitle = ['7/1-6/30', subtitle].filter(x => x).join(' · ')
        xtitle = 'Year'
        break
      case 'fluseason':
        subtitle = ['10/1-9/30', subtitle].filter(x => x).join(' · ')
        xtitle = 'Year'
        break
      case 'weekly':
        xtitle = 'Week of Year'
        break
      case 'monthly':
        xtitle = 'Month of Year'
        break
      case 'quarterly':
        xtitle = 'Quarter of Year'
        break
      case 'yearly':
        subtitle = [subtitle].filter(x => x).join(' · ')
        xtitle = 'Year'
        break
    }
  }

  // Format title based on device (mobile vs desktop)
  if (isMobile()) {
    return { title, subtitle, xtitle, ytitle }
  } else {
    return { title: [title.join(' ')], subtitle, xtitle, ytitle }
  }
}
