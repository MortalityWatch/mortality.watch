import { describe, expect, it } from 'vitest'
import { DataLoaderService } from './dataLoader'
import type { CountryData } from '../../app/model'

type TestableDataLoader = {
  parseCSV(csvText: string): Record<string, unknown>[]
  parseCountryData(csvText: string, ageGroup: string, chartType: string): CountryData[]
}

describe('DataLoaderService CSV parsing', () => {
  it('preserves columns after quoted commas in type and source fields', () => {
    const loader = new DataLoaderService() as unknown as TestableDataLoader
    const csv = [
      '"iso3c","date","deaths","population","cmr","type","source","asmr_who","asmr_esp","asmr_usa","asmr_country","le","source_asmr"',
      '"AUS","2024-2025",185000,27000000,685.2,"3, 4","world_mortality, mortality_org",338.4,763.3,536.9,643.7,83.3,"mortality_org"'
    ].join('\n')

    const [row] = loader.parseCSV(csv)

    expect(row).toMatchObject({
      type: '3, 4',
      source: 'world_mortality, mortality_org',
      asmr_country: 643.7,
      le: 83.3,
      source_asmr: 'mortality_org'
    })
  })

  it('does not read ASMR columns as life expectancy when LE is blank', () => {
    const loader = new DataLoaderService() as unknown as TestableDataLoader
    const csv = [
      '"iso3c","date","deaths","population","cmr","type","source","asmr_who","asmr_esp","asmr_usa","asmr_country","le","source_asmr"',
      '"AUS","2014-2015",158608,23857023,664.7,"1, 3","un, world_mortality",,,,,,'
    ].join('\n')

    const [row] = loader.parseCountryData(csv, 'all', 'fluseason')

    expect(row?.le).toBeUndefined()
    expect(row?.source).toBe('un, world_mortality')
  })
})
