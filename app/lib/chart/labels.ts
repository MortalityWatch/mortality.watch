/**
 * Chart label builders
 */

import { baselineMethods, type ChartLabels } from '~/model'
import { isMobile } from '~/utils'

const getASMRTitle = (countries: string[], standardPopulation: string) => {
  const result = 'Standard Population'
  switch (standardPopulation) {
    case 'who':
      return `WHO ${result}`
    case 'esp':
      return `European ${result}`
    case 'usa':
      return `U.S. ${result}`
    case 'country':
      return `${countries.join(',')} 2020 ${result}`
    default:
      throw new Error('Uncrecognized standard population key.')
  }
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

  if (isExcess) {
    switch (type) {
      case 'deaths':
        title.push(`Excess Deaths${ag}`)
        ytitle = cumulative ? 'Cum. Excess Deaths' : 'Excess Deaths'
        break
      case 'cmr':
        title.push(`Crude Excess`, `Mortality${ag}`)
        ytitle = 'Excess Deaths per 100k'
        break
      case 'asmr':
        title.push('Age-Standardized', 'Excess Mortality')
        subtitle = [asmrTitle].filter(x => x).join(' · ')
        ytitle = 'Excess Deaths per 100k'
        break
      case 'le':
        title.push('Change in', 'Life Expectancy')
        subtitle = 'Based on WHO2015 Std. Pop.'
        ytitle = 'Years'
        break
    }
  } else {
    switch (type) {
      case 'population':
        title.push(`Population${ag}`)
        ytitle = 'People'
        break
      case 'deaths':
        title.push(`Deaths${ag}`)
        ytitle = 'Deaths'
        break
      case 'cmr':
        title.push(`Crude`, `Mortality Rate${ag}`)
        break
      case 'asmr':
        title.push('Age-Standardized', 'Mortality Rate')
        subtitle = showBaseline
          ? [asmrTitle].filter(x => x).join(' · ')
          : asmrTitle
        break
      case 'le':
        title.push('Life Expectancy')
        ytitle = 'Years'
        subtitle = 'Based on WHO2015 Std. Pop.'
        break
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
