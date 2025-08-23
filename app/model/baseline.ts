import { parseFourDigitNumber, right } from '@/utils'

export const getSeasonString = (chartType: string, blStartYear: number) => {
  switch (chartType) {
    case 'weekly':
    case 'weekly_104w_sma':
    case 'weekly_52w_sma':
    case 'weekly_26w_sma':
    case 'weekly_13w_sma':
      return `${blStartYear} W01`
    case 'monthly':
      return `${blStartYear} Jan`
    case 'quarterly':
      return `${blStartYear} Q1`
    case 'midyear':
    case 'fluseason':
      return `${blStartYear - 1}/${right(blStartYear.toString(), 2)}`
    default:
      return `${blStartYear}`
  }
}

export const defaultBaselineFromDate = (
  chartType: string,
  allChartLabels: string[],
  baselineMethod: string
) => {
  const blStartYear = baselineStartYear(allChartLabels, baselineMethod)
  const result = getSeasonString(chartType, blStartYear)
  if (allChartLabels && !allChartLabels.includes(result))
    return allChartLabels[0]
  else return result
}

const baselineStartYear = (
  allChartLabels: string[],
  baselineMethod: string
): number => {
  if (!allChartLabels || !allChartLabels.length) return 2015
  const val = parseFourDigitNumber(allChartLabels[0])
  switch (baselineMethod) {
    case 'naive':
      return 2015
    case 'mean':
      return 2017
    case 'lin_reg':
      return 2010
    case 'exp': {
      if (!val || val < 2000) return 2000
      else return val
    }
    default:
      return val ?? 2015
  }
}

export const defaultBaselineToDate = (chartType: string) => {
  switch (chartType) {
    case 'weekly':
    case 'weekly_104w_sma':
    case 'weekly_52w_sma':
    case 'weekly_26w_sma':
    case 'weekly_13w_sma':
      return '2019 W52'
    case 'monthly':
      return '2019 Dec'
    case 'quarterly':
      return '2019 Q4'
    case 'midyear':
    case 'fluseason':
      return '2018/19'
    default:
      return '2019'
  }
}
