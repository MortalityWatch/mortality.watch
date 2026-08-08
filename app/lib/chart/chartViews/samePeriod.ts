import type { ChartViewConfig } from './types'
import { getAgeGroupSuffix } from './helpers'

const periodLabel = (chartType: string): string => {
  if (chartType === 'weekly') return 'Same Week Across Years'
  if (chartType === 'monthly') return 'Same Month Across Years'
  if (chartType === 'quarterly') return 'Same Quarter Across Years'
  return 'Same Period Across Years'
}

const yearsBack = (value: string | undefined): number => {
  const parsed = Number.parseInt(value ?? '5', 10)
  if (!Number.isFinite(parsed)) return 5
  return Math.min(10, Math.max(1, parsed))
}

export const SAME_PERIOD_VIEW: ChartViewConfig = {
  getTitleParts: (ctx) => {
    const parts: string[] = []

    if (ctx.chartType === 'weekly') parts.push('Weekly')
    if (ctx.chartType === 'monthly') parts.push('Monthly')
    if (ctx.chartType === 'quarterly') parts.push('Quarterly')

    switch (ctx.type) {
      case 'population':
        parts.push(`Population${getAgeGroupSuffix(ctx.ageGroups)}`)
        break
      case 'deaths':
        parts.push(`Deaths${getAgeGroupSuffix(ctx.ageGroups)}`)
        break
      case 'cmr':
        parts.push('CMR')
        break
      case 'asmr':
        parts.push('ASMR')
        break
      case 'asd':
        parts.push('ASD')
        break
      case 'le':
        parts.push('Life Expectancy')
        break
    }

    parts.push('by', periodLabel(ctx.chartType))
    return parts
  },

  getSubtitle: ctx => `Compared with previous ${yearsBack(ctx.comparisonYearsBack)} years`,

  xAxisLabel: (ctx) => {
    if (ctx.chartType === 'weekly') return 'Week'
    if (ctx.chartType === 'monthly') return 'Month'
    if (ctx.chartType === 'quarterly') return 'Quarter'
    return 'Period'
  }
}
