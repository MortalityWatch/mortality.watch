/**
 * Ranking Field Encoders Tests
 *
 * Tests for URL parameter encoding/decoding.
 */

import { describe, it, expect } from 'vitest'
import {
  rankingFieldEncoders,
  decodeMetricType,
  RANKING_DEFAULTS,
  getUrlKey
} from './fieldEncoders'

describe('rankingFieldEncoders', () => {
  describe('view encoder', () => {
    const { encode, decode } = rankingFieldEncoders.view

    it('encodes relative as undefined (no URL param)', () => {
      expect(encode('relative')).toBeUndefined()
    })

    it('encodes absolute as 0', () => {
      expect(encode('absolute')).toBe('0')
    })

    it('decodes 0 as absolute', () => {
      expect(decode('0')).toBe('absolute')
    })

    it('decodes 1 as relative', () => {
      expect(decode('1')).toBe('relative')
    })

    it('decodes any other value as relative', () => {
      expect(decode('anything')).toBe('relative')
    })
  })

  describe('metricType encoder', () => {
    const { decode } = rankingFieldEncoders.metricType

    it('decodes valid metric types', () => {
      expect(decode('cmr')).toBe('cmr')
      expect(decode('asmr')).toBe('asmr')
      expect(decode('le')).toBe('le')
    })

    it('defaults to asmr for invalid values', () => {
      expect(decode('invalid')).toBe('asmr')
    })
  })

  describe('hideIncomplete encoder', () => {
    const { encode, decode } = rankingFieldEncoders.hideIncomplete

    it('encodes hideIncomplete=true as 0 (inverted)', () => {
      expect(encode(true)).toBe(0)
    })

    it('encodes hideIncomplete=false as 1 (inverted)', () => {
      expect(encode(false)).toBe(1)
    })

    it('decodes 0 as true (inverted)', () => {
      expect(decode('0')).toBe(true)
    })

    it('decodes 1 as false (inverted)', () => {
      expect(decode('1')).toBe(false)
    })
  })

  describe('boolean encoders', () => {
    const boolFields = ['showTotals', 'showTotalsOnly', 'showPercentage', 'showPI', 'cumulative'] as const

    boolFields.forEach((field) => {
      const encoder = rankingFieldEncoders[field]

      describe(field, () => {
        it('encodes true as 1', () => {
          expect(encoder.encode(true)).toBe(1)
        })

        it('encodes false as 0', () => {
          expect(encoder.encode(false)).toBe(0)
        })

        it('decodes 1 as true', () => {
          expect(encoder.decode('1')).toBe(true)
        })

        it('decodes 0 as false', () => {
          expect(encoder.decode('0')).toBe(false)
        })
      })
    })
  })

  describe('string fields', () => {
    const stringFields = ['periodOfTime', 'jurisdictionType', 'standardPopulation', 'baselineMethod', 'decimalPrecision'] as const

    stringFields.forEach((field) => {
      it(`${field} has no encode/decode (pass-through)`, () => {
        const encoder = rankingFieldEncoders[field]
        expect('encode' in encoder).toBe(false)
        expect('decode' in encoder).toBe(false)
      })
    })
  })
})

describe('decodeMetricType', () => {
  it('returns m value when valid', () => {
    expect(decodeMetricType('cmr')).toBe('cmr')
    expect(decodeMetricType('asmr')).toBe('asmr')
    expect(decodeMetricType('le')).toBe('le')
  })

  it('falls back to legacy a param when m is invalid', () => {
    expect(decodeMetricType(undefined, '1')).toBe('asmr')
    expect(decodeMetricType(undefined, '0')).toBe('cmr')
  })

  it('prefers m over a when both present', () => {
    expect(decodeMetricType('le', '1')).toBe('le')
    expect(decodeMetricType('cmr', '1')).toBe('cmr')
  })

  it('defaults to asmr when no params', () => {
    expect(decodeMetricType()).toBe('asmr')
  })

  it('defaults to asmr when invalid m', () => {
    expect(decodeMetricType('invalid')).toBe('asmr')
  })
})

describe('RANKING_DEFAULTS', () => {
  it('has relative as default view', () => {
    expect(RANKING_DEFAULTS.view).toBe('relative')
  })

  it('has asmr as default metric type', () => {
    expect(RANKING_DEFAULTS.metricType).toBe('asmr')
  })

  it('has fluseason as default period', () => {
    expect(RANKING_DEFAULTS.periodOfTime).toBe('fluseason')
  })

  it('has showPercentage true by default', () => {
    expect(RANKING_DEFAULTS.showPercentage).toBe(true)
  })

  it('has showPI false by default', () => {
    expect(RANKING_DEFAULTS.showPI).toBe(false)
  })

  it('has hideIncomplete true by default', () => {
    expect(RANKING_DEFAULTS.hideIncomplete).toBe(true)
  })
})

describe('getUrlKey', () => {
  it('returns correct URL key for view', () => {
    expect(getUrlKey('view')).toBe('e')
  })

  it('returns correct URL key for metricType', () => {
    expect(getUrlKey('metricType')).toBe('m')
  })

  it('returns correct URL key for periodOfTime', () => {
    expect(getUrlKey('periodOfTime')).toBe('p')
  })

  it('returns correct URL key for boolean fields', () => {
    expect(getUrlKey('showTotals')).toBe('t')
    expect(getUrlKey('showTotalsOnly')).toBe('to')
    expect(getUrlKey('showPercentage')).toBe('r')
    expect(getUrlKey('showPI')).toBe('pi')
    expect(getUrlKey('cumulative')).toBe('c')
  })
})
