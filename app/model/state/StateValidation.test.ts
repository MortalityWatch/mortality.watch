import { describe, it, expect, beforeEach } from 'vitest'
import { StateData } from './StateData'
import { StateComputed } from './StateComputed'
import { StateValidation } from './StateValidation'
import { StateHelpers } from './StateHelpers'
import { createStateProperties } from './stateProperties'

describe('StateValidation', () => {
  let stateData: StateData
  let stateComputed: StateComputed
  let stateValidation: StateValidation
  let stateHelpers: StateHelpers

  beforeEach(() => {
    stateData = new StateData()
    const props = createStateProperties()
    stateHelpers = new StateHelpers(props)
    stateComputed = new StateComputed(stateData, stateHelpers)
    stateValidation = new StateValidation(stateData, stateComputed)

    // Setup basic test data
    const labels = ['2020-W01', '2020-W02', '2020-W03', '2020-W04', '2020-W05']
    stateData.allChartData = {
      labels,
      data: {},
      notes: {}
    } as unknown as typeof stateData.allChartData
    stateData.allChartLabels.value = labels
    stateData.allYearlyChartLabels.value = ['2020', '2021', '2022']
    stateData.allYearlyChartLabelsUnique.value = ['2020', '2021', '2022']
    stateData.chartType = 'weekly'
  })

  describe('Date Range Validation', () => {
    it('should validate valid date range', () => {
      stateData.dateFrom = '2020-W02'
      stateData.dateTo = '2020-W04'
      expect(stateValidation.isDateRangeValid()).toBe(true)
    })

    it('should invalidate reversed date range', () => {
      stateData.dateFrom = '2020-W04'
      stateData.dateTo = '2020-W02'
      expect(stateValidation.isDateRangeValid()).toBe(false)
    })

    it('should validate single date range', () => {
      stateData.dateFrom = '2020-W03'
      stateData.dateTo = '2020-W03'
      expect(stateValidation.isDateRangeValid()).toBe(true)
    })

    it('should check if date is valid', () => {
      expect(stateValidation.isDateValid('2020-W02')).toBe(true)
      expect(stateValidation.isDateValid('2025-W99')).toBe(false)
    })
  })

  describe('Baseline Date Validation', () => {
    beforeEach(() => {
      stateData.baselineDateFrom = '2020-W01'
      stateData.baselineDateTo = '2020-W03'
    })

    it('should validate valid baseline date range', () => {
      expect(stateValidation.isBaselineDateRangeValid()).toBe(true)
    })

    it('should invalidate reversed baseline date range', () => {
      stateData.baselineDateFrom = '2020-W05'
      stateData.baselineDateTo = '2020-W01'
      expect(stateValidation.isBaselineDateRangeValid()).toBe(false)
    })

    it('should check if baseline date is valid', () => {
      expect(stateValidation.isBaselineDateValid('2020-W02')).toBe(true)
      expect(stateValidation.isBaselineDateValid('2099-W99')).toBe(false)
    })
  })

  describe('resetDates', () => {
    it('should reset invalid dateFrom', () => {
      stateData.dateFrom = 'invalid-date'
      stateValidation.resetDates()
      expect(stateData.dateFrom).toBe('2020-W01')
    })

    it('should reset invalid dateTo', () => {
      stateData.dateTo = 'invalid-date'
      stateValidation.resetDates()
      expect(stateData.dateTo).toBe('2020-W05')
    })

    it('should keep valid dates', () => {
      stateData.dateFrom = '2020-W02'
      stateData.dateTo = '2020-W04'
      stateValidation.resetDates()
      expect(stateData.dateFrom).toBe('2020-W02')
      expect(stateData.dateTo).toBe('2020-W04')
    })
  })

  describe('resetBaselineDates', () => {
    beforeEach(() => {
      stateData.sliderStart = '2020'
    })

    it('should reset invalid baselineDateFrom', () => {
      stateData.baselineDateFrom = 'invalid-date'
      stateValidation.resetBaselineDates()
      expect(stateData.baselineDateFrom).toBe('2020-W01')
    })

    it('should reset invalid baselineDateTo', () => {
      stateData.baselineDateTo = 'invalid-date'
      stateValidation.resetBaselineDates()
      expect(stateData.baselineDateTo).toBeTruthy()
    })

    it('should reset invalid sliderStart', () => {
      stateData.sliderStart = 'invalid-year'
      stateValidation.resetBaselineDates()
      expect(stateData.sliderStart).toBeUndefined()
    })
  })

  describe('Country Validation', () => {
    beforeEach(() => {
      stateData.allCountries = {
        USA: { iso3c: 'USA', jurisdiction: 'United States', age_groups: () => ['all', '0-14', '15-64', '65+'] },
        GBR: { iso3c: 'GBR', jurisdiction: 'United Kingdom', age_groups: () => ['all', '0-14', '15-64'] },
        DEU: { iso3c: 'DEU', jurisdiction: 'Germany', age_groups: () => ['all'] }
      } as unknown as typeof stateData.allCountries
    })

    it('should validate countries are selected', () => {
      stateData.countries = []
      expect(stateValidation.hasValidCountrySelection()).toBe(false)

      stateData.countries = ['USA']
      expect(stateValidation.hasValidCountrySelection()).toBe(true)
    })

    it('should check if country code is valid', () => {
      expect(stateValidation.isValidCountry('USA')).toBe(true)
      expect(stateValidation.isValidCountry('XXX')).toBe(false)
    })

    it('should filter valid countries', () => {
      stateData.countries = ['USA', 'XXX', 'GBR', 'YYY']
      const valid = stateValidation.getValidCountries()
      expect(valid).toEqual(['USA', 'GBR'])
    })

    it('should remove invalid countries', () => {
      stateData.countries = ['USA', 'XXX', 'GBR']
      stateValidation.removeInvalidCountries()
      expect(stateData.countries).toEqual(['USA', 'GBR'])
    })
  })

  describe('Age Group Validation', () => {
    beforeEach(() => {
      stateData.allCountries = {
        USA: { iso3c: 'USA', jurisdiction: 'United States', age_groups: () => ['all', '0-14', '15-64', '65+'] },
        GBR: { iso3c: 'GBR', jurisdiction: 'United Kingdom', age_groups: () => ['all', '0-14', '15-64'] }
      } as unknown as typeof stateData.allCountries
      stateData.countries = ['USA', 'GBR']
    })

    it('should always validate "all" age group', () => {
      expect(stateValidation.isValidAgeGroup('all')).toBe(true)
    })

    it('should validate age group present in any country', () => {
      expect(stateValidation.isValidAgeGroup('0-14')).toBe(true)
      expect(stateValidation.isValidAgeGroup('65+')).toBe(true)
    })

    it('should invalidate age group not in any country', () => {
      expect(stateValidation.isValidAgeGroup('85+')).toBe(false)
    })

    it('should get valid age groups', () => {
      stateData.ageGroups = ['all', '0-14', '85+', '15-64']
      const valid = stateValidation.getValidAgeGroups()
      expect(valid).toEqual(['all', '0-14', '15-64'])
    })

    it('should remove invalid age groups', () => {
      stateData.ageGroups = ['all', '85+']
      stateValidation.removeInvalidAgeGroups()
      expect(stateData.ageGroups).toContain('all')
    })

    it('should reset to ["all"] if all age groups invalid', () => {
      stateData.ageGroups = ['85+', '90+']
      stateValidation.removeInvalidAgeGroups()
      expect(stateData.ageGroups).toEqual(['all'])
    })
  })

  describe('Chart Type Validation', () => {
    it('should validate ASMR types have only "all" age group', () => {
      stateData.type = 'asmr'
      stateData.ageGroups = ['all']
      expect(stateValidation.isValidChartType()).toBe(true)
    })

    it('should invalidate ASMR types with multiple age groups', () => {
      stateData.type = 'asmr'
      stateData.ageGroups = ['all', '0-14']
      expect(stateValidation.isValidChartType()).toBe(false)
    })

    it('should validate non-ASMR types', () => {
      stateData.type = 'deaths'
      stateData.ageGroups = ['all', '0-14']
      expect(stateValidation.isValidChartType()).toBe(true)
    })
  })

  describe('Baseline Method Validation', () => {
    it('should validate baseline method for non-population types', () => {
      stateData.type = 'deaths'
      stateData.isExcess = true
      expect(stateValidation.isValidBaselineMethod()).toBe(true)
    })

    it('should invalidate excess mode for population type', () => {
      stateData.type = 'population'
      stateData.isExcess = true
      expect(stateValidation.isValidBaselineMethod()).toBe(false)
    })

    it('should validate population type without excess', () => {
      stateData.type = 'population'
      stateData.isExcess = false
      expect(stateValidation.isValidBaselineMethod()).toBe(true)
    })
  })

  describe('Data Availability Validation', () => {
    it('should check if chart data is valid', () => {
      expect(stateValidation.hasValidChartData()).toBe(true)
    })

    it('should invalidate missing chart data', () => {
      stateData.allChartData = undefined as unknown as typeof stateData.allChartData
      expect(stateValidation.hasValidChartData()).toBe(false)
    })

    it('should invalidate empty labels', () => {
      stateData.allChartData.labels = []
      expect(stateValidation.hasValidChartData()).toBe(false)
    })

    it('should check if country metadata is valid', () => {
      stateData.allCountries = { USA: {} as unknown as typeof stateData.allCountries[string] }
      expect(stateValidation.hasValidCountryMetadata()).toBe(true)
    })

    it('should invalidate missing country metadata', () => {
      stateData.allCountries = undefined as unknown as typeof stateData.allCountries
      expect(stateValidation.hasValidCountryMetadata()).toBe(false)
    })

    it('should invalidate empty country metadata', () => {
      stateData.allCountries = {}
      expect(stateValidation.hasValidCountryMetadata()).toBe(false)
    })
  })

  describe('Ready to Render', () => {
    beforeEach(() => {
      stateData.allCountries = { USA: {} as unknown as typeof stateData.allCountries[string] }
      stateData.countries = ['USA']
      stateData.dateFrom = '2020-W02'
      stateData.dateTo = '2020-W04'
    })

    it('should return true when all conditions met', () => {
      expect(stateValidation.isReadyToRender()).toBe(true)
    })

    it('should return false without country metadata', () => {
      stateData.allCountries = {}
      expect(stateValidation.isReadyToRender()).toBe(false)
    })

    it('should return false without chart data', () => {
      stateData.allChartData = undefined as unknown as typeof stateData.allChartData
      expect(stateValidation.isReadyToRender()).toBe(false)
    })

    it('should return false without country selection', () => {
      stateData.countries = []
      expect(stateValidation.isReadyToRender()).toBe(false)
    })

    it('should return false with invalid date range', () => {
      stateData.dateFrom = '2020-W05'
      stateData.dateTo = '2020-W01'
      expect(stateValidation.isReadyToRender()).toBe(false)
    })
  })

  describe('validateAll', () => {
    beforeEach(() => {
      stateData.allCountries = { USA: {} as unknown as typeof stateData.allCountries[string] }
      stateData.countries = ['USA']
      stateData.dateFrom = '2020-W02'
      stateData.dateTo = '2020-W04'
      stateData.baselineDateFrom = '2020-W01'
      stateData.baselineDateTo = '2020-W03'
      stateData.type = 'deaths'
      stateData.ageGroups = ['all']
    })

    it('should return all validation results', () => {
      const results = stateValidation.validateAll()
      expect(results).toHaveProperty('dateRange')
      expect(results).toHaveProperty('baselineDateRange')
      expect(results).toHaveProperty('countrySelection')
      expect(results).toHaveProperty('chartType')
      expect(results).toHaveProperty('baselineMethod')
      expect(results).toHaveProperty('chartData')
      expect(results).toHaveProperty('countryMetadata')
      expect(results).toHaveProperty('readyToRender')
    })

    it('should show all true for valid state', () => {
      const results = stateValidation.validateAll()
      expect(results.dateRange).toBe(true)
      expect(results.baselineDateRange).toBe(true)
      expect(results.countrySelection).toBe(true)
      expect(results.chartType).toBe(true)
      expect(results.baselineMethod).toBe(true)
      expect(results.chartData).toBe(true)
      expect(results.countryMetadata).toBe(true)
      expect(results.readyToRender).toBe(true)
    })

    it('should show false for invalid date range', () => {
      stateData.dateFrom = '2020-W05'
      stateData.dateTo = '2020-W01'
      const results = stateValidation.validateAll()
      expect(results.dateRange).toBe(false)
      expect(results.readyToRender).toBe(false)
    })
  })
})
