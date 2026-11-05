import { describe, it, expect } from 'vitest'
import { generateRankingTitle, generateExplorerTitle } from './chartTitles'
import type { Country } from '@/model'

describe('chartTitles', () => {
  describe('generateRankingTitle', () => {
    it('should generate basic ranking title with CMR (relative mode)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess CMR - Ranking - 2020-2023')
    })

    it('should generate basic ranking title with CMR (absolute mode)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'cmr',
        displayMode: 'absolute',
        showTotalsOnly: false
      })
      expect(result).toBe('CMR - Ranking - 2020-2023')
    })

    it('should generate ranking title with ASMR (relative mode)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'asmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess ASMR - Ranking - 2020-2023')
    })

    it('should generate ranking title with Life Expectancy (relative mode)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'le',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Change in Life Expectancy - Ranking - 2020-2023')
    })

    it('should generate ranking title with Life Expectancy (absolute mode)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'le',
        displayMode: 'absolute',
        showTotalsOnly: false
      })
      expect(result).toBe('Life Expectancy - Ranking - 2020-2023')
    })

    it('should omit metric when showTotalsOnly is true', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: true
      })
      expect(result).toBe('Ranking - 2020-2023')
    })

    it('should handle single year range', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        dateFrom: '2020/01',
        dateTo: '2020/12',
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess CMR - Ranking - 2020')
    })

    it('should handle US States jurisdiction', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'usa',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess CMR - US States - 2020-2023')
    })

    it('should handle Canadian Provinces jurisdiction', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'can',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'asmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess ASMR - Canadian Provinces - 2020-2023')
    })

    it('should handle EU27 jurisdiction', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'eu27',
        dateFrom: '2019/01',
        dateTo: '2024/12',
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess CMR - EU27 - 2019-2024')
    })

    it('should handle German States jurisdiction', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'deu',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess CMR - German States - 2020-2023')
    })

    it('should handle regional jurisdictions (Africa)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'af',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess CMR - Africa - 2020-2023')
    })

    it('should handle regional jurisdictions (Asia)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'as',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess CMR - Asia - 2020-2023')
    })

    it('should handle regional jurisdictions (Europe)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'eu',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess CMR - Europe - 2020-2023')
    })

    it('should handle regional jurisdictions (North America)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'na',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess CMR - North America - 2020-2023')
    })

    it('should handle regional jurisdictions (Oceania)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'oc',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess CMR - Oceania - 2020-2023')
    })

    it('should handle regional jurisdictions (South America)', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'sa',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess CMR - South America - 2020-2023')
    })

    it('should handle countries_states jurisdiction', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries_states',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess CMR - Countries & States - 2020-2023')
    })

    it('should handle unknown jurisdiction type by using raw value', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'unknown_type',
        dateFrom: '2020/01',
        dateTo: '2023/12',
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess CMR - unknown_type - 2020-2023')
    })

    it('should use defaults when no parameters provided (relative mode)', () => {
      const result = generateRankingTitle({})
      expect(result).toBe('Excess ASMR - Ranking') // Default is ASMR for standardized comparison
    })

    it('should handle missing date parameters', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess CMR - Ranking')
    })

    it('should handle undefined dateFrom', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        dateFrom: undefined,
        dateTo: '2023/12',
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess CMR - Ranking')
    })

    it('should handle undefined dateTo', () => {
      const result = generateRankingTitle({
        jurisdictionType: 'countries',
        dateFrom: '2020/01',
        dateTo: undefined,
        metricType: 'cmr',
        displayMode: 'relative',
        showTotalsOnly: false
      })
      expect(result).toBe('Excess CMR - Ranking')
    })
  })

  describe('generateExplorerTitle', () => {
    const mockCountries: Record<string, Country> = {
      USA: {
        iso3c: 'USA',
        jurisdiction: 'USA',
        data_source: [],
        has_asmr: () => true,
        age_groups: () => new Set(['all'])
      } as unknown as Country,
      GBR: {
        iso3c: 'GBR',
        jurisdiction: 'GBR',
        data_source: [],
        has_asmr: () => true,
        age_groups: () => new Set(['all'])
      } as unknown as Country,
      DEU: {
        iso3c: 'DEU',
        jurisdiction: 'Germany',
        data_source: [],
        has_asmr: () => true,
        age_groups: () => new Set(['all'])
      } as unknown as Country,
      FRA: {
        iso3c: 'FRA',
        jurisdiction: 'France',
        data_source: [],
        has_asmr: () => true,
        age_groups: () => new Set(['all'])
      } as unknown as Country,
      ITA: {
        iso3c: 'ITA',
        jurisdiction: 'Italy',
        data_source: [],
        has_asmr: () => true,
        age_groups: () => new Set(['all'])
      } as unknown as Country
    }

    it('should generate basic explorer title with single country', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['all'],
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
        ageGroups: ['all'],
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
        ageGroups: ['all'],
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
        ageGroups: ['all'],
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
        ageGroups: ['all'],
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
        ageGroups: ['all'],
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
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Age-Standardized Mortality Rate - USA - 2020-2023')
    })

    it('should handle life expectancy metric', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'le',
        isExcess: false,
        ageGroups: ['all'],
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
        ageGroups: ['all'],
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
        ageGroups: ['all'],
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
        ageGroups: ['all'],
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

    it('should not include age group when "all" is present', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['all'],
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
        ageGroups: ['all'],
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
        ageGroups: ['all'],
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
        ageGroups: ['all'],
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
        ageGroups: ['all']
      })
      expect(result).toBe('Deaths - USA')
    })

    it('should handle empty countries array', () => {
      const result = generateExplorerTitle({
        countries: [],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['all'],
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
        ageGroups: ['all'],
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
        ageGroups: ['all'],
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
      expect(result).toBe('Excess Age-Standardized Mortality Rate - USA vs GBR - 0-14 & 15-64 - 2019-2023')
    })

    it('should handle z-score view with explicit view parameter', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'cmr',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2024/12',
        view: 'zscore'
      })
      expect(result).toBe('Z-Score Crude Mortality Rate - USA - 2020-2024')
    })

    it('should handle z-score view for deaths metric', () => {
      const result = generateExplorerTitle({
        countries: ['DEU'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2019/01',
        dateTo: '2023/12',
        view: 'zscore'
      })
      expect(result).toBe('Z-Score Deaths - Germany - 2019-2023')
    })

    it('should handle z-score view with multiple countries', () => {
      const result = generateExplorerTitle({
        countries: ['USA', 'GBR', 'DEU'],
        allCountries: mockCountries,
        type: 'asmr',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12',
        view: 'zscore'
      })
      expect(result).toBe('Z-Score Age-Standardized Mortality Rate - USA, GBR & Germany - 2020-2023')
    })

    it('should fall back to excess view when isExcess is true and view is not provided', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: true,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Excess Deaths - USA - 2020-2023')
    })

    it('should fall back to mortality view when isExcess is false and view is not provided', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toBe('Deaths - USA - 2020-2023')
    })

    it('should explicitly use mortality view when provided', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'cmr',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12',
        view: 'mortality'
      })
      expect(result).toBe('Crude Mortality Rate - USA - 2020-2023')
    })

    it('should explicitly use excess view when provided', () => {
      const result = generateExplorerTitle({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'cmr',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12',
        view: 'excess'
      })
      expect(result).toBe('Excess Crude Mortality Rate - USA - 2020-2023')
    })
  })
})
