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
      // In mortality view (default), showBaseline can be false
      const query = {
        sb: '0', // showBaseline
        lg: '1' // showLogarithmic
      }

      const state = decodeChartState(query)

      expect(state.showBaseline).toBe(false)
      // Note: showPredictionInterval is constrained to false when showBaseline=false
      expect(state.showPredictionInterval).toBe(false)
      expect(state.showLogarithmic).toBe(true)
    })

    it('should decode array values', () => {
      // Use CMR type because ASMR/LE constraints force ageGroups to ['all']
      const query = {
        t: 'cmr', // CMR allows custom age groups
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

    it('should allow URL params to override view defaults for non-constrained fields', () => {
      const query = {
        c: 'USA',
        e: '1', // excess view
        cs: 'line' // override chartStyle from bar to line
      }

      const state = decodeChartState(query)

      // URL param should override view default for non-constrained fields
      expect(state.chartStyle).toBe('line')
      // Other excess defaults should still apply
      expect(state.showPercentage).toBe(true)
    })

    it('should enforce constraints even when URL params conflict (excess view)', () => {
      // This is the key bug fix: SSR must enforce constraints like explorer does
      const query = {
        c: 'USA',
        e: '1', // excess view
        sb: '0' // try to disable baseline (NOT allowed in excess view)
      }

      const state = decodeChartState(query)

      // Constraint should enforce showBaseline=true in excess view
      // regardless of URL param sb=0
      expect(state.showBaseline).toBe(true)
      // showLogarithmic is also forced off in excess view
      expect(state.showLogarithmic).toBe(false)
    })

    it('should enforce constraints even when URL params conflict (zscore view)', () => {
      const query = {
        c: 'USA',
        zs: '1', // zscore view
        sb: '0', // try to disable baseline (NOT allowed in zscore view)
        lg: '1', // try to enable logarithmic (NOT allowed in zscore view)
        cum: '1' // try to enable cumulative (NOT allowed in zscore view)
      }

      const state = decodeChartState(query)

      // Z-score constraints should be enforced
      expect(state.showBaseline).toBe(true) // required for z-score calculation
      expect(state.showLogarithmic).toBe(false) // not compatible with z-scores
      expect(state.cumulative).toBe(false) // not available in z-score view
    })

    it('should fall back to mortality view when zscore requested with incompatible chart type', () => {
      // Weekly chart type is not compatible with z-score view
      const query = {
        c: 'USA',
        zs: '1', // try zscore view
        ct: 'weekly' // incompatible chart type
      }

      const state = decodeChartState(query)

      // Should fall back to mortality view defaults, not zscore view
      // In mortality view, chartStyle defaults to 'line', not 'bar' (excess) or specific zscore default
      expect(state.chartType).toBe('weekly') // chart type should remain
      // The key indicator is that zscore-specific constraints don't apply
      // showBaseline in mortality view is true by default, but it's toggleable
      expect(state.showBaseline).toBe(true)
    })

    it('should keep zscore view when chart type is compatible', () => {
      // Yearly chart type IS compatible with z-score view
      const query = {
        c: 'USA',
        zs: '1', // zscore view
        ct: 'yearly' // compatible chart type
      }

      const state = decodeChartState(query)

      // Z-score view should be active with its defaults
      expect(state.chartType).toBe('yearly')
      expect(state.chartStyle).toBe('line') // zscore default
      expect(state.showBaseline).toBe(true) // required for zscore
    })

    it('should enforce population type constraints', () => {
      const query = {
        c: 'USA',
        t: 'population', // population type
        sb: '1', // try to enable baseline (NOT supported for population)
        pi: '1' // try to enable prediction interval (NOT supported for population)
      }

      const state = decodeChartState(query)

      // Population type constraints should be enforced
      expect(state.showBaseline).toBe(false)
      expect(state.showPredictionInterval).toBe(false)
    })

    it('should enforce matrix style constraints', () => {
      const query = {
        c: 'USA',
        cs: 'matrix', // matrix chart style
        sb: '1', // try to enable baseline (NOT supported for matrix)
        lg: '1' // try to enable logarithmic (NOT supported for matrix)
      }

      const state = decodeChartState(query)

      // Matrix style constraints should be enforced
      expect(state.showBaseline).toBe(false)
      expect(state.showLogarithmic).toBe(false)
      expect(state.maximize).toBe(false)
    })

    it('should enforce showTotal requires cumulative constraint', () => {
      const query = {
        c: 'USA',
        e: '1', // excess view (where showTotal is available)
        cum: '0', // cumulative off
        st: '1' // try to enable showTotal (requires cumulative)
      }

      const state = decodeChartState(query)

      // showTotal should be forced off when cumulative is off
      expect(state.cumulative).toBe(false)
      expect(state.showTotal).toBe(false)
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
      // Use CMR type because ASMR/LE constraints force ageGroups to ['all']
      const queryString = 't=cmr&ag=0-14&ag=15-64&ag=65-74'

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
