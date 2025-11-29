import { describe, it, expect } from 'vitest'
import { generateRankingTitle, generateExplorerTitle, generateExplorerDescription } from './chartTitles'
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

  describe('generateExplorerDescription', () => {
    const mockCountries: Record<string, Country> = {
      USA: {
        iso3c: 'USA',
        jurisdiction: 'United States',
        data_source: [],
        has_asmr: () => true,
        age_groups: () => new Set(['all'])
      } as unknown as Country,
      SWE: {
        iso3c: 'SWE',
        jurisdiction: 'Sweden',
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
      } as unknown as Country
    }

    it('should generate basic description with single country', () => {
      const result = generateExplorerDescription({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'asmr',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toContain('Age-Standardized Mortality Rate (ASMR) data for United States.')
      expect(result).toContain('Data period: January 2020 to December 2023.')
    })

    it('should generate description with two countries', () => {
      const result = generateExplorerDescription({
        countries: ['USA', 'SWE'],
        allCountries: mockCountries,
        type: 'asmr',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toContain('United States and Sweden')
    })

    it('should generate description with three countries', () => {
      const result = generateExplorerDescription({
        countries: ['USA', 'SWE', 'DEU'],
        allCountries: mockCountries,
        type: 'asmr',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toContain('United States, Sweden, and Germany')
    })

    it('should include z-score view description', () => {
      const result = generateExplorerDescription({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'asmr',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12',
        view: 'zscore'
      })
      expect(result).toContain('Z-Score view shows how many standard deviations')
    })

    it('should include excess view description', () => {
      const result = generateExplorerDescription({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: true,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12',
        view: 'excess'
      })
      expect(result).toContain('Excess view shows the difference between observed and expected')
    })

    it('should include age group filter when not "all"', () => {
      const result = generateExplorerDescription({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['0-14'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toContain('Filtered to age group 0-14.')
    })

    it('should include multiple age groups', () => {
      const result = generateExplorerDescription({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['0-14', '15-64'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).toContain('Filtered to age groups: 0-14, 15-64.')
    })

    it('should not include age group filter when "all"', () => {
      const result = generateExplorerDescription({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12'
      })
      expect(result).not.toContain('Filtered to')
    })

    it('should include chart type info', () => {
      const result = generateExplorerDescription({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12',
        chartType: 'fluseason'
      })
      expect(result).toContain('Flu season (July-June) aggregation.')
    })

    it('should include baseline info when enabled', () => {
      const result = generateExplorerDescription({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showBaseline: true,
        baselineMethod: 'mean',
        baselineDateFrom: '2015/01',
        baselineDateTo: '2019/12'
      })
      expect(result).toContain('Baseline calculated using mean average from January 2015 to December 2019.')
    })

    it('should include linear regression baseline method', () => {
      const result = generateExplorerDescription({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showBaseline: true,
        baselineMethod: 'lm',
        baselineDateFrom: '2015/01',
        baselineDateTo: '2019/12'
      })
      expect(result).toContain('Baseline calculated using linear regression from January 2015 to December 2019.')
    })

    it('should include cumulative option', () => {
      const result = generateExplorerDescription({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12',
        cumulative: true
      })
      expect(result).toContain('Showing cumulative values.')
    })

    it('should include percentage option', () => {
      const result = generateExplorerDescription({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12',
        showPercentage: true
      })
      expect(result).toContain('Values shown as percentage of baseline.')
    })

    it('should include standard population for ASMR', () => {
      const result = generateExplorerDescription({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'asmr',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12',
        standardPopulation: 'who'
      })
      expect(result).toContain('Age-standardized using WHO World Standard.')
    })

    it('should include ESP2013 standard population', () => {
      const result = generateExplorerDescription({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'asmr',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12',
        standardPopulation: 'esp2013'
      })
      expect(result).toContain('Age-standardized using European Standard Population 2013.')
    })

    it('should not include standard population for non-ASMR types', () => {
      const result = generateExplorerDescription({
        countries: ['USA'],
        allCountries: mockCountries,
        type: 'deaths',
        isExcess: false,
        ageGroups: ['all'],
        dateFrom: '2020/01',
        dateTo: '2023/12',
        standardPopulation: 'who'
      })
      expect(result).not.toContain('Age-standardized')
    })

    it('should handle comprehensive description with all options', () => {
      const result = generateExplorerDescription({
        countries: ['USA', 'SWE'],
        allCountries: mockCountries,
        type: 'asmr',
        isExcess: false,
        ageGroups: ['0-14', '15-64'],
        dateFrom: '2020/01',
        dateTo: '2023/12',
        view: 'zscore',
        chartType: 'monthly',
        showBaseline: true,
        baselineMethod: 'mean',
        baselineDateFrom: '2015/01',
        baselineDateTo: '2019/12',
        cumulative: true,
        showPercentage: true,
        standardPopulation: 'who'
      })
      expect(result).toContain('United States and Sweden')
      expect(result).toContain('January 2020 to December 2023')
      expect(result).toContain('Filtered to age groups')
      expect(result).toContain('Monthly data')
      expect(result).toContain('Z-Score view')
      expect(result).toContain('Baseline calculated')
      expect(result).toContain('cumulative')
      expect(result).toContain('percentage')
      expect(result).toContain('WHO World Standard')
    })
  })
})
