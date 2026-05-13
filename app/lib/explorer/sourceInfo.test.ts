import { describe, expect, it } from 'vitest'
import type { CountryData, DatasetRaw } from '@/model'
import {
  extractCountrySourceInfoFromSeries,
  extractSourceInfoFromDataset
} from './sourceInfo'

function makeRow(
  date: string,
  source: string,
  sourceAsmr: string = '',
  sourceLe?: string
): CountryData {
  return {
    date,
    source,
    source_asmr: sourceAsmr,
    source_le: sourceLe
  } as CountryData
}

describe('sourceInfo helpers', () => {
  it('extracts stitched source segments for life expectancy within the selected range', () => {
    const rows = [
      makeRow('2000', 'deaths_source_a', '', 'mortality_org'),
      makeRow('2001', 'deaths_source_a', '', 'mortality_org'),
      makeRow('2012', 'deaths_source_b', '', 'mortality_org'),
      makeRow('2013', 'deaths_source_b', '', 'eurostat'),
      makeRow('2025', 'deaths_source_b', '', 'eurostat')
    ]

    const info = extractCountrySourceInfoFromSeries(
      rows,
      'le',
      ['2001', '2012', '2013', '2025'],
      new Map([
        ['mortality_org', ['0-14', '15-64', '65-74', '75-84', '85+']],
        ['eurostat', ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+']]
      ])
    )

    expect(info).not.toBeNull()
    expect(info?.segments).toEqual([
      {
        source: 'mortality_org',
        from: '2001',
        to: '2012',
        ageGroups: ['0-14', '15-64', '65-74', '75-84', '85+']
      },
      {
        source: 'eurostat',
        from: '2013',
        to: '2025',
        ageGroups: ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+']
      }
    ])
    expect(info?.breakpointWarnings).toEqual([
      'Warning: source and age stratification change in 2013; values across the breakpoint may not be directly comparable.'
    ])
  })

  it('falls back to asmr-specific source values when extracting ASMR provenance', () => {
    const rows = [
      makeRow('2020', 'mortality_org', 'who'),
      makeRow('2021', 'mortality_org', 'who')
    ]

    const info = extractCountrySourceInfoFromSeries(rows, 'asmr')

    expect(info?.source).toBe('who')
    expect(info?.segments).toEqual([
      {
        source: 'who',
        from: '2020',
        to: '2021',
        ageGroups: undefined
      }
    ])
  })

  it('prefers source_le over source for life expectancy provenance', () => {
    const rows = [
      makeRow('2012', 'deaths_source', '', 'mortality_org'),
      makeRow('2013', 'deaths_source', '', 'eurostat')
    ]

    const info = extractCountrySourceInfoFromSeries(rows, 'le')

    expect(info?.segments).toEqual([
      {
        source: 'mortality_org',
        from: '2012',
        to: '2012',
        ageGroups: undefined
      },
      {
        source: 'eurostat',
        from: '2013',
        to: '2013',
        ageGroups: undefined
      }
    ])
  })

  it('extracts per-country source info from a dataset using the rendered labels', async () => {
    const dataset: DatasetRaw = {
      all: {
        FRA: [
          makeRow('2012', 'mortality_org'),
          makeRow('2013', 'eurostat'),
          makeRow('2014', 'eurostat')
        ]
      }
    }

    const result = await extractSourceInfoFromDataset(
      dataset,
      ['FRA'],
      'le',
      ['2013', '2014'],
      async () => new Map([
        ['mortality_org', ['0-14', '15-64', '65-74', '75-84', '85+']],
        ['eurostat', ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+']]
      ])
    )

    expect(result.get('FRA')?.segments).toEqual([
      {
        source: 'eurostat',
        from: '2013',
        to: '2014',
        ageGroups: ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+']
      }
    ])
  })
})
