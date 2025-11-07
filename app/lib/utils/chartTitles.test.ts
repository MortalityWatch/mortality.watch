import { describe, it, expect } from 'vitest'
import { generateRankingTitle, generateExplorerTitle } from './chartTitles'
import type { Country } from '@/model'

describe('chartTitles', () => {
  describe('generateRankingTitle', () => {
    it('should generate basic ranking title with CMR', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showASMR: false,
        showTotalsOnly: false
      })
      expect(result).toBe('Ranking - CMR - 2020-2023')
    })

    it('should generate ranking title with ASMR', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showASMR: true,
        showTotalsOnly: false
      })
      expect(result).toBe('Ranking - ASMR - 2020-2023')
    })

    it('should omit age group when showTotalsOnly is true', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showASMR: false,
        showTotalsOnly: true
      })
      expect(result).toBe('Ranking - 2020-2023')
    })

    it('should handle single year range', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        dateFrom: '2020/01',
        dateTo: '2020/12',
        showASMR: false,
        showTotalsOnly: false
      })
      expect(result).toBe('Ranking - CMR - 2020')
    })

    it('should handle US States jurisdiction', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'usa',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showASMR: false,
        showTotalsOnly: false
      })
      expect(result).toBe('US States - CMR - 2020-2023')
    })

    it('should handle Canadian Provinces jurisdiction', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'can',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showASMR: true,
        showTotalsOnly: false
      })
      expect(result).toBe('Canadian Provinces - ASMR - 2020-2023')
    })

    it('should handle EU27 jurisdiction', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'eu27',
        dateFrom: '2019/01',
        dateTo: '2024/12',
        showASMR: false,
        showTotalsOnly: false
      })
      expect(result).toBe('EU27 - CMR - 2019-2024')
    })

    it('should handle German States jurisdiction', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'deu',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showASMR: false,
        showTotalsOnly: false
      })
      expect(result).toBe('German States - CMR - 2020-2023')
    })

    it('should handle regional jurisdictions (Africa)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'af',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showASMR: false,
        showTotalsOnly: false
      })
      expect(result).toBe('Africa - CMR - 2020-2023')
    })

    it('should handle regional jurisdictions (Asia)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'as',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showASMR: false,
        showTotalsOnly: false
      })
      expect(result).toBe('Asia - CMR - 2020-2023')
    })

    it('should handle regional jurisdictions (Europe)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'eu',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showASMR: false,
        showTotalsOnly: false
      })
      expect(result).toBe('Europe - CMR - 2020-2023')
    })

    it('should handle regional jurisdictions (North America)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'na',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showASMR: false,
        showTotalsOnly: false
      })
      expect(result).toBe('North America - CMR - 2020-2023')
    })

    it('should handle regional jurisdictions (Oceania)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'oc',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showASMR: false,
        showTotalsOnly: false
      })
      expect(result).toBe('Oceania - CMR - 2020-2023')
    })

    it('should handle regional jurisdictions (South America)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'sa',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showASMR: false,
        showTotalsOnly: false
      })
      expect(result).toBe('South America - CMR - 2020-2023')
    })

    it('should handle countries_states jurisdiction', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries_states',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showASMR: false,
        showTotalsOnly: false
      })
      expect(result).toBe('Countries & States - CMR - 2020-2023')
    })

    it('should handle unknown jurisdiction type by using raw value', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'unknown_type',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showASMR: false,
        showTotalsOnly: false
      })
      expect(result).toBe('unknown_type - CMR - 2020-2023')
    })

    it('should use defaults when no parameters provided', () => {
      const result = generateRankingTitle({})
      expect(result).toBe('Ranking - CMR')
    })

    it('should handle missing date parameters', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        showASMR: false,
        showTotalsOnly: false
      })
      expect(result).toBe('Ranking - CMR')
    })

    it('should handle undefined dateFrom', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        dateFrom: undefined,
        dateTo: '2023/12',
        showASMR: false,
        showTotalsOnly: false
      })
      expect(result).toBe('Ranking - CMR')
    })

    it('should handle undefined dateTo', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        dateFrom: '2020/01',
        dateTo: undefined,
        showASMR: false,
        showTotalsOnly: false
      })
      expect(result).toBe('Ranking - CMR')
    })
  })

  describe('generateExplorerTitle', () => {
    const mockCountries: Record<string, Country> = {
      USA: {
        iso3c: 'USA',
        jurisdiction: 'USA',
        data_source: [],
        has_asmr: () => true,
        age_groups: () => new Set(['TOTAL'])
      } as unknown as Country,
      GBR: {
        iso3c: 'GBR',
        jurisdiction: 'GBR',
        data_source: [],
        has_asmr: () => true,
        age_groups: () => new Set(['TOTAL'])
      } as unknown as Country,
      DEU: {
        iso3c: 'DEU',
        jurisdiction: 'Germany',
        data_source: [],
        has_asmr: () => true,
        age_groups: () => new Set(['TOTAL'])
      } as unknown as Country,
      FRA: {
        iso3c: 'FRA',
        jurisdiction: 'France',
        data_source: [],
        has_asmr: () => true,
        age_groups: () => new Set(['TOTAL'])
      } as unknown as Country,
      ITA: {
        iso3c: 'ITA',
        jurisdiction: 'Italy',
        data_source: [],
        has_asmr: () => true,
        age_groups: () => new Set(['TOTAL'])
      } as unknown as Country
    }

    it('should generate basic explorer title with single country', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Deaths - USA - 2020-2023')
    })

    it('should generate title with two countries using "vs"', () => {
      const result = generateExplorerTitle({
        countries: ['USA', 'GBR'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Deaths - USA vs GBR - 2020-2023')
    })

    it('should generate title with three countries using commas and "&"', () => {
      const result = generateExplorerTitle({
        countries: ['USA', 'GBR', 'DEU'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Deaths - USA, GBR & Germany - 2020-2023')
    })

    it('should generate title with more than 3 countries showing "+N more"', () => {
      const result = generateExplorerTitle({
        countries: ['USA', 'GBR', 'DEU', 'FRA', 'ITA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Deaths - USA, GBR, Germany +2 more - 2020-2023')
    })

    it('should handle excess deaths', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: true,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Excess Deaths - USA - 2020-2023')
    })

    it('should handle CMR metric', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'cmr',
        isExcess: false,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Crude Mortality Rate - USA - 2020-2023')
    })

    it('should handle ASMR metric', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'asmr',
        isExcess: false,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Age Std. Mortality Rate - USA - 2020-2023')
    })

    it('should handle life expectancy metric', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'le',
        isExcess: false,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Life Expectancy - USA - 2020-2023')
    })

    it('should not add "Excess" prefix to life expectancy', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'le',
        isExcess: true,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Life Expectancy - USA - 2020-2023')
    })

    it('should handle population metric', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'population',
        isExcess: false,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Population - USA - 2020-2023')
    })

    it('should not add "Excess" prefix to population', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'population',
        isExcess: true,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Population - USA - 2020-2023')
    })

    it('should handle single specific age group', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['0-14'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Deaths - USA - 0-14 - 2020-2023')
    })

    it('should handle two specific age groups', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['0-14', '15-64'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Deaths - USA - 0-14 & 15-64 - 2020-2023')
    })

    it('should handle multiple age groups (3+)', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['0-14', '15-64', '65+'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Deaths - USA - 3 Age Groups - 2020-2023')
    })

    it('should not include age group when TOTAL is present', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Deaths - USA - 2020-2023')
    })

    it('should not include age group when array is empty', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: [],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Deaths - USA - 2020-2023')
    })

    it('should handle single year range', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: '2020/12'
      })
      expect(result).toBe('Deaths - USA - 2020')
    })

    it('should handle missing dateFrom', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['TOTAL'],
        dateFrom: undefined,
        dateTo: '2023/12'
      })
      expect(result).toBe('Deaths - USA')
    })

    it('should handle missing dateTo', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: undefined
      })
      expect(result).toBe('Deaths - USA')
    })

    it('should handle missing both dates', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['TOTAL']
      })
      expect(result).toBe('Deaths - USA')
    })

    it('should handle empty countries array', () => {
      const result = generateExplorerTitle({
        countries: [],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Deaths - 2020-2023')
    })

    it('should fall back to ISO code when country not found', () => {
      const result = generateExplorerTitle({
        countries: ['XXX'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Deaths - XXX - 2020-2023')
    })

    it('should handle unknown metric type by using raw value', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'unknown_type',
        isExcess: false,
        ageGroups: ['TOTAL'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('unknown_type - USA - 2020-2023')
    })

    it('should generate complex title with all features', () => {
      const result = generateExplorerTitle({
        countries: ['USA', 'GBR'],
        allCountries: mockCountries,
        type: 'asmr',
        isExcess: true,
        ageGroups: ['0-14', '15-64'],
        dateFrom: '2019/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Excess Age Std. Mortality Rate - USA vs GBR - 0-14 & 15-64 - 2019-2023')
    })
  })
})
