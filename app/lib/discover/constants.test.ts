import { describe, it, expect } from 'vitest'
import {
  metricInfo,
  chartTypeLabels,
  viewLabels,
  viewDescriptions,
  getMetricTabs,
  popularCountries,
  regionFilters,
  formatPresetLabel,
  getPresetDescription
} from './constants'

describe('constants', () => {
  describe('metricInfo', () => {
    it('should have info for all 6 metrics', () => {
      expect(Object.keys(metricInfo)).toHaveLength(6)
      expect(metricInfo.le).toBeDefined()
      expect(metricInfo.asd).toBeDefined()
      expect(metricInfo.asmr).toBeDefined()
      expect(metricInfo.cmr).toBeDefined()
      expect(metricInfo.deaths).toBeDefined()
      expect(metricInfo.population).toBeDefined()
    })

    it('should have required properties for each metric', () => {
      for (const metric of Object.values(metricInfo)) {
        expect(metric.label).toBeDefined()
        expect(metric.shortLabel).toBeDefined()
        expect(metric.description).toBeDefined()
        expect(metric.icon).toBeDefined()
        expect(metric.icon).toMatch(/^i-lucide-/)
      }
    })

    it('should have correct labels', () => {
      expect(metricInfo.le.label).toBe('Life Expectancy')
      expect(metricInfo.asmr.label).toBe('Age-Standardized Mortality Rate')
      expect(metricInfo.population.label).toBe('Population')
    })
  })

  describe('chartTypeLabels', () => {
    it('should have labels for all 6 chart types', () => {
      expect(Object.keys(chartTypeLabels)).toHaveLength(6)
      expect(chartTypeLabels.weekly).toBe('Weekly')
      expect(chartTypeLabels.monthly).toBe('Monthly')
      expect(chartTypeLabels.quarterly).toBe('Quarterly')
      expect(chartTypeLabels.yearly).toBe('Yearly')
      expect(chartTypeLabels.midyear).toBe('Mid-Year')
      expect(chartTypeLabels.fluseason).toBe('Flu Season')
    })
  })

  describe('viewLabels', () => {
    it('should have labels for all 3 views', () => {
      expect(Object.keys(viewLabels)).toHaveLength(3)
      expect(viewLabels.normal).toBe('Raw Values')
      expect(viewLabels.excess).toBe('Excess')
      expect(viewLabels.zscore).toBe('Z-Score')
    })
  })

  describe('viewDescriptions', () => {
    it('should have descriptions for all 3 views', () => {
      expect(Object.keys(viewDescriptions)).toHaveLength(3)
      expect(viewDescriptions.normal).toContain('Observed values')
      expect(viewDescriptions.excess).toContain('baseline')
      expect(viewDescriptions.zscore).toContain('standard deviations')
    })
  })

  describe('getMetricTabs', () => {
    it('should return 6 tabs', () => {
      const tabs = getMetricTabs()
      expect(tabs).toHaveLength(6)
    })

    it('should have correct structure for each tab', () => {
      const tabs = getMetricTabs()

      for (const tab of tabs) {
        expect(tab.label).toBeDefined()
        expect(tab.value).toBeDefined()
        expect(tab.slot).toBeDefined()
        expect(tab.value).toBe(tab.slot)
      }
    })

    it('should use full metric names as labels', () => {
      const tabs = getMetricTabs()

      const leTab = tabs.find(t => t.value === 'le')
      expect(leTab?.label).toBe('Life Expectancy')

      const popTab = tabs.find(t => t.value === 'population')
      expect(popTab?.label).toBe('Population')
    })
  })

  describe('popularCountries', () => {
    it('should be an array of ISO3 codes', () => {
      expect(Array.isArray(popularCountries)).toBe(true)
      expect(popularCountries.length).toBeGreaterThan(0)

      for (const code of popularCountries) {
        expect(code).toMatch(/^[A-Z]{3}$/)
      }
    })

    it('should include major countries', () => {
      expect(popularCountries).toContain('USA')
      expect(popularCountries).toContain('GBR')
      expect(popularCountries).toContain('DEU')
    })
  })

  describe('regionFilters', () => {
    it('should have multiple region options', () => {
      expect(regionFilters.length).toBeGreaterThan(5)
    })

    it('should have correct structure for each filter', () => {
      for (const filter of regionFilters) {
        expect(filter.label).toBeDefined()
        expect(filter.value).toBeDefined()
        expect(typeof filter.label).toBe('string')
        expect(typeof filter.value).toBe('string')
      }
    })

    it('should include common regions', () => {
      const values = regionFilters.map(f => f.value)
      expect(values).toContain('all')
      expect(values).toContain('eu27')
      expect(values).toContain('usa')
    })
  })

  describe('formatPresetLabel', () => {
    it('should format chart type and view correctly', () => {
      expect(formatPresetLabel('weekly', 'normal')).toBe('Weekly Raw Values')
      expect(formatPresetLabel('monthly', 'excess')).toBe('Monthly Excess')
      expect(formatPresetLabel('fluseason', 'zscore')).toBe('Flu Season Z-Score')
    })
  })

  describe('getPresetDescription', () => {
    it('should generate description for normal view', () => {
      const desc = getPresetDescription('asmr', 'weekly', 'normal')
      expect(desc).toContain('Age-Standardized Mortality Rate')
      expect(desc).toContain('Weekly')
      expect(desc).toContain('data')
    })

    it('should generate description for excess view', () => {
      const desc = getPresetDescription('deaths', 'monthly', 'excess')
      expect(desc).toContain('Deaths')
      expect(desc).toContain('Monthly')
      expect(desc).toContain('excess')
      expect(desc).toContain('2017-2019')
    })

    it('should generate description for zscore view', () => {
      const desc = getPresetDescription('cmr', 'yearly', 'zscore')
      expect(desc).toContain('Crude Mortality Rate')
      expect(desc).toContain('Yearly')
      expect(desc).toContain('z-score')
    })
  })
})
