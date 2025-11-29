import { describe, it, expect } from 'vitest'
import {
  decodeChartState,
  encodeChartState,
  chartStateToQueryString,
  queryStringToChartState,
  type ChartState
} from './chartState'

describe('chartState', () => {
  describe('decodeChartState', () => {
    it('should decode query parameters to chart state', () => {
      const query = {
        c: ['USA', 'GBR'],
        t: 'deaths',
        ct: 'weekly'
        // NOTE: e param (excess view) is handled by view system, not ChartState
      }

      const state = decodeChartState(query)

      expect(state.countries).toEqual(['USA', 'GBR'])
      expect(state.type).toBe('deaths')
      expect(state.chartType).toBe('weekly')
      // NOTE: isExcess removed - view is determined by viewDetector from URL params
    })

    it('should use defaults for missing values', () => {
      const query = {
        c: 'USA'
      }

      const state = decodeChartState(query)

      expect(state.countries).toEqual(['USA'])
      expect(state.type).toBe('asmr') // default
      expect(state.chartType).toBe('fluseason') // default
      // NOTE: isExcess removed - now determined by view system from URL params
    })

    it('should decode boolean values correctly', () => {
      const query = {
        sb: '0', // showBaseline
        pi: '1', // showPredictionInterval
        lg: '1' // showLogarithmic
      }

      const state = decodeChartState(query)

      expect(state.showBaseline).toBe(false)
      expect(state.showPredictionInterval).toBe(true)
      expect(state.showLogarithmic).toBe(true)
    })

    it('should decode array values', () => {
      const query = {
        ag: ['0-14', '15-64', '65-74']
      }

      const state = decodeChartState(query)

      expect(state.ageGroups).toEqual(['0-14', '15-64', '65-74'])
    })

    it('should use excess view defaults when e=1 is present', () => {
      const query = {
        c: 'USA',
        e: '1' // excess view
      }

      const state = decodeChartState(query)

      // Excess view defaults should be applied
      expect(state.chartStyle).toBe('bar') // excess default (vs 'line' for mortality)
      expect(state.showPercentage).toBe(true) // excess default
      expect(state.showBaseline).toBe(true) // excess default (forced)
      expect(state.showPredictionInterval).toBe(false) // excess default
    })

    it('should use zscore view defaults when zs=1 is present', () => {
      const query = {
        c: 'USA',
        zs: '1' // zscore view
      }

      const state = decodeChartState(query)

      // Z-score view defaults should be applied
      expect(state.chartStyle).toBe('line') // zscore default
      expect(state.showBaseline).toBe(true) // zscore default (required for calculation)
      expect(state.showLogarithmic).toBe(false) // zscore default (not compatible)
    })

    it('should allow URL params to override view defaults', () => {
      const query = {
        c: 'USA',
        e: '1', // excess view
        cs: 'line' // override chartStyle from bar to line
      }

      const state = decodeChartState(query)

      // URL param should override view default
      expect(state.chartStyle).toBe('line')
      // Other excess defaults should still apply
      expect(state.showPercentage).toBe(true)
    })
  })

  describe('encodeChartState', () => {
    it('should encode chart state to query parameters', () => {
      const state: Partial<ChartState> = {
        countries: ['USA', 'GBR'],
        type: 'deaths',
        chartType: 'weekly'
        // NOTE: isExcess removed - view is determined from URL params (e=1)
      }

      const query = encodeChartState(state)

      expect(query.c).toEqual(['USA', 'GBR'])
      expect(query.t).toBe('deaths')
      expect(query.ct).toBe('weekly')
      // NOTE: e param (excess view) is not part of state, added by view system
    })

    it('should skip default values', () => {
      const state: Partial<ChartState> = {
        countries: ['USA', 'SWE'], // default
        type: 'asmr', // default
        chartType: 'fluseason' // default
      }

      const query = encodeChartState(state)

      // Should only include non-default values
      expect(Object.keys(query).length).toBe(0)
    })

    it('should encode boolean values correctly', () => {
      const state: Partial<ChartState> = {
        showBaseline: false, // not default
        showLogarithmic: true // not default
      }

      const query = encodeChartState(state)

      expect(query.sb).toBe('0')
      expect(query.lg).toBe('1')
    })
  })

  describe('chartStateToQueryString', () => {
    it('should convert chart state to URL query string', () => {
      const state: Partial<ChartState> = {
        countries: ['USA', 'GBR'],
        type: 'deaths'
      }

      const queryString = chartStateToQueryString(state)

      expect(queryString).toContain('c=USA')
      expect(queryString).toContain('c=GBR')
      expect(queryString).toContain('t=deaths')
    })

    it('should handle array parameters correctly', () => {
      const state: Partial<ChartState> = {
        ageGroups: ['0-14', '15-64']
      }

      const queryString = chartStateToQueryString(state)

      expect(queryString).toContain('ag=0-14')
      expect(queryString).toContain('ag=15-64')
    })
  })

  describe('queryStringToChartState', () => {
    it('should parse URL query string to chart state', () => {
      const queryString = 'c=USA&c=GBR&t=deaths&ct=weekly'
      // NOTE: e=1 is handled by view system, not part of ChartState

      const state = queryStringToChartState(queryString)

      expect(state.countries).toEqual(['USA', 'GBR'])
      expect(state.type).toBe('deaths')
      expect(state.chartType).toBe('weekly')
      // NOTE: isExcess removed - view is determined by viewDetector from URL params
    })

    it('should handle single array values', () => {
      const queryString = 'ag=all'

      const state = queryStringToChartState(queryString)

      expect(state.ageGroups).toEqual(['all'])
    })

    it('should handle multiple array values', () => {
      const queryString = 'ag=0-14&ag=15-64&ag=65-74'

      const state = queryStringToChartState(queryString)

      expect(state.ageGroups).toEqual(['0-14', '15-64', '65-74'])
    })
  })

  describe('round-trip conversion', () => {
    it('should preserve state through encode/decode cycle', () => {
      const original: Partial<ChartState> = {
        countries: ['USA', 'GBR', 'DEU'],
        type: 'deaths',
        chartType: 'monthly',
        // NOTE: isExcess removed - view is handled separately by view system
        ageGroups: ['65-74', '75-84'],
        showBaseline: false
      }

      const queryString = chartStateToQueryString(original)
      const decoded = queryStringToChartState(queryString)

      expect(decoded.countries).toEqual(original.countries)
      expect(decoded.type).toBe(original.type)
      expect(decoded.chartType).toBe(original.chartType)
      // NOTE: isExcess comparison removed - not part of state anymore
      expect(decoded.ageGroups).toEqual(original.ageGroups)
      expect(decoded.showBaseline).toBe(original.showBaseline)
    })
  })
})
