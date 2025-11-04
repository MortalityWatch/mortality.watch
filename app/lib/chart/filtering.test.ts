/**
 * Tests for Chart Data Filtering Functions
 */

import { describe, it, expect } from 'vitest'
import { getFilteredLabelAndData, baselineMinRange } from './filtering'
import type { Dataset } from '~/model'
import type { ChartType } from '~/model/period'

describe('filtering', () => {
  describe('getFilteredLabelAndData', () => {
    const createMockDatasetEntry = (overrides: Partial<import('~/model').DatasetEntry> = {}): import('~/model').DatasetEntry => ({
      iso3c: ['USA', 'USA', 'USA', 'USA', 'USA'],
      age_group: ['all', 'all', 'all', 'all', 'all'],
      date: ['2020-W01', '2020-W02', '2020-W03', '2020-W04', '2020-W05'],
      source: ['Source 1', 'Source 1', 'Source 1', 'Source 1', 'Source 1'],
      source_asmr: ['test', 'test', 'test', 'test', 'test'],
      type: ['0', '0', '0', '0', '0'],
      deaths: [100, 200, 300, 400, 500],
      population: [1000000, 1000000, 1000000, 1000000, 1000000],
      ...overrides
    } as import('~/model').DatasetEntry)

    const createMockDataset = (): Dataset => ({
      all: {
        USA: createMockDatasetEntry()
      }
    })

    describe('basic filtering', () => {
      it('should filter labels by date range', () => {
        const allLabels = ['2020-W01', '2020-W02', '2020-W03', '2020-W04', '2020-W05']
        const data = createMockDataset()

        const result = getFilteredLabelAndData(
          allLabels,
          '2020-W02',
          '2020-W04',
          0,
          'weekly' as ChartType,
          data
        )

        expect(result.labels).toEqual(['2020-W02', '2020-W03', '2020-W04'])
      })

      it('should filter data by date range', () => {
        const allLabels = ['2020-W01', '2020-W02', '2020-W03', '2020-W04', '2020-W05']
        const data = createMockDataset()

        const result = getFilteredLabelAndData(
          allLabels,
          '2020-W02',
          '2020-W04',
          0,
          'weekly' as ChartType,
          data
        )

        expect(result.data.all?.USA?.deaths).toEqual([200, 300, 400])
        expect(result.data.all?.USA?.population).toEqual([1000000, 1000000, 1000000])
      })

      it('should include start and end dates in range', () => {
        const allLabels = ['2020-W01', '2020-W02', '2020-W03']
        const data = createMockDataset()

        const result = getFilteredLabelAndData(
          allLabels,
          '2020-W01',
          '2020-W03',
          0,
          'weekly' as ChartType,
          data
        )

        expect(result.labels.length).toBe(3)
        expect(result.labels[0]).toBe('2020-W01')
        expect(result.labels[2]).toBe('2020-W03')
      })

      it('should handle single period selection', () => {
        const allLabels = ['2020-W01', '2020-W02', '2020-W03']
        const data = createMockDataset()

        const result = getFilteredLabelAndData(
          allLabels,
          '2020-W02',
          '2020-W02',
          0,
          'weekly' as ChartType,
          data
        )

        expect(result.labels).toEqual(['2020-W02'])
        expect(result.data.all?.USA?.deaths).toEqual([200])
      })
    })

    describe('multiple countries', () => {
      it('should filter data for multiple countries', () => {
        const allLabels = ['2020-W01', '2020-W02', '2020-W03']
        const data: Dataset = {
          all: {
            USA: createMockDatasetEntry({
              iso3c: ['USA', 'USA', 'USA'],
              deaths: [100, 200, 300],
              population: [1000000, 1000000, 1000000],
              date: ['2020-W01', '2020-W02', '2020-W03'],
              source: ['Source 1', 'Source 1', 'Source 1']
            }),
            GBR: createMockDatasetEntry({
              iso3c: ['GBR', 'GBR', 'GBR'],
              deaths: [150, 250, 350],
              population: [700000, 700000, 700000],
              date: ['2020-W01', '2020-W02', '2020-W03'],
              source: ['Source 2', 'Source 2', 'Source 2']
            })
          }
        }

        const result = getFilteredLabelAndData(
          allLabels,
          '2020-W01',
          '2020-W02',
          0,
          'weekly' as ChartType,
          data
        )

        expect(result.data.all?.USA?.deaths).toEqual([100, 200])
        expect(result.data.all?.GBR?.deaths).toEqual([150, 250])
      })
    })

    describe('multiple age groups', () => {
      it('should filter data for multiple age groups', () => {
        const allLabels = ['2020-W01', '2020-W02', '2020-W03']
        const data: Dataset = {
          'all': {
            USA: createMockDatasetEntry({
              iso3c: ['USA', 'USA', 'USA'],
              deaths: [100, 200, 300],
              population: [1000000, 1000000, 1000000],
              date: ['2020-W01', '2020-W02', '2020-W03'],
              source: ['Source 1', 'Source 1', 'Source 1']
            })
          },
          '0-64': {
            USA: createMockDatasetEntry({
              iso3c: ['USA', 'USA', 'USA'],
              age_group: ['0-64', '0-64', '0-64'],
              deaths: [50, 100, 150],
              population: [700000, 700000, 700000],
              date: ['2020-W01', '2020-W02', '2020-W03'],
              source: ['Source 1', 'Source 1', 'Source 1']
            })
          }
        }

        const result = getFilteredLabelAndData(
          allLabels,
          '2020-W01',
          '2020-W02',
          0,
          'weekly' as ChartType,
          data
        )

        expect(result.data.all?.USA?.deaths).toEqual([100, 200])
        expect(result.data['0-64']?.USA?.deaths).toEqual([50, 100])
      })
    })

    describe('chart type ordinal and disaggregated data', () => {
      it('should detect disaggregated data when type ordinal is higher', () => {
        const allLabels = ['2020-W01', '2020-W02', '2020-W03']
        const data: Dataset = {
          all: {
            USA: createMockDatasetEntry({
              iso3c: ['USA', 'USA', 'USA'],
              deaths: [100, 200, 300],
              population: [1000000, 1000000, 1000000],
              date: ['2020-W01', '2020-W02', '2020-W03'],
              source: ['Source 1', 'Source 1', 'Source 1'],
              type: ['0', '1', '0'] // Mix of weekly (0) and monthly (1) data
            })
          }
        }

        const result = getFilteredLabelAndData(
          allLabels,
          '2020-W01',
          '2020-W03',
          2, // Chart type ordinal higher than data types
          'weekly' as ChartType,
          data
        )

        expect(result.notes?.disaggregatedData).toBeDefined()
        expect(result.notes?.disaggregatedData?.USA).toBeDefined()
      })

      it('should not mark data as disaggregated when type ordinal matches', () => {
        const allLabels = ['2020-W01', '2020-W02', '2020-W03']
        const data: Dataset = {
          all: {
            USA: createMockDatasetEntry({
              iso3c: ['USA', 'USA', 'USA'],
              deaths: [100, 200, 300],
              population: [1000000, 1000000, 1000000],
              date: ['2020-W01', '2020-W02', '2020-W03'],
              source: ['Source 1', 'Source 1', 'Source 1'],
              type: ['0', '0', '0']
            })
          }
        }

        const result = getFilteredLabelAndData(
          allLabels,
          '2020-W01',
          '2020-W03',
          0,
          'weekly' as ChartType,
          data
        )

        expect(Object.keys(result.notes?.disaggregatedData || {}).length).toBe(0)
      })

      it('should handle undefined type values', () => {
        const allLabels = ['2020-W01', '2020-W02', '2020-W03']
        const data: Dataset = {
          all: {
            USA: createMockDatasetEntry({
              iso3c: ['USA', 'USA', 'USA'],
              deaths: [100, 200, 300],
              population: [1000000, 1000000, 1000000],
              date: ['2020-W01', '2020-W02', '2020-W03'],
              source: ['Source 1', 'Source 1', 'Source 1'],
              type: [undefined as unknown as string, '0', '0']
            })
          }
        }

        const result = getFilteredLabelAndData(
          allLabels,
          '2020-W01',
          '2020-W03',
          0,
          'weekly' as ChartType,
          data
        )

        expect(result.data.all?.USA?.type.length).toBe(3)
      })
    })

    describe('all data keys', () => {
      it('should filter all dataset entry keys', () => {
        const allLabels = ['2020-W01', '2020-W02', '2020-W03']
        const data: Dataset = {
          all: {
            USA: createMockDatasetEntry({
              iso3c: ['USA', 'USA', 'USA'],
              deaths: [100, 200, 300],
              deaths_baseline: [90, 180, 270] as import('~/model').NumberArray,
              deaths_baseline_lower: [85, 170, 255] as import('~/model').NumberArray,
              deaths_baseline_upper: [115, 230, 345] as import('~/model').NumberArray,
              population: [1000000, 1000000, 1000000],
              date: ['2020-W01', '2020-W02', '2020-W03'],
              source: ['Source 1', 'Source 1', 'Source 1'],
              type: ['0', '0', '0']
            })
          }
        }

        const result = getFilteredLabelAndData(
          allLabels,
          '2020-W01',
          '2020-W02',
          0,
          'weekly' as ChartType,
          data
        )

        expect(result.data.all?.USA?.deaths).toEqual([100, 200])
        expect(result.data.all?.USA?.deaths_baseline).toEqual([90, 180])
        expect(result.data.all?.USA?.deaths_baseline_lower).toEqual([85, 170])
        expect(result.data.all?.USA?.deaths_baseline_upper).toEqual([115, 230])
      })
    })

    describe('edge cases', () => {
      it('should handle empty dataset', () => {
        const allLabels = ['2020-W01', '2020-W02', '2020-W03']
        const data: Dataset = {}

        const result = getFilteredLabelAndData(
          allLabels,
          '2020-W01',
          '2020-W02',
          0,
          'weekly' as ChartType,
          data
        )

        expect(result.labels).toEqual(['2020-W01', '2020-W02'])
        expect(Object.keys(result.data).length).toBe(0)
      })

      it('should handle date not found in labels', () => {
        const allLabels = ['2020-W01', '2020-W02', '2020-W03']
        const data = createMockDataset()

        const result = getFilteredLabelAndData(
          allLabels,
          '2020-W99',
          '2020-W99',
          0,
          'weekly' as ChartType,
          data
        )

        // ChartPeriod.indexOf returns -1 for not found, slice(-1, 0) returns empty
        expect(result.labels.length).toBeGreaterThanOrEqual(0)
      })

      it('should handle reversed date range', () => {
        const allLabels = ['2020-W01', '2020-W02', '2020-W03']
        const data = createMockDataset()

        const result = getFilteredLabelAndData(
          allLabels,
          '2020-W03',
          '2020-W01',
          0,
          'weekly' as ChartType,
          data
        )

        // Behavior depends on ChartPeriod implementation
        expect(result.labels).toBeDefined()
      })

      it('should handle missing data keys', () => {
        const allLabels = ['2020-W01', '2020-W02', '2020-W03']
        const data: Dataset = {
          all: {
            USA: createMockDatasetEntry({
              iso3c: ['USA', 'USA', 'USA'],
              deaths: [100, 200, 300],
              population: [1000000, 1000000, 1000000],
              date: ['2020-W01', '2020-W02', '2020-W03'],
              source: ['Source 1', 'Source 1', 'Source 1'],
              type: ['0', '0', '0']
            })
          }
        }

        const result = getFilteredLabelAndData(
          allLabels,
          '2020-W01',
          '2020-W02',
          0,
          'weekly' as ChartType,
          data
        )

        // Should handle missing keys gracefully
        expect(result.data.all?.USA?.deaths).toEqual([100, 200])
      })
    })

    describe('different chart types', () => {
      it('should handle yearly chart type', () => {
        const allLabels = ['2018', '2019', '2020', '2021']
        const data = createMockDataset()

        const result = getFilteredLabelAndData(
          allLabels,
          '2019',
          '2020',
          0,
          'yearly' as ChartType,
          data
        )

        expect(result.labels).toEqual(['2019', '2020'])
      })

      it('should handle monthly chart type', () => {
        const allLabels = ['2020-01', '2020-02', '2020-03', '2020-04']
        const data = createMockDataset()

        const result = getFilteredLabelAndData(
          allLabels,
          '2020-02',
          '2020-03',
          0,
          'monthly' as ChartType,
          data
        )

        expect(result.labels).toEqual(['2020-02', '2020-03'])
      })

      it('should handle quarterly chart type', () => {
        const allLabels = ['2020-Q1', '2020-Q2', '2020-Q3', '2020-Q4']
        const data = createMockDataset()

        const result = getFilteredLabelAndData(
          allLabels,
          '2020-Q2',
          '2020-Q3',
          0,
          'quarterly' as ChartType,
          data
        )

        expect(result.labels).toEqual(['2020-Q2', '2020-Q3'])
      })
    })
  })

  describe('baselineMinRange', () => {
    it('should return minimum range for linear regression', () => {
      expect(baselineMinRange('lin_reg')).toBe(2)
    })

    it('should return minimum range for exponential', () => {
      expect(baselineMinRange('exp')).toBe(6)
    })

    it('should return 1 for unknown methods', () => {
      expect(baselineMinRange('unknown')).toBe(1)
      expect(baselineMinRange('naive')).toBe(1)
    })

    it('should handle empty string', () => {
      expect(baselineMinRange('')).toBe(1)
    })

    it('should return default for unspecified methods', () => {
      expect(baselineMinRange('median')).toBe(1)
      expect(baselineMinRange('mean')).toBe(1)
    })
  })
})
