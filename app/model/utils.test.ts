import { describe, it, expect } from 'vitest'
import {
  getChartTypeOrdinal,
  getChartTypeFromOrdinal,
  getKeyForType,
  getBaseKeysForType,
  isSubYearlyChartType
} from './utils'

describe('app/model/utils', () => {
  describe('getChartTypeOrdinal', () => {
    it('should return 1 for yearly chart type', () => {
      expect(getChartTypeOrdinal('yearly')).toBe(1)
    })

    it('should return 1 for midyear chart type', () => {
      expect(getChartTypeOrdinal('midyear')).toBe(1)
    })

    it('should return 1 for fluseason chart type', () => {
      expect(getChartTypeOrdinal('fluseason')).toBe(1)
    })

    it('should return 3 for weekly chart type', () => {
      expect(getChartTypeOrdinal('weekly')).toBe(3)
    })

    it('should return 3 for weekly variants', () => {
      expect(getChartTypeOrdinal('weekly_custom')).toBe(3)
      expect(getChartTypeOrdinal('weekly_iso')).toBe(3)
    })

    it('should return 2 for monthly chart type', () => {
      expect(getChartTypeOrdinal('monthly')).toBe(2)
    })

    it('should return 2 for quarterly chart type', () => {
      expect(getChartTypeOrdinal('quarterly')).toBe(2)
    })

    it('should return 2 for unknown chart types', () => {
      expect(getChartTypeOrdinal('unknown')).toBe(2)
      expect(getChartTypeOrdinal('')).toBe(2)
    })
  })

  describe('getChartTypeFromOrdinal', () => {
    it('should return yearly for ordinal 1', () => {
      expect(getChartTypeFromOrdinal(1)).toBe('yearly')
    })

    it('should return monthly for ordinal 2', () => {
      expect(getChartTypeFromOrdinal(2)).toBe('monthly')
    })

    it('should return weekly for ordinal 3', () => {
      expect(getChartTypeFromOrdinal(3)).toBe('weekly')
    })

    it('should return yearly for ordinal 0', () => {
      expect(getChartTypeFromOrdinal(0)).toBe('yearly')
    })

    it('should return yearly for negative ordinals', () => {
      expect(getChartTypeFromOrdinal(-1)).toBe('yearly')
    })

    it('should return yearly for ordinals > 3', () => {
      expect(getChartTypeFromOrdinal(4)).toBe('yearly')
      expect(getChartTypeFromOrdinal(100)).toBe('yearly')
    })

    it('should be inverse of getChartTypeOrdinal for main types', () => {
      expect(getChartTypeFromOrdinal(getChartTypeOrdinal('yearly'))).toBe('yearly')
      expect(getChartTypeFromOrdinal(getChartTypeOrdinal('monthly'))).toBe('monthly')
      expect(getChartTypeFromOrdinal(getChartTypeOrdinal('weekly'))).toBe('weekly')
    })
  })

  describe('getKeyForType', () => {
    describe('population type', () => {
      it('should return population key', () => {
        expect(getKeyForType('population', false, 'who')).toEqual(['population'])
      })

      it('should return population key regardless of baseline setting', () => {
        expect(getKeyForType('population', true, 'who')).toEqual(['population'])
      })

      it('should return population key regardless of excess setting', () => {
        expect(getKeyForType('population', false, 'who', true)).toEqual(['population'])
      })
    })

    describe('deaths type', () => {
      it('should return deaths key when showBaseline is false', () => {
        expect(getKeyForType('deaths', false, 'who')).toEqual(['deaths'])
      })

      it('should return deaths with baseline keys when showBaseline is true', () => {
        expect(getKeyForType('deaths', true, 'who')).toEqual([
          'deaths',
          'deaths_baseline',
          'deaths_baseline_lower',
          'deaths_baseline_upper'
        ])
      })

      it('should return deaths_excess when isExcess is true and includePi is false', () => {
        expect(getKeyForType('deaths', false, 'who', true, false)).toEqual(['deaths_excess'])
      })

      it('should return deaths_excess with prediction intervals when both isExcess and includePi are true', () => {
        expect(getKeyForType('deaths', false, 'who', true, true)).toEqual([
          'deaths_excess',
          'deaths_excess_lower',
          'deaths_excess_upper'
        ])
      })
    })

    describe('cmr type', () => {
      it('should return cmr key when showBaseline is false', () => {
        expect(getKeyForType('cmr', false, 'who')).toEqual(['cmr'])
      })

      it('should return cmr with baseline keys when showBaseline is true', () => {
        expect(getKeyForType('cmr', true, 'who')).toEqual([
          'cmr',
          'cmr_baseline',
          'cmr_baseline_lower',
          'cmr_baseline_upper'
        ])
      })

      it('should return cmr_excess when isExcess is true', () => {
        expect(getKeyForType('cmr', false, 'who', true, false)).toEqual(['cmr_excess'])
      })

      it('should return cmr_excess with prediction intervals when both flags are true', () => {
        expect(getKeyForType('cmr', false, 'who', true, true)).toEqual([
          'cmr_excess',
          'cmr_excess_lower',
          'cmr_excess_upper'
        ])
      })
    })

    describe('asmr type', () => {
      it('should return asmr key for WHO standard population', () => {
        expect(getKeyForType('asmr', false, 'who')).toEqual(['asmr_who'])
      })

      it('should return asmr key for European standard population', () => {
        expect(getKeyForType('asmr', false, 'european')).toEqual(['asmr_european'])
      })

      it('should return asmr with baseline keys when showBaseline is true', () => {
        expect(getKeyForType('asmr', true, 'who')).toEqual([
          'asmr_who',
          'asmr_who_baseline',
          'asmr_who_baseline_lower',
          'asmr_who_baseline_upper'
        ])
      })

      it('should return asmr_excess when isExcess is true', () => {
        expect(getKeyForType('asmr', false, 'who', true, false)).toEqual(['asmr_who_excess'])
      })

      it('should return asmr_excess with prediction intervals when both flags are true', () => {
        expect(getKeyForType('asmr', false, 'who', true, true)).toEqual([
          'asmr_who_excess',
          'asmr_who_excess_lower',
          'asmr_who_excess_upper'
        ])
      })

      it('should respect different standard populations in excess mode', () => {
        expect(getKeyForType('asmr', false, 'european', true, false)).toEqual(['asmr_european_excess'])
      })
    })

    describe('le (life expectancy) type', () => {
      it('should return le key when showBaseline is false', () => {
        expect(getKeyForType('le', false, 'who')).toEqual(['le'])
      })

      it('should return le with baseline keys when showBaseline is true', () => {
        expect(getKeyForType('le', true, 'who')).toEqual([
          'le',
          'le_baseline',
          'le_baseline_lower',
          'le_baseline_upper'
        ])
      })

      it('should return le_excess when isExcess is true', () => {
        expect(getKeyForType('le', false, 'who', true, false)).toEqual(['le_excess'])
      })

      it('should return le_excess with prediction intervals when both flags are true', () => {
        expect(getKeyForType('le', false, 'who', true, true)).toEqual([
          'le_excess',
          'le_excess_lower',
          'le_excess_upper'
        ])
      })
    })

    describe('error handling', () => {
      it('should throw error for unknown type', () => {
        expect(() => getKeyForType('unknown', false, 'who')).toThrow('Unknown type key provided.')
      })

      it('should throw error for empty string type', () => {
        expect(() => getKeyForType('', false, 'who')).toThrow('Unknown type key provided.')
      })

      it('should throw error for null type', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(() => getKeyForType(null as any, false, 'who')).toThrow('Unknown type key provided.')
      })
    })

    describe('edge cases', () => {
      it('should handle showBaseline=true with isExcess=true (showBaseline should be ignored)', () => {
        // When isExcess is true, showBaseline is ignored
        const result = getKeyForType('deaths', true, 'who', true, false)
        expect(result).toEqual(['deaths_excess'])
        expect(result).not.toContain('deaths_baseline')
      })

      it('should handle all combinations for deaths', () => {
        // Base case
        expect(getKeyForType('deaths', false, 'who', false, false)).toEqual(['deaths'])

        // With baseline
        expect(getKeyForType('deaths', true, 'who', false, false)).toEqual([
          'deaths',
          'deaths_baseline',
          'deaths_baseline_lower',
          'deaths_baseline_upper'
        ])

        // Excess only
        expect(getKeyForType('deaths', false, 'who', true, false)).toEqual(['deaths_excess'])

        // Excess with PI
        expect(getKeyForType('deaths', false, 'who', true, true)).toEqual([
          'deaths_excess',
          'deaths_excess_lower',
          'deaths_excess_upper'
        ])
      })
    })
  })

  describe('getBaseKeysForType', () => {
    it('should return base keys without excess for deaths', () => {
      const result = getBaseKeysForType('deaths', false, 'who')
      expect(result).toEqual(['deaths'])
    })

    it('should return base keys with baseline for deaths', () => {
      const result = getBaseKeysForType('deaths', true, 'who')
      expect(result).toEqual([
        'deaths',
        'deaths_baseline',
        'deaths_baseline_lower',
        'deaths_baseline_upper'
      ])
    })

    it('should return base keys for cmr', () => {
      const result = getBaseKeysForType('cmr', false, 'who')
      expect(result).toEqual(['cmr'])
    })

    it('should return base keys for asmr with WHO standard', () => {
      const result = getBaseKeysForType('asmr', false, 'who')
      expect(result).toEqual(['asmr_who'])
    })

    it('should return base keys for le', () => {
      const result = getBaseKeysForType('le', true, 'who')
      expect(result).toEqual([
        'le',
        'le_baseline',
        'le_baseline_lower',
        'le_baseline_upper'
      ])
    })

    it('should return base keys for population', () => {
      const result = getBaseKeysForType('population', false, 'who')
      expect(result).toEqual(['population'])
    })

    it('should never return excess keys (isExcess is always false)', () => {
      const result = getBaseKeysForType('deaths', false, 'who')
      expect(result).not.toContain('deaths_excess')
    })

    it('should throw error for unknown type', () => {
      expect(() => getBaseKeysForType('unknown', false, 'who')).toThrow('Unknown type key provided.')
    })
  })

  describe('isSubYearlyChartType', () => {
    it('should return false for yearly chart type', () => {
      expect(isSubYearlyChartType('yearly')).toBe(false)
    })

    it('should return false for midyear chart type', () => {
      expect(isSubYearlyChartType('midyear')).toBe(false)
    })

    it('should return false for fluseason chart type', () => {
      expect(isSubYearlyChartType('fluseason')).toBe(false)
    })

    it('should return true for monthly chart type', () => {
      expect(isSubYearlyChartType('monthly')).toBe(true)
    })

    it('should return true for quarterly chart type', () => {
      expect(isSubYearlyChartType('quarterly')).toBe(true)
    })

    it('should return true for weekly chart type', () => {
      expect(isSubYearlyChartType('weekly')).toBe(true)
    })

    it('should return true for weekly variants', () => {
      expect(isSubYearlyChartType('weekly_13w_sma')).toBe(true)
      expect(isSubYearlyChartType('weekly_26w_sma')).toBe(true)
      expect(isSubYearlyChartType('weekly_52w_sma')).toBe(true)
      expect(isSubYearlyChartType('weekly_104w_sma')).toBe(true)
    })

    it('should return false for undefined', () => {
      expect(isSubYearlyChartType(undefined)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isSubYearlyChartType('')).toBe(false)
    })
  })

  describe('getKeyForType with leAdjusted option (LE seasonal adjustment)', () => {
    describe('LE with leAdjusted=true and sub-yearly chart types', () => {
      it('should return le_adj for monthly chart type', () => {
        expect(getKeyForType('le', false, 'who', false, false, { leAdjusted: true, chartType: 'monthly' }))
          .toEqual(['le_adj'])
      })

      it('should return le_adj for weekly chart type', () => {
        expect(getKeyForType('le', false, 'who', false, false, { leAdjusted: true, chartType: 'weekly' }))
          .toEqual(['le_adj'])
      })

      it('should return le_adj for quarterly chart type', () => {
        expect(getKeyForType('le', false, 'who', false, false, { leAdjusted: true, chartType: 'quarterly' }))
          .toEqual(['le_adj'])
      })

      it('should return le_adj with baseline keys when showBaseline is true', () => {
        expect(getKeyForType('le', true, 'who', false, false, { leAdjusted: true, chartType: 'monthly' }))
          .toEqual(['le_adj', 'le_adj_baseline', 'le_adj_baseline_lower', 'le_adj_baseline_upper'])
      })
    })

    describe('LE with leAdjusted=true and yearly chart types (no adjustment available)', () => {
      it('should return le for yearly chart type (no le_adj for yearly)', () => {
        expect(getKeyForType('le', false, 'who', false, false, { leAdjusted: true, chartType: 'yearly' }))
          .toEqual(['le'])
      })

      it('should return le for midyear chart type', () => {
        expect(getKeyForType('le', false, 'who', false, false, { leAdjusted: true, chartType: 'midyear' }))
          .toEqual(['le'])
      })

      it('should return le for fluseason chart type', () => {
        expect(getKeyForType('le', false, 'who', false, false, { leAdjusted: true, chartType: 'fluseason' }))
          .toEqual(['le'])
      })
    })

    describe('LE with leAdjusted=false (raw values)', () => {
      it('should return le for monthly chart type when leAdjusted is false', () => {
        expect(getKeyForType('le', false, 'who', false, false, { leAdjusted: false, chartType: 'monthly' }))
          .toEqual(['le'])
      })

      it('should return le for weekly chart type when leAdjusted is false', () => {
        expect(getKeyForType('le', false, 'who', false, false, { leAdjusted: false, chartType: 'weekly' }))
          .toEqual(['le'])
      })
    })

    describe('LE without options (backward compatibility)', () => {
      it('should return le when no options provided', () => {
        expect(getKeyForType('le', false, 'who')).toEqual(['le'])
      })

      it('should return le with baseline when no options provided', () => {
        expect(getKeyForType('le', true, 'who')).toEqual([
          'le',
          'le_baseline',
          'le_baseline_lower',
          'le_baseline_upper'
        ])
      })
    })

    describe('non-LE types ignore leAdjusted option', () => {
      it('deaths should ignore leAdjusted option', () => {
        expect(getKeyForType('deaths', false, 'who', false, false, { leAdjusted: true, chartType: 'monthly' }))
          .toEqual(['deaths'])
      })

      it('asmr should ignore leAdjusted option', () => {
        expect(getKeyForType('asmr', false, 'who', false, false, { leAdjusted: true, chartType: 'monthly' }))
          .toEqual(['asmr_who'])
      })
    })
  })
})
