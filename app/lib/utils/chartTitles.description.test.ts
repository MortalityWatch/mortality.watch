import { describe, it, expect } from 'vitest'
import { generateExplorerDescription } from './chartTitles'
import type { Country } from '@/model'

describe('chartTitles', () => {
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
