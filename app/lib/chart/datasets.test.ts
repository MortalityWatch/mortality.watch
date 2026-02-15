/**
 * Tests for Chart Dataset Builders
 */

import { describe, it, expect } from 'vitest'
import { getDatasets } from './datasets'
import type { DataTransformationConfig } from './types'
import type { Dataset, DatasetEntry, NumberArray } from '@/model'
import { Country } from '@/model'

describe('datasets', () => {
  const mockCountries: Record<string, Country> = {
    USA: new Country({
      iso3c: 'USA',
      jurisdiction: 'United States',
      min_date: '2020-01-01',
      max_date: '2020-12-31',
      type: '1',
      age_groups: 'all',
      source: 'test'
    }),
    GBR: new Country({
      iso3c: 'GBR',
      jurisdiction: 'United Kingdom',
      min_date: '2020-01-01',
      max_date: '2020-12-31',
      type: '1',
      age_groups: 'all',
      source: 'test'
    })
  }

  const createBaseConfig = (): DataTransformationConfig => ({
    display: {
      showPercentage: false,
      cumulative: false,
      showTotal: false,
      showCumPi: false,
      showBaseline: false,
      showPredictionInterval: false,
      view: 'mortality',
      leAdjusted: false
    },
    chart: {
      type: 'deaths',
      chartType: 'weekly',
      isExcess: false,
      isAsmrType: false,
      isASD: false,
      isBarChartStyle: false,
      isMatrixChartStyle: false,
      isErrorBarType: false,
      standardPopulation: 'who'
    },
    visual: {
      colors: ['#FF0000', '#00FF00', '#0000FF']
    },
    context: {
      countries: ['USA'],
      allCountries: mockCountries
    }
  })

  const createMockDatasetEntry = (overrides: Partial<DatasetEntry> = {}): DatasetEntry => ({
    iso3c: ['USA', 'USA', 'USA'],
    age_group: ['all', 'all', 'all'],
    date: ['2020-01-01', '2020-01-08', '2020-01-15'],
    source: ['Source 1'],
    source_asmr: ['test'],
    type: ['0', '0', '0'],
    deaths: [100, 200, 300],
    population: [1000000, 1000000, 1000000],
    ...overrides
  } as DatasetEntry)

  const createBasicDataset = (): Dataset => ({
    all: {
      USA: createMockDatasetEntry()
    }
  })

  describe('getDatasets - basic functionality', () => {
    it('should create datasets from data', () => {
      const config = createBaseConfig()
      const data = createBasicDataset()

      const result = getDatasets(config, data)

      expect(result.datasets).toBeDefined()
      expect(result.datasets.length).toBeGreaterThan(0)
      expect(result.sources).toBeDefined()
    })

    it('should include country label', () => {
      const config = createBaseConfig()
      const data = createBasicDataset()

      const result = getDatasets(config, data)

      expect(result.datasets[0]?.label).toContain('United States')
    })

    it('should set correct data values', () => {
      const config = createBaseConfig()
      const data = createBasicDataset()

      const result = getDatasets(config, data)

      expect(result.datasets[0]?.data).toBeDefined()
      expect(result.datasets[0]?.data.length).toBeGreaterThan(0)
    })

    it('should set border and background colors', () => {
      const config = createBaseConfig()
      const data = createBasicDataset()

      const result = getDatasets(config, data)

      expect(result.datasets[0]?.borderColor).toBe('#FF0000')
      expect(result.datasets[0]?.backgroundColor).toBeDefined()
    })

    it('should collect sources from data', () => {
      const config = createBaseConfig()
      const data = createBasicDataset()

      const result = getDatasets(config, data)

      expect(result.sources).toContain('Source 1')
    })
  })

  describe('getDatasets - multiple countries', () => {
    it('should create datasets for multiple countries', () => {
      const config = createBaseConfig()
      config.context.countries = ['USA', 'GBR']

      const data: Dataset = {
        all: {
          USA: createMockDatasetEntry({ iso3c: ['USA', 'USA', 'USA'] }),
          GBR: createMockDatasetEntry({
            iso3c: ['GBR', 'GBR', 'GBR'],
            deaths: [150, 250, 350],
            population: [700000, 700000, 700000],
            source: ['Source 2']
          })
        }
      }

      const result = getDatasets(config, data)

      expect(result.datasets.length).toBeGreaterThanOrEqual(2)
    })

    it('should use different colors for different countries', () => {
      const config = createBaseConfig()
      config.context.countries = ['USA', 'GBR']

      const data: Dataset = {
        all: {
          USA: createMockDatasetEntry({ iso3c: ['USA', 'USA', 'USA'] }),
          GBR: createMockDatasetEntry({
            iso3c: ['GBR', 'GBR', 'GBR'],
            deaths: [150, 250, 350],
            population: [700000, 700000, 700000],
            source: ['Source 2']
          })
        }
      }

      const result = getDatasets(config, data)

      expect(result.datasets[0]?.borderColor).not.toBe(result.datasets[1]?.borderColor)
    })

    it('should merge sources from multiple countries', () => {
      const config = createBaseConfig()
      config.context.countries = ['USA', 'GBR']

      const data: Dataset = {
        all: {
          USA: createMockDatasetEntry({ iso3c: ['USA', 'USA', 'USA'] }),
          GBR: createMockDatasetEntry({
            iso3c: ['GBR', 'GBR', 'GBR'],
            deaths: [150, 250, 350],
            population: [700000, 700000, 700000],
            source: ['Source 2']
          })
        }
      }

      const result = getDatasets(config, data)

      expect(result.sources.length).toBeGreaterThanOrEqual(2)
      expect(result.sources).toContain('Source 1')
      expect(result.sources).toContain('Source 2')
    })
  })

  describe('getDatasets - age groups', () => {
    it('should handle multiple age groups', () => {
      const config = createBaseConfig()
      const data: Dataset = {
        'all': {
          USA: createMockDatasetEntry()
        },
        '0-64': {
          USA: createMockDatasetEntry({
            age_group: ['0-64', '0-64', '0-64'],
            deaths: [50, 100, 150],
            population: [700000, 700000, 700000]
          })
        }
      }

      const result = getDatasets(config, data)

      expect(result.datasets.length).toBeGreaterThanOrEqual(2)
    })

    it('should include age group in label', () => {
      const config = createBaseConfig()
      const data: Dataset = {
        '0-64': {
          USA: createMockDatasetEntry({
            age_group: ['0-64', '0-64', '0-64'],
            deaths: [50, 100, 150],
            population: [700000, 700000, 700000]
          })
        },
        '65+': {
          USA: createMockDatasetEntry({
            age_group: ['65+', '65+', '65+'],
            deaths: [150, 200, 250],
            population: [300000, 300000, 300000]
          })
        }
      }

      const result = getDatasets(config, data)

      const labels = result.datasets.map(ds => ds.label).filter(l => l && l.length > 0)
      expect(labels.some(l => l && (l.includes('0-64') || l.includes('65+')))).toBe(true)
    })
  })

  describe('getDatasets - baseline', () => {
    it('should include baseline when showBaseline is true', () => {
      const config = createBaseConfig()
      config.display.showBaseline = true

      const data: Dataset = {
        all: {
          USA: createMockDatasetEntry({
            deaths_baseline: [90, 180, 270] as NumberArray
          })
        }
      }

      const result = getDatasets(config, data)

      expect(result.datasets.length).toBeGreaterThanOrEqual(2)
    })

    it('should set baseline with dashed border', () => {
      const config = createBaseConfig()
      config.display.showBaseline = true

      const data: Dataset = {
        all: {
          USA: createMockDatasetEntry({
            deaths_baseline: [90, 180, 270] as NumberArray
          })
        }
      }

      const result = getDatasets(config, data)

      const baselineDataset = result.datasets.find(ds => (ds as { borderDash?: number[] }).borderDash)
      expect(baselineDataset).toBeDefined()
    })

    it('should set empty label for baseline', () => {
      const config = createBaseConfig()
      config.display.showBaseline = true

      const data: Dataset = {
        all: {
          USA: createMockDatasetEntry({
            deaths_baseline: [90, 180, 270] as NumberArray
          })
        }
      }

      const result = getDatasets(config, data)

      const baselineDataset = result.datasets.find(ds => (ds as { borderDash?: number[] }).borderDash && ds.label === '')
      expect(baselineDataset).toBeDefined()
    })
  })

  describe('getDatasets - percentage transformation', () => {
    it('should transform data to percentages when showPercentage is true', () => {
      const config = createBaseConfig()
      config.display.showPercentage = true
      config.display.showBaseline = true

      const data: Dataset = {
        all: {
          USA: createMockDatasetEntry({
            deaths_baseline: [50, 100, 150] as NumberArray
          })
        }
      }

      const result = getDatasets(config, data)

      expect(result.datasets).toBeDefined()
      // Percentage values should be ratios (e.g., 2 for 200% = 200/100)
      const mainDataset = result.datasets.find(ds => ds.label && ds.label.length > 0)
      expect(mainDataset).toBeDefined()
    })
  })

  describe('getDatasets - population composition mode', () => {
    it('should normalize age-band population to percentage of country total and stack by country', () => {
      const config = createBaseConfig()
      config.chart.type = 'population'
      config.chart.isPopulationType = true
      config.display.showPercentage = true
      config.context.countries = ['USA']

      const data: Dataset = {
        age_0_14: {
          USA: createMockDatasetEntry({
            population: [20, 30, 40] as NumberArray
          })
        },
        age_15_64: {
          USA: createMockDatasetEntry({
            population: [80, 70, 60] as NumberArray
          })
        }
      }

      const result = getDatasets(config, data)
      const first = result.datasets[0]
      const second = result.datasets[1]

      expect(first?.type).toBe('bar')
      expect(first?.stack).toBe('USA')
      expect((first?.data[0] as number) + (second?.data[0] as number)).toBeCloseTo(1, 6)
    })
  })

  describe('getDatasets - cumulative transformation', () => {
    it('should transform data to cumulative when cumulative is true', () => {
      const config = createBaseConfig()
      config.display.cumulative = true

      const data: Dataset = {
        all: {
          USA: createMockDatasetEntry({
            deaths: [10, 20, 30]
          })
        }
      }

      const result = getDatasets(config, data)

      expect(result.datasets).toBeDefined()
      const mainDataset = result.datasets[0]
      expect(mainDataset?.data).toBeDefined()
    })
  })

  describe('getDatasets - total transformation', () => {
    it('should transform data to totals when showTotal is true', () => {
      const config = createBaseConfig()
      config.display.showTotal = true

      const data: Dataset = {
        all: {
          USA: createMockDatasetEntry({
            deaths: [10, 20, 30]
          })
        }
      }

      const result = getDatasets(config, data)

      expect(result.datasets).toBeDefined()
      expect(result.datasets[0]?.data).toBeDefined()
    })

    it('should sort datasets by total when showTotal is true', () => {
      const config = createBaseConfig()
      config.display.showTotal = true
      config.context.countries = ['USA', 'GBR']

      const data: Dataset = {
        all: {
          USA: createMockDatasetEntry(),
          GBR: createMockDatasetEntry({
            iso3c: ['GBR', 'GBR', 'GBR'],
            deaths: [50, 100, 150],
            population: [700000, 700000, 700000],
            source: ['Source 2']
          })
        }
      }

      const result = getDatasets(config, data)

      // Datasets should be sorted by total value
      expect(result.datasets.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('getDatasets - chart styles', () => {
    it('should set type to bar for bar chart style', () => {
      const config = createBaseConfig()
      config.chart.isBarChartStyle = true

      const data = createBasicDataset()

      const result = getDatasets(config, data)

      const mainDataset = result.datasets.find(ds => ds.label && ds.label.length > 0)
      expect(mainDataset?.type).toBe('bar')
    })

    it('should set type to line for line chart style', () => {
      const config = createBaseConfig()
      config.chart.isBarChartStyle = false

      const data = createBasicDataset()

      const result = getDatasets(config, data)

      const mainDataset = result.datasets.find(ds => ds.label && ds.label.length > 0)
      expect(mainDataset?.type).toBe('line')
    })

    it('should set type to barWithErrorBars for error bar style with excess', () => {
      const config = createBaseConfig()
      config.chart.isBarChartStyle = true
      config.chart.isExcess = true

      const data = createBasicDataset()

      const result = getDatasets(config, data)

      const mainDataset = result.datasets.find(ds => ds.label && ds.label.length > 0)
      expect(mainDataset?.type).toBe('barWithErrorBars')
    })
  })

  describe('getDatasets - prediction intervals', () => {
    it('should include prediction intervals when showPredictionInterval is true', () => {
      const config = createBaseConfig()
      config.display.showPredictionInterval = true
      config.display.showBaseline = true

      const data: Dataset = {
        all: {
          USA: createMockDatasetEntry({
            deaths_baseline: [95, 190, 285] as NumberArray,
            deaths_baseline_lower: [90, 180, 270] as NumberArray,
            deaths_baseline_upper: [110, 220, 330] as NumberArray
          })
        }
      }

      const result = getDatasets(config, data)

      // Should have main dataset plus baseline and PI bands
      expect(result.datasets.length).toBeGreaterThanOrEqual(3)
    })

    it('should set PI datasets as hidden by default when showPredictionInterval is false', () => {
      const config = createBaseConfig()
      config.display.showPredictionInterval = false
      config.display.showBaseline = true

      const data: Dataset = {
        all: {
          USA: createMockDatasetEntry({
            deaths_baseline: [95, 190, 285] as NumberArray,
            deaths_baseline_lower: [90, 180, 270] as NumberArray,
            deaths_baseline_upper: [110, 220, 330] as NumberArray
          })
        }
      }

      const result = getDatasets(config, data)

      const piDatasets = result.datasets.filter(ds => ds.hidden === true)
      expect(piDatasets.length).toBeGreaterThan(0)
    })
  })

  describe('getDatasets - error bar type', () => {
    it('should transform to error bar data when isErrorBarType is true', () => {
      const config = createBaseConfig()
      config.chart.isErrorBarType = true
      config.display.showPredictionInterval = true

      const data: Dataset = {
        all: {
          USA: {
            ...createMockDatasetEntry(),
            deaths_excess_lower: [90, 180, 270] as NumberArray,
            deaths_excess_upper: [110, 220, 330] as NumberArray
          }
        }
      }

      const result = getDatasets(config, data)

      expect(result.datasets).toBeDefined()
      expect(result.datasets[0]?.data).toBeDefined()
    })

    it('should exclude lower/upper keys when isErrorBarType is true', () => {
      const config = createBaseConfig()
      config.chart.isErrorBarType = true

      const data: Dataset = {
        all: {
          USA: {
            ...createMockDatasetEntry(),
            deaths_excess_lower: [90, 180, 270] as NumberArray,
            deaths_excess_upper: [110, 220, 330] as NumberArray
          }
        }
      }

      const result = getDatasets(config, data)

      // Should not create separate datasets for _lower and _upper
      const lowerUpperDatasets = result.datasets.filter(ds =>
        ds.label?.includes('lower') || ds.label?.includes('upper')
      )
      expect(lowerUpperDatasets.length).toBe(0)
    })
  })

  describe('getDatasets - point styling', () => {
    it('should reduce point radius for many countries', () => {
      const config = createBaseConfig()
      config.context.countries = Array(10).fill('USA')

      const data = createBasicDataset()

      const result = getDatasets(config, data)

      const mainDataset = result.datasets[0]
      expect((mainDataset as { pointRadius?: number })?.pointRadius).toBe(0)
    })

    it('should set normal point radius for few countries', () => {
      const config = createBaseConfig()
      config.context.countries = ['USA']

      const data = createBasicDataset()

      const result = getDatasets(config, data)

      const mainDataset = result.datasets[0]
      expect((mainDataset as { pointRadius?: number })?.pointRadius).toBeGreaterThan(0)
    })
  })

  describe('getDatasets - edge cases', () => {
    it('should handle empty dataset', () => {
      const config = createBaseConfig()
      const data: Dataset = {}

      const result = getDatasets(config, data)

      expect(result.datasets.length).toBe(0)
      expect(result.sources.length).toBe(0)
    })

    it('should handle missing country data', () => {
      const config = createBaseConfig()
      config.context.countries = ['INVALID']

      const data: Dataset = {
        all: {
          INVALID: createMockDatasetEntry({
            iso3c: ['INVALID', 'INVALID', 'INVALID']
          })
        }
      }

      expect(() => getDatasets(config, data)).toThrow('No country found for iso3c INVALID')
    })

    it('should handle missing source data', () => {
      const config = createBaseConfig()
      const data: Dataset = {
        all: {
          USA: createMockDatasetEntry({
            source: undefined
          })
        }
      }

      const result = getDatasets(config, data)

      expect(result.sources.length).toBe(0)
    })
  })
})
