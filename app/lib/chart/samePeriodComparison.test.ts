import { describe, expect, it } from 'vitest'
import { datasetEntryKeys, type Country, type Dataset, type DatasetEntry, type DataVector } from '@/model'
import {
  buildSamePeriodComparisonData,
  getFullSamePeriodLabels,
  getPeriodComparisonLabels,
  parsePeriodLabel
} from './samePeriodComparison'
import type { ChartFilterConfig } from './types'

const entry = (iso3c: string, ageGroup: string, labels: string[], deaths: Array<number | undefined>): DatasetEntry => {
  const result = {} as DatasetEntry
  for (const key of datasetEntryKeys) {
    result[key] = new Array(labels.length).fill(undefined) as DataVector
  }
  result.iso3c = labels.map(() => iso3c)
  result.age_group = labels.map(() => ageGroup)
  result.date = labels
  result.source = labels.map(() => 'test')
  result.source_asmr = labels.map(() => 'test')
  result.type = labels.map(() => '0')
  result.deaths = deaths as DataVector
  result.population = labels.map(() => 1_000_000) as DataVector
  return result
}

const country = (iso3c: string, jurisdiction: string): Country => ({
  iso3c,
  jurisdiction,
  age_groups: () => new Set(['all'])
}) as Country

const config = (overrides: Partial<ChartFilterConfig> = {}): ChartFilterConfig => ({
  countries: ['USA'],
  ageGroups: ['all'],
  type: 'deaths',
  chartType: 'weekly',
  standardPopulation: 'who',
  view: 'samePeriod',
  isExcess: false,
  chartStyle: 'line',
  isBarChartStyle: false,
  isMatrixChartStyle: false,
  isErrorBarType: false,
  isAsmrType: false,
  isASD: false,
  isLifeExpectancyType: false,
  isPopulationType: false,
  isDeathsType: true,
  dateFrom: '2024 W10',
  dateTo: '2024 W12',
  baselineMethod: 'mean',
  baselineDateFrom: '',
  baselineDateTo: '',
  zscoreMethod: 'standard',
  zscoreLambdaMode: 'auto',
  zscoreLambda: '',
  showBaseline: false,
  cumulative: false,
  showTotal: false,
  showPredictionInterval: false,
  showPercentage: false,
  showCumPi: false,
  maximize: false,
  showLabels: true,
  showLogarithmic: false,
  leAdjusted: true,
  comparisonYearsBack: '2',
  colors: ['#000000'],
  allCountries: { USA: country('USA', 'USA') },
  url: '',
  ...overrides
})

describe('samePeriodComparison', () => {
  it('parses supported weekly, monthly, and quarterly labels', () => {
    expect(parsePeriodLabel('2024 W10', 'weekly')).toEqual({ year: 2024, period: 'W10', ordinal: 10 })
    expect(parsePeriodLabel('2024-W10', 'weekly')).toEqual({ year: 2024, period: 'W10', ordinal: 10 })
    expect(parsePeriodLabel('2024 Jan', 'monthly')).toEqual({ year: 2024, period: 'Jan', ordinal: 1 })
    expect(parsePeriodLabel('2024-01', 'monthly')).toEqual({ year: 2024, period: 'Jan', ordinal: 1 })
    expect(parsePeriodLabel('2024 Q3', 'quarterly')).toEqual({ year: 2024, period: 'Q3', ordinal: 3 })
  })

  it('rejects unsupported labels and chart types', () => {
    expect(parsePeriodLabel('2024', 'yearly')).toBeNull()
    expect(parsePeriodLabel('2023/24', 'fluseason')).toBeNull()
    expect(parsePeriodLabel('2024 W10', 'weekly_13w_sma')).toBeNull()
  })

  it('builds period labels within one anchor year and rejects cross-year ranges', () => {
    expect(getPeriodComparisonLabels('2024 W10', '2024 W12', 'weekly')).toEqual(['W10', 'W11', 'W12'])
    expect(getPeriodComparisonLabels('2024-01', '2024-03', 'monthly')).toEqual(['Jan', 'Feb', 'Mar'])
    expect(getPeriodComparisonLabels('2024 Q1', '2024 Q3', 'quarterly')).toEqual(['Q1', 'Q2', 'Q3'])
    expect(getPeriodComparisonLabels('2023 W50', '2024 W10', 'weekly')).toEqual([])
  })

  it('builds full calendar period labels independent of available data', () => {
    expect(getFullSamePeriodLabels('monthly', 2026)).toEqual([
      '2026 Jan', '2026 Feb', '2026 Mar', '2026 Apr', '2026 May', '2026 Jun',
      '2026 Jul', '2026 Aug', '2026 Sep', '2026 Oct', '2026 Nov', '2026 Dec'
    ])
    expect(getFullSamePeriodLabels('quarterly', 2026)).toEqual(['2026 Q1', '2026 Q2', '2026 Q3', '2026 Q4'])
    expect(getFullSamePeriodLabels('weekly', 2026)).toHaveLength(53)
    expect(getFullSamePeriodLabels('weekly', 2027)).toHaveLength(52)
  })

  it('maps same weekly periods across years without shifting', () => {
    const labels = [
      '2022-W10', '2022-W11', '2022-W12',
      '2023-W10', '2023-W11', '2023-W12',
      '2024-W10', '2024-W11', '2024-W12'
    ]
    const data: Dataset = {
      all: {
        USA: entry('USA', 'all', labels, [10, 11, 12, 20, 21, 22, 30, 31, 32])
      }
    }

    const result = buildSamePeriodComparisonData(config(), labels, data)

    expect(result.labels).toEqual(['W10', 'W11', 'W12'])
    expect(result.countries).toEqual(['USA__2024', 'USA__2023', 'USA__2022'])
    expect(result.allCountries.USA__2024?.jurisdiction).toBe('2024')
    expect(result.data.all?.USA__2024?.deaths).toEqual([30, 31, 32])
    expect(result.data.all?.USA__2023?.deaths).toEqual([20, 21, 22])
    expect(result.data.all?.USA__2022?.deaths).toEqual([10, 11, 12])
  })

  it('keeps jurisdiction names in multi-country labels', () => {
    const labels = ['2024-01', '2023-01']
    const data: Dataset = {
      all: {
        USA: entry('USA', 'all', labels, [10, 20]),
        DEU: entry('DEU', 'all', labels, [30, 40])
      }
    }

    const result = buildSamePeriodComparisonData(
      config({
        chartType: 'monthly',
        dateFrom: '2024 Jan',
        dateTo: '2024 Jan',
        comparisonYearsBack: '1',
        countries: ['USA', 'DEU'],
        allCountries: { USA: country('USA', 'USA'), DEU: country('DEU', 'Germany') }
      }),
      labels,
      data
    )

    expect(result.allCountries.USA__2024?.jurisdiction).toBe('USA 2024')
    expect(result.allCountries.DEU__2024?.jurisdiction).toBe('Germany 2024')
  })

  it('keeps missing W53 as a null gap', () => {
    const labels = ['2024-W52', '2024-W53', '2023-W52']
    const data: Dataset = {
      all: {
        USA: entry('USA', 'all', labels, [52, 53, 152])
      }
    }

    const result = buildSamePeriodComparisonData(
      config({ dateFrom: '2024 W52', dateTo: '2024 W53', comparisonYearsBack: '1' }),
      labels,
      data
    )

    expect(result.labels).toEqual(['W52', 'W53'])
    expect(result.data.all?.USA__2024?.deaths).toEqual([52, 53])
    expect(result.data.all?.USA__2023?.deaths).toEqual([152, null])
  })
})
