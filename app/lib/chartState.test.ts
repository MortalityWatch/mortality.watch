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
        ct: 'weekly',
        e: '1'
      }

      const state = decodeChartState(query)

      expect(state.countries).toEqual(['USA', 'GBR'])
      expect(state.type).toBe('deaths')
      expect(state.chartType).toBe('weekly')
      expect(state.isExcess).toBe(true)
    })

    it('should use defaults for missing values', () => {
      const query = {
        c: 'USA'
      }

      const state = decodeChartState(query)

      expect(state.countries).toEqual(['USA'])
      expect(state.type).toBe('asmr') // default
      expect(state.chartType).toBe('yearly') // default
      expect(state.isExcess).toBe(false) // default
    })

    it('should decode boolean values correctly', () => {
      const query = {
        sb: '0', // showBaseline
        pi: '1', // showPredictionInterval
        lg: '1' // isLogarithmic
      }

      const state = decodeChartState(query)

      expect(state.showBaseline).toBe(false)
      expect(state.showPredictionInterval).toBe(true)
      expect(state.isLogarithmic).toBe(true)
    })

    it('should decode array values', () => {
      const query = {
        ag: ['0-14', '15-64', '65-74']
      }

      const state = decodeChartState(query)

      expect(state.ageGroups).toEqual(['0-14', '15-64', '65-74'])
    })
  })

  describe('encodeChartState', () => {
    it('should encode chart state to query parameters', () => {
      const state: Partial<ChartState> = {
        countries: ['USA', 'GBR'],
        type: 'deaths',
        chartType: 'weekly',
        isExcess: true
      }

      const query = encodeChartState(state)

      expect(query.c).toEqual(['USA', 'GBR'])
      expect(query.t).toBe('deaths')
      expect(query.ct).toBe('weekly')
      expect(query.e).toBe('1')
    })

    it('should skip default values', () => {
      const state: Partial<ChartState> = {
        countries: ['USA', 'SWE'], // default
        type: 'asmr', // default
        chartType: 'yearly' // default
      }

      const query = encodeChartState(state)

      // Should only include non-default values
      expect(Object.keys(query).length).toBe(0)
    })

    it('should encode boolean values correctly', () => {
      const state: Partial<ChartState> = {
        showBaseline: false, // not default
        isLogarithmic: true // not default
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
      const queryString = 'c=USA&c=GBR&t=deaths&ct=weekly&e=1'

      const state = queryStringToChartState(queryString)

      expect(state.countries).toEqual(['USA', 'GBR'])
      expect(state.type).toBe('deaths')
      expect(state.chartType).toBe('weekly')
      expect(state.isExcess).toBe(true)
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
        isExcess: true,
        ageGroups: ['65-74', '75-84'],
        showBaseline: false
      }

      const queryString = chartStateToQueryString(original)
      const decoded = queryStringToChartState(queryString)

      expect(decoded.countries).toEqual(original.countries)
      expect(decoded.type).toBe(original.type)
      expect(decoded.chartType).toBe(original.chartType)
      expect(decoded.isExcess).toBe(original.isExcess)
      expect(decoded.ageGroups).toEqual(original.ageGroups)
      expect(decoded.showBaseline).toBe(original.showBaseline)
    })
  })
})
