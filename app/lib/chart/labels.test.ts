/**
 * Tests for Chart Label Builders
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getChartLabels, blDescription } from './labels'

describe('labels', () => {
  describe('blDescription', () => {
    it('should format naive baseline description', () => {
      const result = blDescription('naive', '2015', '2019')

      expect(result).toContain('Baseline:')
      expect(result).toContain('2019')
      expect(result).not.toContain('2015')
    })

    it('should format linear regression baseline description', () => {
      const result = blDescription('lin_reg', '2015', '2019')

      expect(result).toContain('Baseline:')
      expect(result).toContain('2015-2019')
    })

    it('should format exponential baseline description', () => {
      const result = blDescription('exp', '2015', '2019')

      expect(result).toContain('Baseline:')
      expect(result).toContain('2015-2019')
    })

    it('should include method name in description', () => {
      const result = blDescription('lin_reg', '2015', '2019')

      expect(result).toContain('Linear')
    })
  })

  describe('getChartLabels', () => {
    // Helper function to call getChartLabels with default parameters
    const callGetChartLabels = (overrides: Partial<{
      countries: string[]
      standardPopulation: string
      ageGroups: string[]
      showPredictionInterval: boolean
      isExcess: boolean
      type: string
      cumulative: boolean
      showBaseline: boolean
      baselineMethod: string
      baselineDateFrom: string
      baselineDateTo: string
      showTotal: boolean
      chartType: string
      view: string
      leAdjusted: boolean
    }> = {}) => {
      const defaults = {
        countries: ['USA'],
        standardPopulation: 'who',
        ageGroups: ['all'],
        showPredictionInterval: false,
        isExcess: false,
        type: 'deaths',
        cumulative: false,
        showBaseline: false,
        baselineMethod: 'lin_reg',
        baselineDateFrom: '2015',
        baselineDateTo: '2019',
        showTotal: false,
        chartType: 'weekly',
        view: undefined as string | undefined,
        leAdjusted: undefined as boolean | undefined
      }
      const params = { ...defaults, ...overrides }
      return getChartLabels(
        params.countries,
        params.standardPopulation,
        params.ageGroups,
        params.showPredictionInterval,
        params.isExcess,
        params.type,
        params.cumulative,
        params.showBaseline,
        params.baselineMethod,
        params.baselineDateFrom,
        params.baselineDateTo,
        params.showTotal,
        params.chartType,
        params.view,
        params.leAdjusted
      )
    }

    describe('title generation', () => {
      it('should generate title for deaths', () => {
        const result = callGetChartLabels({ type: 'deaths' })

        expect(result.title).toContain('Deaths')
      })

      it('should generate title for excess deaths', () => {
        const result = callGetChartLabels({ type: 'deaths', isExcess: true })

        expect(result.title).toContain('Excess Deaths')
      })

      it('should generate title for population', () => {
        const result = callGetChartLabels({ type: 'population' })

        expect(result.title).toContain('Population')
      })

      it('should generate title for crude mortality rate', () => {
        const result = callGetChartLabels({ type: 'cmr' })

        expect(result.title.join(' ')).toContain('Mortality')
      })

      it('should generate title for ASMR', () => {
        const result = callGetChartLabels({ type: 'asmr' })

        expect(result.title.join(' ')).toContain('Age-Standardized')
      })

      it('should generate title for life expectancy', () => {
        const result = callGetChartLabels({ type: 'le' })

        expect(result.title).toContain('Life Expectancy')
      })

      it('should include cumulative in title when cumulative is true', () => {
        const result = callGetChartLabels({ type: 'deaths', cumulative: true })

        expect(result.title.join(' ')).toContain('Cumulative')
      })

      it('should include age group in title for single age group', () => {
        const result = callGetChartLabels({ type: 'deaths', ageGroups: ['0-64'] })

        expect(result.title.join(' ')).toContain('[0-64]')
      })

      it('should not include age group for all ages', () => {
        const result = callGetChartLabels({ type: 'deaths', ageGroups: ['all'] })

        expect(result.title.join(' ')).not.toContain('[all]')
      })

      it('should not include age group for multiple age groups', () => {
        const result = callGetChartLabels({ type: 'deaths', ageGroups: ['0-64', '65+'] })

        expect(result.title.join(' ')).not.toContain('[')
      })
    })

    describe('subtitle generation', () => {
      it('should include baseline description when showBaseline is true', () => {
        const result = callGetChartLabels({ type: 'deaths', showBaseline: true })

        expect(result.subtitle).toContain('Baseline:')
      })

      it('should not include baseline when showBaseline is false', () => {
        const result = callGetChartLabels({ type: 'deaths', showBaseline: false })

        expect(result.subtitle).not.toContain('Baseline:')
      })

      it('should include prediction interval when showBaseline and showPredictionInterval are true', () => {
        const result = callGetChartLabels({
          type: 'deaths',
          showBaseline: true,
          showPredictionInterval: true
        })

        expect(result.subtitle).toContain('95% Prediction Interval')
      })

      it('should include standard population for ASMR', () => {
        const result = callGetChartLabels({ type: 'asmr' })

        expect(result.subtitle).toContain('WHO Standard Population')
      })

      it('should handle ESP standard population', () => {
        const result = callGetChartLabels({ type: 'asmr', standardPopulation: 'esp' })

        expect(result.subtitle).toContain('European Standard Population')
      })

      it('should handle USA standard population', () => {
        const result = callGetChartLabels({ type: 'asmr', standardPopulation: 'usa' })

        expect(result.subtitle).toContain('U.S. Standard Population')
      })

      it('should handle country-specific standard population', () => {
        const result = callGetChartLabels({
          type: 'asmr',
          standardPopulation: 'country',
          countries: ['USA']
        })

        expect(result.subtitle).toContain('2020 Standard Population')
      })

      it('should include multiple subtitle parts with separator', () => {
        const result = callGetChartLabels({
          type: 'asmr',
          showBaseline: true
        })

        expect(result.subtitle).toContain('·')
      })
    })

    describe('xtitle generation', () => {
      it('should set xtitle for weekly chart', () => {
        const result = callGetChartLabels({ type: 'deaths', chartType: 'weekly' })

        expect(result.xtitle).toBe('Week of Year')
      })

      it('should set xtitle for monthly chart', () => {
        const result = callGetChartLabels({ type: 'deaths', chartType: 'monthly' })

        expect(result.xtitle).toBe('Month of Year')
      })

      it('should set xtitle for quarterly chart', () => {
        const result = callGetChartLabels({ type: 'deaths', chartType: 'quarterly' })

        expect(result.xtitle).toBe('Quarter of Year')
      })

      it('should set xtitle for yearly chart', () => {
        const result = callGetChartLabels({ type: 'deaths', chartType: 'yearly' })

        expect(result.xtitle).toBe('Year')
      })

      it('should set xtitle for midyear chart', () => {
        const result = callGetChartLabels({ type: 'deaths', chartType: 'midyear' })

        expect(result.xtitle).toBe('Year')
        expect(result.subtitle).toContain('7/1-6/30')
      })

      it('should set xtitle for fluseason chart', () => {
        const result = callGetChartLabels({ type: 'deaths', chartType: 'fluseason' })

        expect(result.xtitle).toBe('Year')
        expect(result.subtitle).toContain('10/1-9/30')
      })

      it('should set empty xtitle for showTotal', () => {
        const result = callGetChartLabels({ type: 'deaths', showTotal: true })

        expect(result.xtitle).toBe('')
      })

      it('should include SMA info in subtitle for weekly_52w_sma', () => {
        const result = callGetChartLabels({ type: 'deaths', chartType: 'weekly_52w_sma' })

        expect(result.subtitle).toContain('52 week moving average')
      })

      it('should include SMA info in subtitle for weekly_26w_sma', () => {
        const result = callGetChartLabels({ type: 'deaths', chartType: 'weekly_26w_sma' })

        expect(result.subtitle).toContain('26 week moving average')
      })

      it('should include SMA info in subtitle for weekly_13w_sma', () => {
        const result = callGetChartLabels({ type: 'deaths', chartType: 'weekly_13w_sma' })

        expect(result.subtitle).toContain('13 week moving average')
      })

      it('should include SMA info in subtitle for weekly_104w_sma', () => {
        const result = callGetChartLabels({ type: 'deaths', chartType: 'weekly_104w_sma' })

        expect(result.subtitle).toContain('104 week moving average')
      })
    })

    describe('ytitle generation', () => {
      it('should set ytitle for deaths', () => {
        const result = callGetChartLabels({ type: 'deaths' })

        expect(result.ytitle).toBe('Deaths')
      })

      it('should set ytitle for excess deaths', () => {
        const result = callGetChartLabels({ type: 'deaths', isExcess: true })

        expect(result.ytitle).toBe('Excess Deaths')
      })

      it('should set ytitle for cumulative excess deaths', () => {
        const result = callGetChartLabels({
          type: 'deaths',
          isExcess: true,
          cumulative: true
        })

        expect(result.ytitle).toBe('Cum. Excess Deaths')
      })

      it('should set ytitle for CMR', () => {
        const result = callGetChartLabels({ type: 'cmr' })

        expect(result.ytitle).toBe('Deaths per 100k')
      })

      it('should set ytitle for excess CMR', () => {
        const result = callGetChartLabels({ type: 'cmr', isExcess: true })

        expect(result.ytitle).toBe('Excess Deaths per 100k')
      })

      it('should set ytitle for ASMR', () => {
        const result = callGetChartLabels({ type: 'asmr' })

        expect(result.ytitle).toBe('Deaths per 100k')
      })

      it('should set ytitle for life expectancy', () => {
        const result = callGetChartLabels({ type: 'le' })

        expect(result.ytitle).toBe('Years')
      })

      it('should set ytitle for population', () => {
        const result = callGetChartLabels({ type: 'population' })

        expect(result.ytitle).toBe('People')
      })
    })

    describe('mobile formatting', () => {
      beforeEach(() => {
        // Mock isMobile to return true
        vi.mock('~/utils', () => ({
          isMobile: vi.fn(() => true)
        }))
      })

      afterEach(() => {
        vi.clearAllMocks()
      })

      it('should return array title for mobile', () => {
        const result = callGetChartLabels({ })

        expect(Array.isArray(result.title)).toBe(true)
      })
    })

    describe('desktop formatting', () => {
      beforeEach(() => {
        // Mock isMobile to return false
        vi.mock('~/utils', () => ({
          isMobile: vi.fn(() => false)
        }))
      })

      afterEach(() => {
        vi.clearAllMocks()
      })

      it('should return single string title for desktop', () => {
        const result = callGetChartLabels({ })

        if (Array.isArray(result.title)) {
          expect(result.title.length).toBe(1)
        }
      })
    })

    describe('edge cases', () => {
      it('should handle empty countries array for ASMR', () => {
        const result = callGetChartLabels({
          type: 'asmr',
          standardPopulation: 'who',
          countries: []
        })

        expect(result.title).toBeDefined()
      })

      it('should handle unknown metric type with deaths fallback', () => {
        const result = callGetChartLabels({
          type: 'unknown_type',
          standardPopulation: 'who'
        })

        expect(result.title).toBeDefined()
        expect(result.ytitle).toBeDefined()
      })

      it('should handle unknown chart type', () => {
        const result = callGetChartLabels({
          type: 'deaths',
          chartType: 'unknown_chart'
        })

        expect(result.title).toBeDefined()
        expect(result.xtitle).toBeDefined()
      })

      it('should handle multiple countries in standard population label', () => {
        const result = callGetChartLabels({
          type: 'asmr',
          standardPopulation: 'country',
          countries: ['USA', 'CAN']
        })

        expect(result.subtitle).toContain('2020 Standard Population')
      })
    })

    describe('life expectancy specifics', () => {
      it('should NOT include WHO2015 subtitle for life expectancy (LE uses Chiang methodology, not age-standardization)', () => {
        const result = callGetChartLabels({
          type: 'le',
          standardPopulation: 'who'
        })

        // LE should not mention WHO2015 - it uses Chiang's abridged life table, not age-standardization
        expect(result.subtitle).not.toContain('WHO2015')
      })

      it('should show change in life expectancy for excess', () => {
        const result = callGetChartLabels({
          type: 'le',
          isExcess: true,
          standardPopulation: 'who'
        })

        expect(result.title.join(' ')).toContain('Change in')
      })

      it('should include STL adjustment note for sub-yearly LE when leAdjusted is true', () => {
        const result = callGetChartLabels({
          type: 'le',
          chartType: 'weekly',
          leAdjusted: true
        })

        expect(result.subtitle).toContain('Seasonally Adjusted (STL)')
      })

      it('should include STL adjustment note for monthly LE when leAdjusted is true', () => {
        const result = callGetChartLabels({
          type: 'le',
          chartType: 'monthly',
          leAdjusted: true
        })

        expect(result.subtitle).toContain('Seasonally Adjusted (STL)')
      })

      it('should not include STL adjustment note for yearly LE', () => {
        const result = callGetChartLabels({
          type: 'le',
          chartType: 'yearly',
          leAdjusted: true
        })

        expect(result.subtitle).not.toContain('Seasonally Adjusted')
      })

      it('should not include STL adjustment note when leAdjusted is false', () => {
        const result = callGetChartLabels({
          type: 'le',
          chartType: 'weekly',
          leAdjusted: false
        })

        expect(result.subtitle).not.toContain('Seasonally Adjusted')
      })

      it('should not include STL adjustment note for non-LE types', () => {
        const result = callGetChartLabels({
          type: 'deaths',
          chartType: 'weekly',
          leAdjusted: true
        })

        expect(result.subtitle).not.toContain('Seasonally Adjusted')
      })
    })
  })
})
