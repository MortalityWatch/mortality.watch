import type { ChartContext, ChartViewConfig } from './types'
import { getAgeGroupSuffix } from './helpers'

const periodLabel = (chartType: string): string => {
  if (chartType === 'weekly') return 'Weekly'
  if (chartType === 'monthly') return 'Monthly'
  if (chartType === 'quarterly') return 'Quarterly'
  return 'Same Period'
}

const yearsBack = (value: string | undefined): number => {
  const parsed = Number.parseInt(value ?? '5', 10)
  if (!Number.isFinite(parsed)) return 5
  return Math.min(10, Math.max(1, parsed))
}

const singleCountryTitle = (ctx: ChartContext): string | null => {
  if (ctx.countries.length !== 1) return null
  const iso3c = ctx.countries[0]
  if (!iso3c) return null
  return ctx.allCountries?.[iso3c]?.jurisdiction ?? iso3c
}

export const SAME_PERIOD_VIEW: ChartViewConfig = {
  getTitleParts: (ctx) => {
    const parts: string[] = []

    const country = singleCountryTitle(ctx)
    if (country) parts.push(country)

    parts.push(periodLabel(ctx.chartType))

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

    parts.push('by Year')
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
