import {
  datasetEntryKeys,
  stringKeys,
  type Country,
  type Dataset,
  type DatasetEntry,
  type DataVector
} from '@/model'
import type { ChartFilterConfig } from './types'

export type SamePeriodChartType = 'weekly' | 'monthly' | 'quarterly'

export interface PeriodToken {
  year: number
  period: string
  ordinal: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const padWeek = (week: number) => String(week).padStart(2, '0')

export const isSamePeriodChartType = (chartType: string): chartType is SamePeriodChartType =>
  chartType === 'weekly' || chartType === 'monthly' || chartType === 'quarterly'

export function parsePeriodLabel(label: string, chartType: string): PeriodToken | null {
  if (chartType === 'weekly') {
    const match = label.match(/^(\d{4})[ -]W(\d{2})$/)
    if (!match) return null
    const ordinal = Number(match[2])
    return { year: Number(match[1]), period: `W${padWeek(ordinal)}`, ordinal }
  }

  if (chartType === 'monthly') {
    const named = label.match(/^(\d{4}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/)
    if (named) {
      const period = named[2] ?? ''
      return {
        year: Number(named[1]),
        period,
        ordinal: MONTHS.indexOf(period) + 1
      }
    }

    const numeric = label.match(/^(\d{4})-(\d{2})$/)
    if (!numeric) return null
    const ordinal = Number(numeric[2])
    if (ordinal < 1 || ordinal > 12) return null
    return { year: Number(numeric[1]), period: MONTHS[ordinal - 1] ?? '', ordinal }
  }

  if (chartType === 'quarterly') {
    const match = label.match(/^(\d{4}) Q([1-4])$/)
    if (!match) return null
    const ordinal = Number(match[2])
    return { year: Number(match[1]), period: `Q${ordinal}`, ordinal }
  }

  return null
}

export function getPeriodComparisonLabels(
  dateFrom: string,
  dateTo: string,
  chartType: SamePeriodChartType
): string[] {
  const from = parsePeriodLabel(dateFrom, chartType)
  const to = parsePeriodLabel(dateTo, chartType)

  if (!from || !to || from.year !== to.year || from.ordinal > to.ordinal) {
    return []
  }

  const labels: string[] = []
  for (let ordinal = from.ordinal; ordinal <= to.ordinal; ordinal++) {
    if (chartType === 'weekly') labels.push(`W${padWeek(ordinal)}`)
    if (chartType === 'monthly') labels.push(MONTHS[ordinal - 1] ?? '')
    if (chartType === 'quarterly') labels.push(`Q${ordinal}`)
  }
  return labels
}

function sourceLabelForYear(year: number, period: string, chartType: SamePeriodChartType): string {
  if (chartType === 'monthly') {
    const month = MONTHS.indexOf(period) + 1
    return `${year}-${String(month).padStart(2, '0')}`
  }
  return `${year} ${period}`
}

function periodKey(year: number, period: string): string {
  return `${year}:${period}`
}

function createEmptyEntry(length: number): DatasetEntry {
  const entry = {} as DatasetEntry
  for (const key of datasetEntryKeys) {
    entry[key] = new Array(length).fill(undefined) as DataVector
  }
  return entry
}

function copyValue(
  entry: DatasetEntry,
  source: DatasetEntry,
  sourceIndex: number | undefined,
  targetIndex: number,
  fallback: { iso3c: string, ageGroup: string, date: string }
) {
  for (const key of datasetEntryKeys) {
    const target = entry[key] as unknown[]
    if (sourceIndex === undefined) {
      target[targetIndex] = stringKeys.includes(key as typeof stringKeys[number])
        ? undefined
        : null
      continue
    }

    const sourceValues = source[key] as unknown[] | undefined
    target[targetIndex] = sourceValues?.[sourceIndex]
  }

  entry.iso3c[targetIndex] = fallback.iso3c
  entry.age_group[targetIndex] = fallback.ageGroup
  entry.date[targetIndex] = fallback.date
}

function clampYearsBack(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '5', 10)
  if (!Number.isFinite(parsed)) return 5
  return Math.min(10, Math.max(1, parsed))
}

export function buildSamePeriodComparisonData(
  config: ChartFilterConfig,
  allLabels: string[],
  allChartData: Dataset
): { labels: string[], data: Dataset, countries: string[], allCountries: Record<string, Country> } {
  if (!isSamePeriodChartType(config.chartType)) {
    return { labels: [], data: {}, countries: [], allCountries: config.allCountries }
  }
  const chartType: SamePeriodChartType = config.chartType

  const from = parsePeriodLabel(config.dateFrom, chartType)
  const to = parsePeriodLabel(config.dateTo, chartType)
  const labels = getPeriodComparisonLabels(config.dateFrom, config.dateTo, chartType)

  if (!from || !to || labels.length === 0) {
    return { labels: [], data: {}, countries: [], allCountries: config.allCountries }
  }

  const sourceIndexByPeriod = new Map<string, number>()
  allLabels.forEach((label, index) => {
    const token = parsePeriodLabel(label, chartType)
    if (token) sourceIndexByPeriod.set(periodKey(token.year, token.period), index)
  })
  const yearsBack = clampYearsBack(config.comparisonYearsBack)
  const comparisonYears = Array.from({ length: yearsBack + 1 }, (_, index) => from.year - index)
  const countries = config.countries.flatMap(iso3c =>
    comparisonYears.map(year => `${iso3c}__${year}`)
  )
  const allCountries: Record<string, Country> = { ...config.allCountries }
  const data: Dataset = {}

  for (const iso3c of config.countries) {
    const country = config.allCountries[iso3c]
    if (!country) continue

    for (const year of comparisonYears) {
      const syntheticIso3c = `${iso3c}__${year}`
      allCountries[syntheticIso3c] = Object.assign(Object.create(Object.getPrototypeOf(country)) as Country, country, {
        iso3c: syntheticIso3c,
        jurisdiction: `${country.jurisdiction} ${year}`
      })
    }
  }

  for (const ageGroup of config.ageGroups) {
    const ageGroupData = allChartData[ageGroup]
    if (!ageGroupData) continue
    data[ageGroup] = {}

    for (const iso3c of config.countries) {
      const source = ageGroupData[iso3c]
      if (!source) continue

      for (const year of comparisonYears) {
        const syntheticIso3c = `${iso3c}__${year}`
        const entry = createEmptyEntry(labels.length)

        labels.forEach((period, targetIndex) => {
          const sourceLabel = sourceLabelForYear(year, period, chartType)
          const sourceIndex = sourceIndexByPeriod.get(periodKey(year, period))
          copyValue(
            entry,
            source,
            sourceIndex,
            targetIndex,
            { iso3c: syntheticIso3c, ageGroup, date: sourceLabel }
          )
        })

        data[ageGroup][syntheticIso3c] = entry
      }
    }
  }

  return { labels, data, countries, allCountries }
}
