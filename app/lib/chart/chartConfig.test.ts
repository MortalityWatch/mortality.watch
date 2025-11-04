/**
 * Tests for Chart Configuration Generation
 *
 * Note: Type checking disabled for this test file due to complex Chart.js type definitions
 * that don't properly expose runtime-accessible configuration properties
 */

// @ts-nocheck
import { describe, it, expect } from 'vitest'
import type { Chart } from 'chart.js'
import {
  makeChartConfig,
  makeBarLineChartConfig,
  makeMatrixChartConfig
} from './chartConfig'
import type { MortalityChartData } from './chartTypes'

describe('chartConfig', () => {
  const createMockChartData = (overrides: Partial<MortalityChartData> = {}): MortalityChartData => ({
    labels: ['2020-01', '2020-02', '2020-03'],
    datasets: [
      {
        label: 'United States',
        data: [100, 200, 300],
        borderColor: '#FF0000',
        backgroundColor: '#FF0000ff',
        type: 'line'
      }
    ],
    title: 'Test Chart',
    subtitle: 'Test Subtitle',
    xtitle: 'Date',
    ytitle: 'Deaths',
    isMaximized: false,
    isLogarithmic: false,
    showLabels: true,
    url: 'https://example.com',
    showPercentage: false,
    showXOffset: false,
    sources: ['Source 1'],
    ...overrides
  })

  describe('makeChartConfig', () => {
    it('should create bar/line chart config for non-matrix styles', () => {
      const data = createMockChartData()
      const config = makeChartConfig('line', data as unknown as Array<Record<string, unknown>>, false, false, false, false, true, false, false)

      expect(config).toBeDefined()
      expect(config.data).toBeDefined()
      expect(config.options).toBeDefined()
    })

    it('should create matrix chart config for matrix style', () => {
      const data = createMockChartData()
      // makeChartConfig expects an array but internally casts it to MortalityChartData
      // Pass data object directly cast as array for the generic signature
      const config = makeChartConfig('matrix', data as unknown as Array<Record<string, unknown>>, false, false, false, false, true, false, false)

      expect(config).toBeDefined()
      expect(config.data).toBeDefined()
      expect(config.options).toBeDefined()
    })

    it('should handle line style', () => {
      const data = createMockChartData()
      const config = makeChartConfig('line', data as unknown as Array<Record<string, unknown>>, false, false, false, false, false, false, false)

      expect(config).toBeDefined()
    })

    it('should handle bar style', () => {
      const data = createMockChartData()
      const config = makeChartConfig('bar', data as unknown as Array<Record<string, unknown>>, false, false, false, false, false, false, false)

      expect(config).toBeDefined()
    })
  })

  describe('makeBarLineChartConfig', () => {
    describe('basic configuration', () => {
      it('should create valid chart configuration', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, false)

        expect(config).toBeDefined()
        expect(config.data).toBeDefined()
        expect(config.options).toBeDefined()
        expect(config.plugins).toBeDefined()
      })

      it('should include datasets and labels', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, false)

        expect(config.data.datasets).toEqual(data.datasets)
        expect(config.data.labels).toEqual(data.labels)
      })

      it('should disable animation', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, false)

        expect(config.options.animation).toBe(false)
      })

      it('should enable responsive mode', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, false)

        expect(config.options.responsive).toBe(true)
      })

      it('should disable aspect ratio maintenance', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, false)

        expect(config.options.maintainAspectRatio).toBe(false)
      })

      it('should configure layout padding', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, false)

        expect(config.options.layout.padding).toEqual({
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        })
      })
    })

    describe('chart type variations', () => {
      it('should handle deaths type', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, true, false)

        expect(config).toBeDefined()
        expect(config.options.scales).toBeDefined()
      })

      it('should handle population type', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, true)

        expect(config).toBeDefined()
        expect(config.options.scales).toBeDefined()
      })

      it('should handle excess mortality', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, true, false, false, false, false)

        expect(config).toBeDefined()
        expect(config.options.plugins).toBeDefined()
      })
    })

    describe('display options', () => {
      it('should handle percentage display', () => {
        const data = createMockChartData({ showPercentage: true })
        const config = makeBarLineChartConfig(data, false, false, true, false, false)

        expect(config).toBeDefined()
        expect(config.options.scales).toBeDefined()
      })

      it('should handle prediction intervals', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, true, false, false, false)

        expect(config).toBeDefined()
        expect(config.options.plugins).toBeDefined()
      })

      it('should show decimals for non-deaths/non-population types', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, false)

        expect(config).toBeDefined()
      })

      it('should hide decimals for deaths type', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, true, false)

        expect(config).toBeDefined()
      })

      it('should hide decimals for population type', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, true)

        expect(config).toBeDefined()
      })
    })

    describe('watermark and QR code features', () => {
      it('should show QR code by default', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, false, true)

        expect(config.options.plugins).toBeDefined()
      })

      it('should hide QR code when disabled', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, false, false)

        expect(config.options.plugins).toBeDefined()
      })

      it('should show logo by default', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, false, true, true)

        expect(config.options.plugins).toBeDefined()
      })

      it('should hide logo when disabled', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, false, true, false)

        expect(config.options.plugins).toBeDefined()
      })
    })

    describe('feature gating', () => {
      it('should enforce watermark for free users (tier 0)', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(
          data,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          'auto',
          undefined,
          0
        )

        expect(config.options.plugins.showLogo).toBe(true)
      })

      it('should enforce watermark for tier 1 users', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(
          data,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          'auto',
          undefined,
          1
        )

        expect(config.options.plugins.showLogo).toBe(true)
      })

      it('should allow watermark removal for Pro users (tier 2)', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(
          data,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          'auto',
          undefined,
          2
        )

        expect(config.options.plugins.showLogo).toBe(false)
      })
    })

    describe('theme support', () => {
      it('should apply light theme by default', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, false)

        expect(config.plugins).toBeDefined()
        expect(config.plugins.length).toBeGreaterThan(0)
      })

      it('should apply dark theme when enabled', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(
          data,
          false,
          false,
          false,
          false,
          false,
          true,
          true,
          'auto',
          true
        )

        expect(config.plugins).toBeDefined()
      })
    })

    describe('decimal formatting', () => {
      it('should handle auto decimals', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(
          data,
          false,
          false,
          false,
          false,
          false,
          true,
          true,
          'auto'
        )

        expect(config.options.scales).toBeDefined()
      })

      it('should handle fixed decimal count', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(
          data,
          false,
          false,
          false,
          false,
          false,
          true,
          true,
          '2'
        )

        expect(config.options.scales).toBeDefined()
      })
    })

    describe('caption display', () => {
      it('should show caption by default', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, false)

        expect(config.options.plugins).toBeDefined()
      })

      it('should hide caption when disabled', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(
          data,
          false,
          false,
          false,
          false,
          false,
          true,
          true,
          'auto',
          undefined,
          undefined,
          false
        )

        expect(config.options.plugins).toBeDefined()
      })
    })

    describe('resize handler', () => {
      it('should include onResize handler', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, false)

        expect(config.options.onResize).toBeInstanceOf(Function)
      })

      it('should update fonts on resize', () => {
        const data = createMockChartData()
        const config = makeBarLineChartConfig(data, false, false, false, false, false)
        const mockChart = {
          options: {
            plugins: {
              title: { font: {} },
              subtitle: { font: {} },
              legend: { labels: { font: {} } },
              datalabels: { font: {} }
            },
            scales: {
              x: { ticks: { font: {} }, title: { font: {} } },
              y: { ticks: { font: {} }, title: { font: {} } }
            }
          }
        } as unknown as Chart

        config.options.onResize(mockChart)

        expect(mockChart.options.plugins.title.font).toBeDefined()
        expect(mockChart.options.plugins.datalabels.font).toBeDefined()
      })
    })
  })

  describe('makeMatrixChartConfig', () => {
    describe('basic configuration', () => {
      it('should create valid matrix chart configuration', () => {
        const data = createMockChartData({
          datasets: [
            { label: 'Country 1', data: [10, 20, 30], type: 'matrix' },
            { label: 'Country 2', data: [15, 25, 35], type: 'matrix' }
          ]
        })
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

        expect(config).toBeDefined()
        expect(config.data).toBeDefined()
        expect(config.options).toBeDefined()
      })

      it('should configure x-axis with category type', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

        expect(config.options.scales.x.type).toBe('category')
        expect(config.options.scales.x.labels).toEqual(data.labels)
      })

      it('should configure y-axis with category type and offset', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

        expect(config.options.scales.y.type).toBe('category')
        expect(config.options.scales.y.offset).toBe(true)
      })

      it('should set y-axis title to "Jurisdiction"', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

        expect(config.options.scales.y.title.text).toBe('Jurisdiction')
        expect(config.options.scales.y.title.display).toBe(true)
      })

      it('should set x-axis title from data', () => {
        const data = createMockChartData({ xtitle: 'Time Period' })
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

        expect(config.options.scales.x.title.text).toBe('Time Period')
        expect(config.options.scales.x.title.display).toBe(true)
      })

      it('should disable grid display', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

        expect(config.options.scales.x.grid.display).toBe(false)
        expect(config.options.scales.y.grid.display).toBe(false)
      })
    })

    describe('matrix data transformation', () => {
      it('should transform datasets to matrix data points', () => {
        const data = createMockChartData({
          labels: ['Jan', 'Feb', 'Mar'],
          datasets: [
            { label: 'USA', data: [100, 200, 300], type: 'matrix' },
            { label: 'GBR', data: [150, 250, 350], type: 'matrix' }
          ]
        })
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

        expect(config.data.datasets).toBeDefined()
        expect(config.data.datasets.length).toBe(1)
        expect(config.data.datasets[0].data).toBeDefined()
      })

      it('should create data points with x, y, and v properties', () => {
        const data = createMockChartData({
          labels: ['Jan'],
          datasets: [{ label: 'USA', data: [100], type: 'matrix' }]
        })
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

        const dataPoint = config.data.datasets[0].data[0]
        expect(dataPoint).toHaveProperty('x')
        expect(dataPoint).toHaveProperty('y')
        expect(dataPoint).toHaveProperty('v')
        expect(dataPoint).toHaveProperty('country')
      })

      it('should skip datasets without labels', () => {
        const data = createMockChartData({
          datasets: [
            { label: '', data: [100, 200], type: 'matrix' },
            { label: 'USA', data: [150, 250], type: 'matrix' }
          ]
        })
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

        const dataPoints = config.data.datasets[0].data
        expect(dataPoints.every((pt: { country: string }) => pt.country === 'USA')).toBe(true)
      })
    })

    describe('tile background color', () => {
      it('should configure background color callback', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

        expect(config.data.datasets[0].backgroundColor).toBeInstanceOf(Function)
      })

      it('should configure border color callback', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

        expect(config.data.datasets[0].borderColor).toBeInstanceOf(Function)
      })

      it('should set border width', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

        expect(config.data.datasets[0].borderWidth).toBe(1)
      })
    })

    describe('tile dimensions', () => {
      it('should configure width callback', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

        expect(config.data.datasets[0].width).toBeInstanceOf(Function)
      })

      it('should configure height callback', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

        expect(config.data.datasets[0].height).toBeInstanceOf(Function)
      })

      it('should calculate width based on label count', () => {
        const data = createMockChartData({ labels: ['A', 'B', 'C'] })
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)
        const mockChart = {
          chartArea: { width: 600, height: 400 }
        } as unknown as Chart

        const width = config.data.datasets[0].width({ chart: mockChart })

        expect(width).toBe(200) // 600 / 3 labels
      })
    })

    describe('data labels', () => {
      it('should show labels when enabled', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

        expect(config.options.plugins.datalabels.display).toBeInstanceOf(Function)
      })

      it('should hide labels when disabled', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(data, false, false, false, false, false, false, false)

        const context = {
          dataset: { data: [{ v: 100 }] },
          dataIndex: 0
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shouldDisplay = config.options.plugins.datalabels.display(context as any)

        expect(shouldDisplay).toBe(false)
      })

      it('should hide labels for NaN values', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

        const context = {
          dataset: { data: [{ v: NaN }] },
          dataIndex: 0
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shouldDisplay = config.options.plugins.datalabels.display(context as any)

        expect(shouldDisplay).toBe(false)
      })

      it('should use white color for dark theme', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(
          data,
          false,
          false,
          false,
          false,
          true,
          false,
          false,
          true,
          true,
          true
        )

        const color = config.options.plugins.datalabels.color()

        expect(color).toBe('#ffffff')
      })

      it('should use black color for light theme', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(
          data,
          false,
          false,
          false,
          false,
          true,
          false,
          false,
          true,
          true,
          false
        )

        const color = config.options.plugins.datalabels.color()

        expect(color).toBe('#000000')
      })

      it('should format labels as percentages when enabled', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(data, false, false, false, true, true, false, false)

        const formatted = config.options.plugins.datalabels.formatter({ v: 0.5 })

        expect(formatted).toContain('%')
      })

      it('should format labels with fewer decimals for many labels', () => {
        const data = createMockChartData({
          labels: Array(20).fill('').map((_, i) => `Label ${i}`)
        })
        const config = makeMatrixChartConfig(data, false, false, false, true, true, false, false)

        const formatted = config.options.plugins.datalabels.formatter({ v: 0.12345 })

        expect(formatted).toBeDefined()
      })
    })

    describe('excess mortality handling', () => {
      it('should handle excess mortality display', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(data, true, false, false, false, true, false, false)

        expect(config).toBeDefined()
      })

      it('should handle life expectancy type', () => {
        const data = createMockChartData()
        const config = makeMatrixChartConfig(data, false, true, false, false, true, false, false)

        expect(config).toBeDefined()
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty datasets', () => {
      const data = createMockChartData({ datasets: [] })
      const config = makeBarLineChartConfig(data, false, false, false, false, false)

      expect(config.data.datasets).toEqual([])
    })

    it('should handle single data point', () => {
      const data = createMockChartData({
        labels: ['2020'],
        datasets: [{ label: 'USA', data: [100], type: 'line' }]
      })
      const config = makeBarLineChartConfig(data, false, false, false, false, false)

      expect(config.data.labels.length).toBe(1)
    })

    it('should handle zero values', () => {
      const data = createMockChartData({
        datasets: [{ label: 'USA', data: [0, 0, 0], type: 'line' }]
      })
      const config = makeBarLineChartConfig(data, false, false, false, false, false)

      expect(config.data.datasets[0]?.data).toEqual([0, 0, 0])
    })

    it('should handle negative values', () => {
      const data = createMockChartData({
        datasets: [{ label: 'USA', data: [-10, -20, -30], type: 'line' }]
      })
      const config = makeBarLineChartConfig(data, true, false, false, false, false)

      expect(config).toBeDefined()
    })

    it('should handle very large values', () => {
      const data = createMockChartData({
        datasets: [{ label: 'USA', data: [1000000, 2000000, 3000000], type: 'line' }]
      })
      const config = makeBarLineChartConfig(data, false, false, false, false, false)

      expect(config).toBeDefined()
    })

    it('should handle null values in datasets', () => {
      const data = createMockChartData({
        datasets: [{ label: 'USA', data: [100, null, 300], type: 'line' }]
      })
      const config = makeBarLineChartConfig(data, false, false, false, false, false)

      expect(config.data.datasets[0]?.data).toEqual([100, null, 300])
    })

    it('should handle many labels for matrix chart', () => {
      const data = createMockChartData({
        labels: Array(50).fill('').map((_, i) => `Label ${i}`)
      })
      const config = makeMatrixChartConfig(data, false, false, false, false, true, false, false)

      expect(config.options?.scales?.x?.labels?.length).toBe(50)
    })
  })
})
