import { describe, it, expect } from 'vitest'
import {
  getChartTypeOrdinal,
  getChartTypeFromOrdinal,
  Country,
  CountryData,
  type CountryRaw,
  type CountryDataRaw
} from './model'

describe('model', () => {
  describe('getChartTypeOrdinal', () => {
    it('should return 1 for yearly chart types', () => {
      expect(getChartTypeOrdinal('yearly')).toBe(1)
      expect(getChartTypeOrdinal('midyear')).toBe(1)
      expect(getChartTypeOrdinal('fluseason')).toBe(1)
    })

    it('should return 3 for weekly chart types', () => {
      expect(getChartTypeOrdinal('weekly')).toBe(3)
      expect(getChartTypeOrdinal('weekly_13w_sma')).toBe(3)
      expect(getChartTypeOrdinal('weekly_26w_sma')).toBe(3)
      expect(getChartTypeOrdinal('weekly_52w_sma')).toBe(3)
      expect(getChartTypeOrdinal('weekly_104w_sma')).toBe(3)
    })

    it('should return 2 for monthly and quarterly chart types', () => {
      expect(getChartTypeOrdinal('monthly')).toBe(2)
      expect(getChartTypeOrdinal('quarterly')).toBe(2)
    })

    it('should return 2 for unknown chart types', () => {
      expect(getChartTypeOrdinal('unknown')).toBe(2)
      expect(getChartTypeOrdinal('custom')).toBe(2)
    })
  })

  describe('getChartTypeFromOrdinal', () => {
    it('should return yearly for ordinal 1', () => {
      expect(getChartTypeFromOrdinal(1)).toBe('yearly')
    })

    it('should return monthly for ordinal 2', () => {
      expect(getChartTypeFromOrdinal(2)).toBe('monthly')
    })

    it('should return weekly for ordinal 3', () => {
      expect(getChartTypeFromOrdinal(3)).toBe('weekly')
    })

    it('should return yearly for invalid ordinals', () => {
      expect(getChartTypeFromOrdinal(0)).toBe('yearly')
      expect(getChartTypeFromOrdinal(4)).toBe('yearly')
      expect(getChartTypeFromOrdinal(-1)).toBe('yearly')
    })
  })

  describe('Country', () => {
    const mockCountryRaw: CountryRaw = {
      iso3c: 'USA',
      jurisdiction: 'United States',
      type: '3',
      source: 'CDC',
      age_groups: 'all, 0-14, 15-64, 65+',
      min_date: '2020-01',
      max_date: '2023-12'
    }

    describe('constructor', () => {
      it('should create Country instance from CountryRaw', () => {
        const country = new Country(mockCountryRaw)

        expect(country.iso3c).toBe('USA')
        expect(country.jurisdiction).toBe('United States')
        expect(country.data_source).toHaveLength(1)
        expect(country.data_source[0]?.type).toBe('weekly')
        expect(country.data_source[0]?.source).toBe('CDC')
      })

      it('should parse type correctly', () => {
        const yearly = new Country({ ...mockCountryRaw, type: '1' })
        expect(yearly.data_source[0]?.type).toBe('yearly')

        const monthly = new Country({ ...mockCountryRaw, type: '2' })
        expect(monthly.data_source[0]?.type).toBe('monthly')

        const weekly = new Country({ ...mockCountryRaw, type: '3' })
        expect(weekly.data_source[0]?.type).toBe('weekly')
      })

      it('should parse age groups', () => {
        const country = new Country(mockCountryRaw)
        const ageGroups = country.data_source[0]?.age_groups

        expect(ageGroups?.size).toBe(4)
        expect(ageGroups?.has('all')).toBe(true)
        expect(ageGroups?.has('0-14')).toBe(true)
        expect(ageGroups?.has('15-64')).toBe(true)
        expect(ageGroups?.has('65+')).toBe(true)
      })
    })

    describe('has_asmr', () => {
      it('should return true when country has multiple age groups', () => {
        const country = new Country(mockCountryRaw)
        expect(country.has_asmr()).toBe(true)
      })

      it('should return false when country has only one age group', () => {
        const singleAge = new Country({
          ...mockCountryRaw,
          age_groups: 'all'
        })
        expect(singleAge.has_asmr()).toBe(false)
      })
    })

    describe('age_groups', () => {
      it('should return all age groups from all data sources', () => {
        const country = new Country(mockCountryRaw)
        const ageGroups = country.age_groups()

        expect(ageGroups.size).toBe(4)
        expect(ageGroups.has('all')).toBe(true)
        expect(ageGroups.has('0-14')).toBe(true)
        expect(ageGroups.has('15-64')).toBe(true)
        expect(ageGroups.has('65+')).toBe(true)
      })

      it('should handle single age group', () => {
        const country = new Country({
          ...mockCountryRaw,
          age_groups: 'all'
        })
        const ageGroups = country.age_groups()

        expect(ageGroups.size).toBe(1)
        expect(ageGroups.has('all')).toBe(true)
      })
    })
  })

  describe('CountryData', () => {
    const mockCountryDataRaw: CountryDataRaw = {
      iso3c: 'USA',
      population: '1000000',
      date: '2020-01',
      type: '3',
      source: 'CDC',
      source_asmr: 'CDC_ASMR',
      deaths: '500',
      cmr: '50.5',
      asmr_who: '45.2',
      asmr_esp: '44.8',
      asmr_usa: '46.1',
      asmr_country: '47.3'
    }

    describe('constructor', () => {
      it('should create CountryData instance from CountryDataRaw', () => {
        const data = new CountryData(mockCountryDataRaw, 'all', 'weekly')

        expect(data.iso3c).toBe('USA')
        expect(data.age_group).toBe('all')
        expect(data.population).toBe(1000000)
        expect(data.date).toBe('2020-01')
        expect(data.type).toBe('3')
        expect(data.source).toBe('CDC')
        expect(data.source_asmr).toBe('CDC_ASMR')
      })

      it('should parse integer values correctly', () => {
        const data = new CountryData(mockCountryDataRaw, 'all', 'weekly')

        expect(data.population).toBe(1000000)
        expect(data.deaths).toBe(500)
      })

      it('should parse float values correctly', () => {
        const data = new CountryData(mockCountryDataRaw, 'all', 'weekly')

        expect(data.cmr).toBe(50.5)
        expect(data.asmr_who).toBe(45.2)
        expect(data.asmr_esp).toBe(44.8)
        expect(data.asmr_usa).toBe(46.1)
        expect(data.asmr_country).toBe(47.3)
      })

      it('should handle empty string values as undefined', () => {
        const emptyData: CountryDataRaw = {
          ...mockCountryDataRaw,
          population: '',
          deaths: '',
          cmr: '',
          asmr_who: '',
          asmr_esp: '',
          asmr_usa: '',
          asmr_country: ''
        }

        const data = new CountryData(emptyData, 'all', 'weekly')

        expect(data.population).toBeUndefined()
        expect(data.deaths).toBeUndefined()
        expect(data.cmr).toBeUndefined()
        expect(data.asmr_who).toBeUndefined()
        expect(data.asmr_esp).toBeUndefined()
        expect(data.asmr_usa).toBeUndefined()
        expect(data.asmr_country).toBeUndefined()
      })

      it('should initialize baseline values as undefined', () => {
        const data = new CountryData(mockCountryDataRaw, 'all', 'weekly')

        expect(data.deaths_baseline).toBeUndefined()
        expect(data.deaths_baseline_lower).toBeUndefined()
        expect(data.deaths_baseline_upper).toBeUndefined()
        expect(data.deaths_excess).toBeUndefined()
        expect(data.cmr_baseline).toBeUndefined()
        expect(data.asmr_who_baseline).toBeUndefined()
      })

      it('should transform flu season dates', () => {
        const fluSeasonData: CountryDataRaw = {
          ...mockCountryDataRaw,
          date: '2020-2021'
        }

        const data = new CountryData(fluSeasonData, 'all', 'fluseason')

        expect(data.date).toBe('2020/21')
      })

      it('should not transform non-flu season dates', () => {
        const data = new CountryData(mockCountryDataRaw, 'all', 'weekly')

        expect(data.date).toBe('2020-01')
      })

      it('should handle different age groups', () => {
        const data1 = new CountryData(mockCountryDataRaw, 'all', 'weekly')
        expect(data1.age_group).toBe('all')

        const data2 = new CountryData(mockCountryDataRaw, '0-14', 'weekly')
        expect(data2.age_group).toBe('0-14')

        const data3 = new CountryData(mockCountryDataRaw, '65+', 'weekly')
        expect(data3.age_group).toBe('65+')
      })

      it('should handle zero values correctly', () => {
        const zeroData: CountryDataRaw = {
          ...mockCountryDataRaw,
          population: '0',
          deaths: '0',
          cmr: '0',
          asmr_who: '0'
        }

        const data = new CountryData(zeroData, 'all', 'weekly')

        expect(data.population).toBe(0)
        expect(data.deaths).toBe(0)
        expect(data.cmr).toBe(0)
        expect(data.asmr_who).toBe(0)
      })
    })
  })
})
