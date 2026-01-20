import { describe, it, expect } from 'vitest'
import {
  metrics,
  chartTypes,
  views,
  generateAllPresets,
  getPresetsByMetric,
  getPresetCountByMetric,
  getPresetById,
  parsePresetId,
  isValidMetric,
  isValidPresetId,
  presetToExplorerUrl,
  presetToThumbnailUrl,
  groupPresetsByChartType,
  isMetricValidForChartType,
  isYearlyChartType,
  isLeAvailableForChartType
} from './presets'

describe('presets', () => {
  describe('constants', () => {
    it('should have 6 metrics', () => {
      expect(metrics).toHaveLength(6)
      expect(metrics).toContain('le')
      expect(metrics).toContain('asd')
      expect(metrics).toContain('asmr')
      expect(metrics).toContain('cmr')
      expect(metrics).toContain('deaths')
      expect(metrics).toContain('population')
    })

    it('should have 6 chart types', () => {
      expect(chartTypes).toHaveLength(6)
      expect(chartTypes).toContain('weekly')
      expect(chartTypes).toContain('monthly')
      expect(chartTypes).toContain('quarterly')
      expect(chartTypes).toContain('yearly')
      expect(chartTypes).toContain('midyear')
      expect(chartTypes).toContain('fluseason')
    })

    it('should have 3 views', () => {
      expect(views).toHaveLength(3)
      expect(views).toContain('normal')
      expect(views).toContain('excess')
      expect(views).toContain('zscore')
    })
  })

  describe('generateAllPresets', () => {
    it('should generate exactly 96 presets', () => {
      const presets = generateAllPresets()
      expect(presets).toHaveLength(96)
    })

    it('should generate 18 presets for non-population metrics', () => {
      const presets = generateAllPresets()
      const lePresets = presets.filter(p => p.metric === 'le')
      const asmrPresets = presets.filter(p => p.metric === 'asmr')
      const deathsPresets = presets.filter(p => p.metric === 'deaths')

      expect(lePresets).toHaveLength(18)
      expect(asmrPresets).toHaveLength(18)
      expect(deathsPresets).toHaveLength(18)
    })

    it('should generate only 6 presets for population (normal view only)', () => {
      const presets = generateAllPresets()
      const popPresets = presets.filter(p => p.metric === 'population')

      expect(popPresets).toHaveLength(6)
      expect(popPresets.every(p => p.view === 'normal')).toBe(true)
    })

    it('should have correct baseline settings for all presets', () => {
      const presets = generateAllPresets()

      for (const preset of presets) {
        expect(preset.baselineMethod).toBe('mean')
        expect(preset.baselineDateFrom).toBe('2017')
        expect(preset.baselineDateTo).toBe('2019')
      }
    })

    it('should generate unique IDs for all presets', () => {
      const presets = generateAllPresets()
      const ids = presets.map(p => p.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(presets.length)
    })
  })

  describe('getPresetsByMetric', () => {
    it('should return 18 presets for asmr', () => {
      const presets = getPresetsByMetric('asmr')
      expect(presets).toHaveLength(18)
      expect(presets.every(p => p.metric === 'asmr')).toBe(true)
    })

    it('should return 6 presets for population', () => {
      const presets = getPresetsByMetric('population')
      expect(presets).toHaveLength(6)
      expect(presets.every(p => p.metric === 'population')).toBe(true)
    })
  })

  describe('getPresetCountByMetric', () => {
    it('should return correct count based on metric-chartType validity', () => {
      // LE: only yearly (1 chartType × 3 views = 3)
      expect(getPresetCountByMetric('le')).toBe(3)
      // ASD: only yearly chart types (yearly, midyear, fluseason = 3 chartTypes × 3 views = 9)
      expect(getPresetCountByMetric('asd')).toBe(9)
      // ASMR, CMR, Deaths: all chart types (6 chartTypes × 3 views = 18)
      expect(getPresetCountByMetric('asmr')).toBe(18)
      expect(getPresetCountByMetric('cmr')).toBe(18)
      expect(getPresetCountByMetric('deaths')).toBe(18)
    })

    it('should return 6 for population', () => {
      expect(getPresetCountByMetric('population')).toBe(6)
    })
  })

  describe('getPresetById', () => {
    it('should return preset for valid ID', () => {
      const preset = getPresetById('asmr-weekly-excess')

      expect(preset).toBeDefined()
      expect(preset!.metric).toBe('asmr')
      expect(preset!.chartType).toBe('weekly')
      expect(preset!.view).toBe('excess')
    })

    it('should return undefined for invalid ID', () => {
      expect(getPresetById('invalid-preset-id')).toBeUndefined()
      expect(getPresetById('population-weekly-excess')).toBeUndefined() // population doesn't have excess
    })
  })

  describe('parsePresetId', () => {
    it('should parse valid preset ID', () => {
      const result = parsePresetId('cmr-monthly-zscore')

      expect(result).toEqual({
        metric: 'cmr',
        chartType: 'monthly',
        view: 'zscore'
      })
    })

    it('should return null for invalid format', () => {
      expect(parsePresetId('invalid')).toBeNull()
      expect(parsePresetId('too-many-parts-here')).toBeNull()
      expect(parsePresetId('')).toBeNull()
    })

    it('should return null for invalid metric', () => {
      expect(parsePresetId('invalid-weekly-normal')).toBeNull()
    })

    it('should return null for invalid chart type', () => {
      expect(parsePresetId('asmr-invalid-normal')).toBeNull()
    })

    it('should return null for invalid view', () => {
      expect(parsePresetId('asmr-weekly-invalid')).toBeNull()
    })
  })

  describe('isValidMetric', () => {
    it('should return true for valid metrics', () => {
      expect(isValidMetric('le')).toBe(true)
      expect(isValidMetric('asd')).toBe(true)
      expect(isValidMetric('asmr')).toBe(true)
      expect(isValidMetric('cmr')).toBe(true)
      expect(isValidMetric('deaths')).toBe(true)
      expect(isValidMetric('population')).toBe(true)
    })

    it('should return false for invalid metrics', () => {
      expect(isValidMetric('invalid')).toBe(false)
      expect(isValidMetric('')).toBe(false)
      expect(isValidMetric('ASMR')).toBe(false) // case sensitive
    })
  })

  describe('isValidPresetId', () => {
    it('should return true for valid preset IDs', () => {
      expect(isValidPresetId('le-weekly-normal')).toBe(true)
      expect(isValidPresetId('asmr-yearly-excess')).toBe(true)
      expect(isValidPresetId('population-fluseason-normal')).toBe(true)
    })

    it('should return false for invalid preset IDs', () => {
      expect(isValidPresetId('invalid-preset')).toBe(false)
      expect(isValidPresetId('population-weekly-excess')).toBe(false) // population can't have excess
    })
  })

  describe('presetToExplorerUrl', () => {
    it('should generate correct URL for normal view', () => {
      const preset = getPresetById('asmr-weekly-normal')!
      const url = presetToExplorerUrl(preset, 'DEU')

      expect(url).toContain('/explorer?')
      expect(url).toContain('c=DEU')
      expect(url).toContain('t=asmr')
      expect(url).toContain('ct=weekly')
      expect(url).not.toContain('e=1')
      expect(url).not.toContain('zs=1')
    })

    it('should generate correct URL for excess view', () => {
      const preset = getPresetById('deaths-monthly-excess')!
      const url = presetToExplorerUrl(preset, 'USA')

      expect(url).toContain('c=USA')
      expect(url).toContain('t=deaths')
      expect(url).toContain('ct=monthly')
      expect(url).toContain('e=1')
      expect(url).toContain('sb=1')
      expect(url).toContain('bm=mean')
      expect(url).toContain('bf=2017')
      expect(url).toContain('bt=2019')
    })

    it('should generate correct URL for zscore view', () => {
      const preset = getPresetById('cmr-yearly-zscore')!
      const url = presetToExplorerUrl(preset, 'SWE')

      expect(url).toContain('c=SWE')
      expect(url).toContain('zs=1')
      expect(url).toContain('sb=1')
      expect(url).toContain('bm=mean')
    })
  })

  describe('presetToThumbnailUrl', () => {
    it('should generate correct thumbnail URL with defaults', () => {
      const preset = getPresetById('le-quarterly-normal')!
      const url = presetToThumbnailUrl(preset, 'GBR')

      expect(url).toContain('/chart.png?')
      expect(url).toContain('c=GBR')
      expect(url).toContain('t=le')
      expect(url).toContain('ct=quarterly')
      expect(url).toContain('ti=0') // hide title
      expect(url).toContain('qr=0') // hide QR
      expect(url).toContain('l=0') // hide logo
      expect(url).toContain('cap=0') // hide caption
      expect(url).toContain('dp=2') // 2x pixel ratio
      expect(url).toContain('width=352')
      expect(url).toContain('height=198')
      expect(url).not.toContain('dm=1') // no dark mode by default
    })

    it('should include dark mode param when specified', () => {
      const preset = getPresetById('asmr-weekly-normal')!
      const url = presetToThumbnailUrl(preset, 'FRA', { darkMode: true })

      expect(url).toContain('dm=1')
    })

    it('should use custom dimensions when specified', () => {
      const preset = getPresetById('asmr-weekly-normal')!
      const url = presetToThumbnailUrl(preset, 'FRA', { width: 400, height: 225 })

      expect(url).toContain('width=400')
      expect(url).toContain('height=225')
    })

    it('should include baseline params for excess view', () => {
      const preset = getPresetById('asmr-fluseason-excess')!
      const url = presetToThumbnailUrl(preset, 'ITA')

      expect(url).toContain('e=1')
      expect(url).toContain('sb=1')
      expect(url).toContain('bm=mean')
      expect(url).toContain('bf=2017')
      expect(url).toContain('bt=2019')
    })

    it('should include baseline params for normal view (non-population)', () => {
      const preset = getPresetById('le-weekly-normal')!
      const url = presetToThumbnailUrl(preset, 'SWE')

      expect(url).toContain('sb=1')
      expect(url).toContain('bm=mean')
      expect(url).toContain('bf=2017')
      expect(url).toContain('bt=2019')
    })

    it('should not include baseline params for population', () => {
      const preset = getPresetById('population-weekly-normal')!
      const url = presetToThumbnailUrl(preset, 'SWE')

      expect(url).not.toContain('sb=1')
      expect(url).not.toContain('bm=')
      expect(url).not.toContain('bf=')
      expect(url).not.toContain('bt=')
    })
  })

  describe('groupPresetsByChartType', () => {
    it('should group presets by chart type', () => {
      const presets = getPresetsByMetric('asmr')
      const grouped = groupPresetsByChartType(presets)

      expect(Object.keys(grouped)).toHaveLength(6)
      expect(grouped.weekly).toHaveLength(3)
      expect(grouped.monthly).toHaveLength(3)
      expect(grouped.quarterly).toHaveLength(3)
      expect(grouped.yearly).toHaveLength(3)
      expect(grouped.midyear).toHaveLength(3)
      expect(grouped.fluseason).toHaveLength(3)
    })

    it('should group population presets correctly (1 per chart type)', () => {
      const presets = getPresetsByMetric('population')
      const grouped = groupPresetsByChartType(presets)

      expect(grouped.weekly).toHaveLength(1)
      expect(grouped.monthly).toHaveLength(1)
      expect(grouped.quarterly).toHaveLength(1)
      expect(grouped.yearly).toHaveLength(1)
      expect(grouped.fluseason).toHaveLength(1)
    })
  })

  describe('isYearlyChartType', () => {
    it('should return true for yearly chart types', () => {
      expect(isYearlyChartType('yearly')).toBe(true)
      expect(isYearlyChartType('midyear')).toBe(true)
      expect(isYearlyChartType('fluseason')).toBe(true)
    })

    it('should return false for sub-yearly chart types', () => {
      expect(isYearlyChartType('weekly')).toBe(false)
      expect(isYearlyChartType('monthly')).toBe(false)
      expect(isYearlyChartType('quarterly')).toBe(false)
    })
  })

  describe('isLeAvailableForChartType', () => {
    it('should return true only for yearly chart type', () => {
      expect(isLeAvailableForChartType('yearly')).toBe(true)
    })

    it('should return false for all other chart types', () => {
      expect(isLeAvailableForChartType('weekly')).toBe(false)
      expect(isLeAvailableForChartType('monthly')).toBe(false)
      expect(isLeAvailableForChartType('quarterly')).toBe(false)
      expect(isLeAvailableForChartType('midyear')).toBe(false)
      expect(isLeAvailableForChartType('fluseason')).toBe(false)
    })
  })

  describe('isMetricValidForChartType', () => {
    it('should return true for most metric/chartType combinations', () => {
      expect(isMetricValidForChartType('deaths', 'weekly')).toBe(true)
      expect(isMetricValidForChartType('cmr', 'monthly')).toBe(true)
      expect(isMetricValidForChartType('asmr', 'quarterly')).toBe(true)
      expect(isMetricValidForChartType('population', 'yearly')).toBe(true)
    })

    it('should return false for ASD with sub-yearly chart types', () => {
      expect(isMetricValidForChartType('asd', 'weekly')).toBe(false)
      expect(isMetricValidForChartType('asd', 'monthly')).toBe(false)
      expect(isMetricValidForChartType('asd', 'quarterly')).toBe(false)
    })

    it('should return true for ASD with yearly chart types', () => {
      expect(isMetricValidForChartType('asd', 'yearly')).toBe(true)
      expect(isMetricValidForChartType('asd', 'midyear')).toBe(true)
      expect(isMetricValidForChartType('asd', 'fluseason')).toBe(true)
    })

    it('should return false for LE with all non-yearly chart types', () => {
      expect(isMetricValidForChartType('le', 'weekly')).toBe(false)
      expect(isMetricValidForChartType('le', 'monthly')).toBe(false)
      expect(isMetricValidForChartType('le', 'quarterly')).toBe(false)
      expect(isMetricValidForChartType('le', 'midyear')).toBe(false)
      expect(isMetricValidForChartType('le', 'fluseason')).toBe(false)
    })

    it('should return true for LE only with yearly chart type', () => {
      expect(isMetricValidForChartType('le', 'yearly')).toBe(true)
    })
  })
})
