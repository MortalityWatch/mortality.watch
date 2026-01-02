/**
 * Tests for Chart Configuration Helper Functions
 */

import { describe, it, expect, vi } from 'vitest'
import type { Chart, TooltipItem, Scale, CoreScaleOptions } from 'chart.js'
import {
  createBackgroundPlugin,
  createOnResizeHandler,
  getLabelText,
  createTooltipCallbacks,
  createDatalabelsConfig,
  createPluginsConfig,
  createScalesConfig
} from './config'
import { makeBarLineChartConfig } from './chartConfig'
import type { ChartErrorDataPoint, MortalityChartData } from './chartTypes'

describe('chartConfigHelpers', () => {
  describe('createBackgroundPlugin', () => {
    it('should create plugin with light background by default', () => {
      const plugin = createBackgroundPlugin()

      expect(plugin).toBeDefined()
      expect(plugin.id).toBe('customCanvasBackgroundColor')
      expect(plugin.beforeDraw).toBeInstanceOf(Function)
    })

    it('should create plugin with dark background when isDark is true', () => {
      const plugin = createBackgroundPlugin(true)

      expect(plugin).toBeDefined()
      expect(plugin.id).toBe('customCanvasBackgroundColor')
    })

    it('should draw background on chart', () => {
      const plugin = createBackgroundPlugin()
      const mockChart = {
        ctx: {
          save: vi.fn(),
          restore: vi.fn(),
          fillRect: vi.fn(),
          fillStyle: ''
        },
        width: 800,
        height: 600
      } as unknown as Chart

      plugin.beforeDraw(mockChart)

      expect(mockChart.ctx.save).toHaveBeenCalled()
      expect(mockChart.ctx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600)
      expect(mockChart.ctx.restore).toHaveBeenCalled()
    })
  })

  describe('createOnResizeHandler', () => {
    it('should create a resize handler function', () => {
      const handler = createOnResizeHandler()

      expect(handler).toBeInstanceOf(Function)
    })

    it('should update chart fonts on resize', () => {
      const handler = createOnResizeHandler()
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

      handler(mockChart)

      expect(mockChart.options.plugins!.title!.font).toBeDefined()
      expect(mockChart.options.plugins!.subtitle!.font).toBeDefined()
      expect(mockChart.options.plugins!.legend!.labels!.font).toBeDefined()
    })
  })

  describe('getLabelText', () => {
    describe('basic formatting', () => {
      it('should format simple label with value', () => {
        const result = getLabelText('Test', 100, undefined, false, false, false, true, 'auto')

        expect(result).toContain('Test')
        expect(result).toContain('100')
      })

      it('should handle empty label', () => {
        const result = getLabelText('', 100, undefined, false, false, false, true, 'auto')

        expect(result).not.toContain(':')
        expect(result).toContain('100')
      })

      it('should add colon for non-empty label', () => {
        const result = getLabelText('Label', 100, undefined, false, false, false, true, 'auto')

        expect(result).toContain('Label:')
      })
    })

    describe('percentage formatting', () => {
      it('should format as percentage when isPercentage is true', () => {
        const result = getLabelText('Test', 0.5, undefined, false, false, true, true, 'auto')

        expect(result).toContain('%')
      })

      it('should handle negative percentages', () => {
        const result = getLabelText('Test', -0.25, undefined, false, false, true, true, 'auto')

        expect(result).toContain('-25')
        expect(result).toContain('%')
      })

      it('should format percentage with decimals', () => {
        const result = getLabelText('Test', 0.1234, undefined, false, false, true, true, 'auto')

        expect(result).toMatch(/\d+\.\d+%/)
      })
    })

    describe('excess formatting', () => {
      it('should handle excess values', () => {
        const result = getLabelText('Test', 100, undefined, false, true, false, true, 'auto')

        expect(result).toBeDefined()
        expect(result).toContain('100')
      })

      it('should format positive excess values', () => {
        const result = getLabelText('Test', 50, undefined, false, true, false, true, 'auto')

        expect(result).toContain('50')
      })

      it('should format negative excess values', () => {
        const result = getLabelText('Test', -50, undefined, false, true, false, true, 'auto')

        expect(result).toContain('-50')
      })
    })

    describe('prediction interval', () => {
      it('should include prediction interval when provided', () => {
        const pi = { min: 90, max: 110 }
        const result = getLabelText('Test', 100, pi, false, false, false, true, 'auto')

        expect(result).toContain('95% PI')
        expect(result).toContain('90')
        expect(result).toContain('110')
      })

      it('should format short prediction interval', () => {
        const pi = { min: 90, max: 110 }
        const result = getLabelText('Test', 100, pi, true, false, false, true, 'auto')

        expect(result).not.toContain('95% PI')
        expect(result).toContain('90')
        expect(result).toContain('110')
      })

      it('should include PI for percentage values', () => {
        const pi = { min: 0.4, max: 0.6 }
        const result = getLabelText('Test', 0.5, pi, false, false, true, true, 'auto')

        expect(result).toContain('95% PI')
        expect(result).toMatch(/40.*%/)
        expect(result).toMatch(/60.*%/)
      })
    })

    describe('decimal handling', () => {
      it('should respect showDecimals option', () => {
        const result1 = getLabelText('Test', 100.5, undefined, false, false, false, true, 'auto')
        const result2 = getLabelText('Test', 100.5, undefined, false, false, false, false, 'auto')

        expect(result1).toBeDefined()
        expect(result2).toBeDefined()
      })

      it('should handle auto decimals', () => {
        const result = getLabelText('Test', 100, undefined, false, false, false, true, 'auto')

        expect(result).toBeDefined()
      })

      it('should handle fixed decimal count', () => {
        const result = getLabelText('Test', 100.456, undefined, false, false, false, true, '2')

        expect(result).toMatch(/100\.\d{2}/)
      })
    })

    describe('short format', () => {
      it('should use short format when short is true', () => {
        const result = getLabelText('Test', 100, undefined, true, false, false, true, 'auto')

        expect(result).toBeDefined()
      })

      it('should adjust decimals for large numbers in short format', () => {
        const result = getLabelText('Test', 1000, undefined, true, false, false, true, 'auto')

        expect(result).toBeDefined()
      })
    })
  })

  describe('createTooltipCallbacks', () => {
    it('should create tooltip callbacks object', () => {
      const callbacks = createTooltipCallbacks(false, false, false, true, 'auto')

      expect(callbacks).toBeDefined()
      expect(callbacks.title).toBeInstanceOf(Function)
      expect(callbacks.label).toBeInstanceOf(Function)
    })

    it('should format tooltip title with country and period', () => {
      const callbacks = createTooltipCallbacks(false, false, false, true, 'auto')
      const items = [{
        dataset: { label: 'Test Dataset' },
        label: '2023',
        parsed: { y: 100 } as unknown as ChartErrorDataPoint
      }] as any as TooltipItem<'line'>[] // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = callbacks.title(items)

      expect(result).toContain('Test Dataset')
      expect(result).toContain('2023')
    })

    it('should format tooltip label for simple values', () => {
      const callbacks = createTooltipCallbacks(false, false, false, true, 'auto')
      const context = {
        dataset: { label: 'Test Dataset' },
        parsed: { y: 100 } as unknown as ChartErrorDataPoint
      } as any as TooltipItem<'line'> // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = callbacks.label(context)

      // Label now shows just the value (country is in title)
      expect(result).toContain('100')
    })

    it('should include prediction interval when showPi is true', () => {
      const callbacks = createTooltipCallbacks(true, false, false, true, 'auto')
      const context = {
        dataset: { label: 'Test' },
        parsed: { y: 100, yMin: 90, yMax: 110 } as unknown as ChartErrorDataPoint
      } as any as TooltipItem<'line'> // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = callbacks.label(context)

      expect(result).toContain('95% PI')
    })

    it('should handle missing label', () => {
      const callbacks = createTooltipCallbacks(false, false, false, true, 'auto')
      const context = {
        dataset: {},
        parsed: { y: 100 } as unknown as ChartErrorDataPoint
      } as any as TooltipItem<'line'> // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = callbacks.label(context)

      expect(result).toBeDefined()
    })

    it('should format as percentage when showPercentage is true', () => {
      const callbacks = createTooltipCallbacks(false, false, true, true, 'auto')
      const context = {
        dataset: { label: 'Test' },
        parsed: { y: 0.5 } as unknown as ChartErrorDataPoint
      } as any as TooltipItem<'line'> // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = callbacks.label(context)

      expect(result).toContain('%')
    })

    it('should handle yMinMin and yMaxMax for PI', () => {
      const callbacks = createTooltipCallbacks(true, false, false, true, 'auto')
      const context = {
        dataset: { label: 'Test' },
        parsed: { y: 100, yMinMin: 85, yMaxMax: 115 } as unknown as ChartErrorDataPoint
      } as any as TooltipItem<'line'> // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = callbacks.label(context)

      expect(result).toContain('95% PI')
    })
  })

  describe('createDatalabelsConfig', () => {
    const mockData: MortalityChartData = {
      labels: ['2020', '2021'],
      datasets: [],
      title: 'Test',
      subtitle: '',
      xtitle: 'Year',
      ytitle: 'Deaths',
      isMaximized: false,
      showLogarithmic: false,
      showLabels: true,
      url: '',
      showPercentage: false,
      showXOffset: false,
      sources: []
    }

    it('should create datalabels configuration', () => {
      const config = createDatalabelsConfig(mockData, false, false, false, true, 'auto')

      expect(config).toBeDefined()
      expect(config.anchor).toBe('end')
      expect(config.align).toBe('end')
    })

    it('should show labels when showLabels is true', () => {
      const config = createDatalabelsConfig(mockData, false, false, false, true, 'auto')
      expect(config.showLabels).toBe(true)
    })

    it('should hide labels when showLabels is false', () => {
      const dataWithoutLabels = { ...mockData, showLabels: false }
      const config = createDatalabelsConfig(dataWithoutLabels, false, false, false, true, 'auto')
      expect(config.showLabels).toBe(false)
    })

    it('should configure formatter config for simple values', () => {
      const config = createDatalabelsConfig(mockData, false, false, false, true, 'auto')
      expect(config.formatterConfig).toBeDefined()
      expect(config.formatterConfig?.showPi).toBe(false)
      expect(config.formatterConfig?.isExcess).toBe(false)
      expect(config.formatterConfig?.showPercentage).toBe(false)
      expect(config.formatterConfig?.showDecimals).toBe(true)
    })

    it('should configure formatter config for prediction intervals', () => {
      const config = createDatalabelsConfig(mockData, true, false, false, true, 'auto')
      expect(config.formatterConfig?.showPi).toBe(true)
    })

    it('should configure formatter config for excess values', () => {
      const config = createDatalabelsConfig(mockData, false, true, false, true, 'auto')
      expect(config.formatterConfig?.isExcess).toBe(true)
    })

    it('should configure formatter config for percentage values', () => {
      const config = createDatalabelsConfig(mockData, false, false, true, true, 'auto')
      expect(config.formatterConfig?.showPercentage).toBe(true)
    })

    it('should use light color for dark theme', () => {
      const config = createDatalabelsConfig(mockData, false, false, false, true, 'auto', true)
      expect(config.textColor).toBe('#ffffff')
    })

    it('should use dark color for light theme', () => {
      const config = createDatalabelsConfig(mockData, false, false, false, true, 'auto', false)
      expect(config.textColor).toBe('#000000')
    })
  })

  describe('createPluginsConfig', () => {
    const mockData: MortalityChartData = {
      labels: ['2020', '2021'],
      datasets: [],
      title: 'Test Chart',
      subtitle: 'Test Subtitle',
      xtitle: 'Year',
      ytitle: 'Deaths',
      isMaximized: false,
      showLogarithmic: false,
      showLabels: true,
      url: 'https://example.com',
      showPercentage: false,
      showXOffset: false,
      sources: []
    }

    it('should create plugins configuration', () => {
      const config = createPluginsConfig(mockData, false, false, false, true, 'auto', false, false)

      expect(config).toBeDefined()
      expect(config.title).toBeDefined()
      expect(config.subtitle).toBeDefined()
      expect(config.legend).toBeDefined()
      expect(config.tooltip).toBeDefined()
      expect(config.customDatalabels).toBeDefined()
    })

    it('should configure title with data.title', () => {
      const config = createPluginsConfig(mockData, false, false, false, true, 'auto', false, false)

      expect(config.title.text).toBe('Test Chart')
      expect(config.title.display).toBe(true)
    })

    it('should configure subtitle with data.subtitle', () => {
      const config = createPluginsConfig(mockData, false, false, false, true, 'auto', false, false)

      expect(config.subtitle.text).toBe('Test Subtitle')
      expect(config.subtitle.position).toBe('bottom')
    })

    it('should hide caption when showCaption is false', () => {
      const config = createPluginsConfig(mockData, false, false, false, true, 'auto', false, false, false)

      expect(config.subtitle.display).toBe(false)
    })

    it('should show caption when showCaption is true', () => {
      const config = createPluginsConfig(mockData, false, false, false, true, 'auto', false, false, true)

      expect(config.subtitle.display).toBe(true)
    })

    it('should hide legend when showLegend is false', () => {
      const config = createPluginsConfig(mockData, false, false, false, true, 'auto', false, false, true, true, false)

      expect(config.legend.display).toBe(false)
    })

    it('should show legend when showLegend is true', () => {
      const config = createPluginsConfig(mockData, false, false, false, true, 'auto', false, false, true, true, true)

      expect(config.legend.display).toBe(true)
    })

    it('should configure legend with filter', () => {
      const config = createPluginsConfig(mockData, false, false, false, true, 'auto', false, false)

      expect(config.legend.labels.filter).toBeInstanceOf(Function)
      expect(config.legend.labels.filter({ text: 'test' })).toBe(true)
      expect(config.legend.labels.filter({ text: '' })).toBe(false)
    })

    it('should add QR code when showQrCode is true and url exists', () => {
      const config = createPluginsConfig(mockData, false, false, false, true, 'auto', true, false)

      expect(config).toHaveProperty('qrCodeUrl', 'https://example.com')
    })

    it('should not add QR code when showQrCode is false', () => {
      const config = createPluginsConfig(mockData, false, false, false, true, 'auto', false, false)

      expect(config).not.toHaveProperty('qrCodeUrl')
    })

    it('should configure showLogo', () => {
      const config1 = createPluginsConfig(mockData, false, false, false, true, 'auto', false, true)
      const config2 = createPluginsConfig(mockData, false, false, false, true, 'auto', false, false)

      expect(config1.showLogo).toBe(true)
      expect(config2.showLogo).toBe(false)
    })

    it('should use dark theme colors when isDark is true', () => {
      const config = createPluginsConfig(mockData, false, false, false, true, 'auto', false, false, true, true, true, 'zscore', true)

      expect(config.title.color).toBeDefined()
      expect(config.subtitle.color).toBeDefined()
      expect(config.legend.labels.color).toBeDefined()
    })
  })

  describe('createScalesConfig', () => {
    const mockData: MortalityChartData = {
      labels: ['2020', '2021'],
      datasets: [],
      title: 'Test',
      subtitle: '',
      xtitle: 'Year',
      ytitle: 'Deaths per 100k',
      isMaximized: true,
      showLogarithmic: false,
      showLabels: true,
      url: '',
      showPercentage: false,
      showXOffset: true,
      sources: []
    }

    it('should create scales configuration', () => {
      const config = createScalesConfig(mockData, false, false, true, 'auto')

      expect(config).toBeDefined()
      expect(config.x).toBeDefined()
      expect(config.y).toBeDefined()
    })

    it('should configure x-axis', () => {
      const config = createScalesConfig(mockData, false, false, true, 'auto')

      expect(config.x.title.text).toBe('Year')
      expect(config.x.title.display).toBe(true)
      expect(config.x.offset).toBe(true)
    })

    it('should configure y-axis with linear scale by default', () => {
      const config = createScalesConfig(mockData, false, false, true, 'auto')

      expect(config.y.type).toBe('linear')
      expect(config.y.title.text).toBe('Deaths per 100k')
    })

    it('should configure y-axis with logarithmic scale when showLogarithmic is true', () => {
      const logData = { ...mockData, showLogarithmic: true }
      const config = createScalesConfig(logData, false, false, true, 'auto')

      expect(config.y.type).toBe('logarithmic')
    })

    it('should set beginAtZero based on isMaximized', () => {
      const config1 = createScalesConfig(mockData, false, false, true, 'auto')
      const config2 = createScalesConfig({ ...mockData, isMaximized: false }, false, false, true, 'auto')

      expect(config1.y.beginAtZero).toBe(true)
      expect(config2.y.beginAtZero).toBe(false)
    })

    it('should configure y-axis tick callback', () => {
      const config = createScalesConfig(mockData, false, false, true, 'auto')

      expect(config.y.ticks.callback).toBeInstanceOf(Function)
    })

    it('should format y-axis ticks correctly', () => {
      const config = createScalesConfig(mockData, false, false, true, 'auto')
      const mockScale = {} as any as Scale<CoreScaleOptions> // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = config.y.ticks.callback.call(mockScale, 1000)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should handle percentage formatting in y-axis ticks', () => {
      const config = createScalesConfig(mockData, false, true, true, 'auto')
      const mockScale = {} as any as Scale<CoreScaleOptions> // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = config.y.ticks.callback.call(mockScale, 0.5)

      expect(result).toContain('%')
    })

    it('should configure grid colors', () => {
      const config = createScalesConfig(mockData, false, false, true, 'auto')

      expect(config.x.grid.color).toBeDefined()
      expect(config.y.grid.color).toBeDefined()
    })

    it('should configure grid line widths', () => {
      const config = createScalesConfig(mockData, false, false, true, 'auto')

      expect(config.y.grid.lineWidth).toBeInstanceOf(Function)
    })

    it('should use dark theme colors when isDark is true', () => {
      const config = createScalesConfig(mockData, false, false, true, 'auto', true)

      expect(config.x.title.color).toBeDefined()
      expect(config.y.title.color).toBeDefined()
    })

    it('should hide x-axis title when showXAxisTitle is false', () => {
      const config = createScalesConfig(mockData, false, false, true, 'auto', false, false, false, false)

      expect(config.x.title.display).toBe(false)
    })

    it('should show x-axis title when showXAxisTitle is true', () => {
      const config = createScalesConfig(mockData, false, false, true, 'auto', false, false, false, true)

      expect(config.x.title.display).toBe(true)
    })

    it('should hide y-axis title when showYAxisTitle is false', () => {
      const config = createScalesConfig(mockData, false, false, true, 'auto', false, false, false, true, false)

      expect(config.y.title.display).toBe(false)
    })

    it('should show y-axis title when showYAxisTitle is true', () => {
      const config = createScalesConfig(mockData, false, false, true, 'auto', false, false, false, true, true)

      expect(config.y.title.display).toBe(true)
    })
  })

  describe('makeBarLineChartConfig legend auto-hide', () => {
    const createMockDataWithDatasets = (labels: string[]): MortalityChartData => ({
      datasets: labels.map(label => ({
        label,
        data: [1, 2, 3],
        borderColor: '#000',
        backgroundColor: '#000'
      })),
      labels: ['2020', '2021', '2022'],
      title: 'Test Chart',
      subtitle: 'Test Subtitle',
      xtitle: 'Year',
      ytitle: 'Value',
      showLabels: false
    })

    it('should auto-hide legend when there is only one visible series', () => {
      const data = createMockDataWithDatasets(['USA'])
      const config = makeBarLineChartConfig(
        data,
        false, // isExcess
        false, // showPi
        false, // showPercentage
        false, // isDeathsType
        false, // isPopulationType
        false, // showQrCode
        false, // showLogo
        'auto', // decimals
        false, // isDark
        undefined, // userTier
        true, // showCaption
        true, // showTitle
        false, // isSSR
        'line', // chartStyle
        true, // showLegend - user wants to show, but auto-hide should apply
        true, // showXAxisTitle
        true // showYAxisTitle
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((config.options as any).plugins.legend.display).toBe(false)
    })

    it('should show legend when there are multiple visible series', () => {
      const data = createMockDataWithDatasets(['USA', 'Germany'])
      const config = makeBarLineChartConfig(
        data,
        false, // isExcess
        false, // showPi
        false, // showPercentage
        false, // isDeathsType
        false, // isPopulationType
        false, // showQrCode
        false, // showLogo
        'auto', // decimals
        false, // isDark
        undefined, // userTier
        true, // showCaption
        true, // showTitle
        false, // isSSR
        'line', // chartStyle
        true, // showLegend
        true, // showXAxisTitle
        true // showYAxisTitle
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((config.options as any).plugins.legend.display).toBe(true)
    })

    it('should hide legend when user explicitly sets showLegend to false', () => {
      const data = createMockDataWithDatasets(['USA', 'Germany'])
      const config = makeBarLineChartConfig(
        data,
        false, // isExcess
        false, // showPi
        false, // showPercentage
        false, // isDeathsType
        false, // isPopulationType
        false, // showQrCode
        false, // showLogo
        'auto', // decimals
        false, // isDark
        undefined, // userTier
        true, // showCaption
        true, // showTitle
        false, // isSSR
        'line', // chartStyle
        false, // showLegend - user explicitly hides
        true, // showXAxisTitle
        true // showYAxisTitle
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((config.options as any).plugins.legend.display).toBe(false)
    })

    it('should not count empty labels as visible series', () => {
      // Baseline and PI datasets have empty labels
      const data = createMockDataWithDatasets(['USA', '', ''])
      const config = makeBarLineChartConfig(
        data,
        false, // isExcess
        false, // showPi
        false, // showPercentage
        false, // isDeathsType
        false, // isPopulationType
        false, // showQrCode
        false, // showLogo
        'auto', // decimals
        false, // isDark
        undefined, // userTier
        true, // showCaption
        true, // showTitle
        false, // isSSR
        'line', // chartStyle
        true, // showLegend
        true, // showXAxisTitle
        true // showYAxisTitle
      )

      // Only 'USA' is a visible series, so legend should be hidden
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((config.options as any).plugins.legend.display).toBe(false)
    })
  })
})
