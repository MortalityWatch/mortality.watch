import { describe, it, expect } from 'vitest'
import { encodeBool, decodeBool } from '@/lib/state/stateSerializer'

/**
 * Tests for ranking page URL state management
 * These functions are used throughout the ranking page to encode/decode boolean values in URLs
 */

describe('ranking URL state encoding/decoding', () => {
  describe('encodeBool', () => {
    it('should encode true as 1', () => {
      expect(encodeBool(true)).toBe(1)
    })

    it('should encode false as 0', () => {
      expect(encodeBool(false)).toBe(0)
    })

    it('should handle null/undefined', () => {
      expect(encodeBool(null as unknown as boolean)).toBe(0) // null is falsy
      expect(encodeBool(undefined)).toBeUndefined() // undefined returns undefined
    })
  })

  describe('decodeBool', () => {
    it('should decode "1" as true', () => {
      expect(decodeBool('1')).toBe(true)
    })

    it('should decode "0" as false', () => {
      expect(decodeBool('0')).toBe(false)
    })

    it('should decode number 1 as true', () => {
      expect(decodeBool(1 as unknown as string)).toBe(true)
    })

    it('should decode number 0 as false', () => {
      expect(decodeBool(0 as unknown as string)).toBe(false)
    })

    it('should handle invalid values consistently', () => {
      expect(decodeBool('')).toBe(false) // Empty string is not 1
      expect(decodeBool(undefined)).toBeUndefined() // undefined returns undefined
      expect(decodeBool(null as unknown as string)).toBe(false) // null is not 1
    })

    it('should handle string "true"/"false" as false (not equal to 1)', () => {
      // The implementation uses == 1, so only "1" or 1 are true
      expect(decodeBool('true')).toBe(false)
      expect(decodeBool('false')).toBe(false)
    })
  })

  describe('round-trip encoding/decoding', () => {
    it('should preserve true through encode/decode cycle', () => {
      const encoded = encodeBool(true)
      const decoded = decodeBool(String(encoded))
      expect(decoded).toBe(true)
    })

    it('should preserve false through encode/decode cycle', () => {
      const encoded = encodeBool(false)
      const decoded = decodeBool(String(encoded))
      expect(decoded).toBe(false)
    })
  })

  describe('URL parameter scenarios', () => {
    /**
     * Test realistic URL scenarios from the ranking page
     * Based on the actual URL parameters used:
     * - a: showASMR
     * - t: showTotals
     * - to: showTotalsOnly
     * - r: showPercentage
     * - c: cumulative
     * - pi: showPI
     * - i: hideIncomplete (inverted)
     */

    it('should handle showASMR parameter', () => {
      const showASMR = true
      const encoded = encodeBool(showASMR)
      expect(encoded).toBe(1)

      // Simulate URL query param
      const queryParam = String(encoded) // "1"
      const decoded = decodeBool(queryParam)
      expect(decoded).toBe(true)
    })

    it('should handle showTotals parameter', () => {
      const showTotals = true
      const encoded = encodeBool(showTotals)

      const queryParam = String(encoded)
      const decoded = decodeBool(queryParam)
      expect(decoded).toBe(true)
    })

    it('should handle cumulative parameter', () => {
      const cumulative = false
      const encoded = encodeBool(cumulative)
      expect(encoded).toBe(0)

      const queryParam = String(encoded)
      const decoded = decodeBool(queryParam)
      expect(decoded).toBe(false)
    })

    it('should handle inverted hideIncomplete parameter', () => {
      // hideIncomplete is special - it's stored inverted in the URL
      // If hideIncomplete is true (hide incomplete data), we store false (don't show incomplete)
      const hideIncomplete = true
      const encoded = encodeBool(!hideIncomplete) // Invert for storage
      expect(encoded).toBe(0)

      const queryParam = String(encoded)
      const decoded = !decodeBool(queryParam) // Invert when reading
      expect(decoded).toBe(true)
    })

    it('should handle default values when parameter is missing', () => {
      // When a URL parameter is missing, decodeBool with undefined should return default
      const missingParam = undefined
      const decoded = decodeBool(missingParam as unknown as string) ?? true // Default to true
      expect(decoded).toBe(true)
    })

    it('should create valid query string from boolean states', () => {
      const state = {
        showASMR: true,
        showTotals: true,
        showPercentage: true,
        cumulative: false,
        hideIncomplete: false
      }

      const params = new URLSearchParams()
      params.set('a', String(encodeBool(state.showASMR)))
      params.set('t', String(encodeBool(state.showTotals)))
      params.set('r', String(encodeBool(state.showPercentage)))
      params.set('c', String(encodeBool(state.cumulative)))
      params.set('i', String(encodeBool(!state.hideIncomplete))) // Inverted

      expect(params.get('a')).toBe('1')
      expect(params.get('t')).toBe('1')
      expect(params.get('r')).toBe('1')
      expect(params.get('c')).toBe('0')
      expect(params.get('i')).toBe('1') // true because hideIncomplete is false (inverted)
    })

    it('should parse query string back to boolean states', () => {
      const queryString = 'a=1&t=1&r=1&c=0&i=0'
      const params = new URLSearchParams(queryString)

      const state = {
        showASMR: decodeBool(params.get('a') || '1'),
        showTotals: decodeBool(params.get('t') || '1'),
        showPercentage: decodeBool(params.get('r') || '1'),
        cumulative: decodeBool(params.get('c') || '0'),
        hideIncomplete: !decodeBool(params.get('i') || '0') // Inverted
      }

      expect(state.showASMR).toBe(true)
      expect(state.showTotals).toBe(true)
      expect(state.showPercentage).toBe(true)
      expect(state.cumulative).toBe(false)
      expect(state.hideIncomplete).toBe(true) // Inverted from i=0
    })
  })

  describe('edge cases', () => {
    it('should handle empty string as false', () => {
      expect(decodeBool('')).toBe(false)
    })

    it('should handle whitespace as false', () => {
      expect(decodeBool('   ')).toBe(false)
    })

    it('should handle non-boolean strings consistently', () => {
      expect(decodeBool('yes')).toBe(false) // Not "1" or "true"
      expect(decodeBool('no')).toBe(false)
      expect(decodeBool('maybe')).toBe(false)
    })

    it('should handle numeric strings consistently', () => {
      expect(decodeBool('2')).toBe(false) // Not "1"
      expect(decodeBool('-1')).toBe(false)
      expect(decodeBool('0.5')).toBe(false)
    })
  })

  describe('type safety', () => {
    it('should always return 0 or 1 from encodeBool', () => {
      const result1 = encodeBool(true)
      const result2 = encodeBool(false)

      expect([0, 1]).toContain(result1)
      expect([0, 1]).toContain(result2)
      expect(typeof result1).toBe('number')
      expect(typeof result2).toBe('number')
    })

    it('should always return boolean from decodeBool', () => {
      const result1 = decodeBool('1')
      const result2 = decodeBool('0')
      const result3 = decodeBool('invalid')

      expect(typeof result1).toBe('boolean')
      expect(typeof result2).toBe('boolean')
      expect(typeof result3).toBe('boolean')
    })
  })

  describe('real-world ranking page scenarios', () => {
    it('should handle default ranking page state', () => {
      // Default state when no URL parameters are present
      const defaults = {
        showASMR: true,
        showTotals: true,
        showPercentage: true,
        cumulative: false
      }

      // Encode defaults
      expect(encodeBool(defaults.showASMR)).toBe(1)
      expect(encodeBool(defaults.showTotals)).toBe(1)
      expect(encodeBool(defaults.showPercentage)).toBe(1)
      expect(encodeBool(defaults.cumulative)).toBe(0)
    })

    it('should handle cumulative excess mortality view', () => {
      const state = {
        showASMR: true,
        cumulative: true,
        showPI: false // Disabled when cumulative is true
      }

      expect(encodeBool(state.cumulative)).toBe(1)
      expect(encodeBool(state.showPI)).toBe(0)
    })

    it('should handle totals-only view', () => {
      const state = {
        showTotals: true,
        showTotalsOnly: true,
        showPI: false // Disabled when totalsOnly is true
      }

      expect(encodeBool(state.showTotals)).toBe(1)
      expect(encodeBool(state.showTotalsOnly)).toBe(1)
      expect(encodeBool(state.showPI)).toBe(0)
    })

    it('should handle filtered view (hideIncomplete)', () => {
      const state = {
        hideIncomplete: true
      }

      // hideIncomplete is inverted in URL (i parameter shows incomplete data)
      const urlParam = encodeBool(!state.hideIncomplete)
      expect(urlParam).toBe(0)

      // Verify round-trip
      const decoded = !decodeBool(String(urlParam))
      expect(decoded).toBe(true)
    })
  })
})
