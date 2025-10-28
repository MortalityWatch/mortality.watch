/**
 * Chart label builders
 */

import { baselineMethods, type ChartLabels } from '~/model'
import { isMobile } from '~/utils'

const asmrTitles: Record<string, string> = {
  who: 'WHO Standard Population',
  esp: 'European Standard Population',
  usa: 'U.S. Standard Population'
}

const getASMRTitle = (countries: string[], standardPopulation: string) => {
  if (standardPopulation === 'country') {
    return `${countries.join(',')} 2020 Standard Population`
  }
  const title = asmrTitles[standardPopulation]
  if (!title) {
    throw new Error('Uncrecognized standard population key.')
  }
  return title
}

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

/**
 * Label configuration for different metric types
 */
interface LabelConfig {
  getTitleParts: (ag: string, isExcess: boolean) => string[]
  getYTitle: (isExcess: boolean, cumulative: boolean) => string
  getSubtitle?: (asmrTitle: string, showBaseline: boolean) => string
}

const LABEL_CONFIGS: Record<string, LabelConfig> = {
  population: {
    getTitleParts: ag => [`Population${ag}`],
    getYTitle: () => 'People'
  },
  deaths: {
    getTitleParts: (ag, isExcess) =>
      isExcess ? [`Excess Deaths${ag}`] : [`Deaths${ag}`],
    getYTitle: (isExcess, cumulative) =>
      isExcess
        ? cumulative ? 'Cum. Excess Deaths' : 'Excess Deaths'
        : 'Deaths'
  },
  cmr: {
    getTitleParts: (ag, isExcess) =>
      isExcess
        ? ['Crude Excess', `Mortality${ag}`]
        : ['Crude', `Mortality Rate${ag}`],
    getYTitle: isExcess =>
      isExcess ? 'Excess Deaths per 100k' : 'Deaths per 100k'
  },
  asmr: {
    getTitleParts: (_, isExcess) =>
      isExcess
        ? ['Age-Standardized', 'Excess Mortality']
        : ['Age-Standardized', 'Mortality Rate'],
    getYTitle: isExcess =>
      isExcess ? 'Excess Deaths per 100k' : 'Deaths per 100k',
    getSubtitle: (asmrTitle, showBaseline) =>
      showBaseline ? [asmrTitle].filter(x => x).join(' · ') : asmrTitle
  },
  le: {
    getTitleParts: (_, isExcess) =>
      isExcess ? ['Change in', 'Life Expectancy'] : ['Life Expectancy'],
    getYTitle: () => 'Years',
    getSubtitle: () => 'Based on WHO2015 Std. Pop.'
  }
}

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
  chartType: string
): ChartLabels => {
  const title = []
  let subtitle = ''
  let xtitle = ''
  let ytitle = 'Deaths per 100k'
  const asmrTitle = getASMRTitle(countries, standardPopulation)

  // Display age group in title, if single age group and multiple countries.
  let ag = ''
  if (ageGroups.length === 1 && ageGroups[0] !== 'all') {
    ag = ` [${ageGroups[0]}]`
  }

  const pi = showPredictionInterval ? '95% Prediction Interval' : ''

  if (cumulative) title.push('Cumulative')

  // Get label configuration for the metric type
  const config = LABEL_CONFIGS[type]
  if (config) {
    title.push(...config.getTitleParts(ag, isExcess))
    ytitle = config.getYTitle(isExcess, cumulative)
    if (config.getSubtitle) {
      subtitle = config.getSubtitle(asmrTitle, showBaseline)
    }
  }

  subtitle = [
    subtitle,
    showBaseline
      ? blDescription(baselineMethod, baselineDateFrom, baselineDateTo)
      : ''
  ]
    .filter(x => x)
    .join(' · ')

  if (showBaseline && showPredictionInterval) {
    subtitle = [subtitle, pi].filter(x => x).join(' · ')
  }

  if (showTotal) {
    // Cumulative Total
    xtitle = ''
  } else {
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
  if (isMobile()) {
    return { title, subtitle, xtitle, ytitle }
  } else {
    return { title: [title.join(' ')], subtitle, xtitle, ytitle }
  }
}
