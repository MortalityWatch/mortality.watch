import { describe, it, expect } from 'vitest'
import {
  encodeBool,
  decodeBool,
  encodeString,
  decodeString,
  encodePreset,
  decodePreset
} from './stateSerializer'

describe('stateSerializer', () => {
  describe('encodeBool', () => {
    it('should encode true as 1', () => {
      expect(encodeBool(true)).toBe(1)
    })

    it('should encode false as 0', () => {
      expect(encodeBool(false)).toBe(0)
    })

    it('should return undefined for undefined', () => {
      expect(encodeBool(undefined)).toBeUndefined()
    })
  })

  describe('decodeBool', () => {
    it('should decode 1 as true', () => {
      expect(decodeBool(1)).toBe(true)
      expect(decodeBool('1')).toBe(true)
    })

    it('should decode 0 as false', () => {
      expect(decodeBool(0)).toBe(false)
      expect(decodeBool('0')).toBe(false)
    })

    it('should return undefined for undefined', () => {
      expect(decodeBool(undefined)).toBeUndefined()
    })

    it('should decode other values as false', () => {
      expect(decodeBool(2)).toBe(false)
      expect(decodeBool('2')).toBe(false)
      expect(decodeBool('abc')).toBe(false)
    })
  })

  describe('encodeString', () => {
    it('should encode string with special characters', () => {
      expect(encodeString('hello world')).toBe('hello%20world')
      expect(encodeString('a&b')).toBe('a%26b')
    })

    it('should return undefined for undefined', () => {
      expect(encodeString(undefined)).toBeUndefined()
    })

    it('should encode empty string', () => {
      expect(encodeString('')).toBe('')
    })

    it('should encode string with special URL characters', () => {
      expect(encodeString('test/path?query=1')).toBe('test%2Fpath%3Fquery%3D1')
    })
  })

  describe('decodeString', () => {
    it('should decode encoded string', () => {
      expect(decodeString('hello%20world')).toBe('hello world')
      expect(decodeString('a%26b')).toBe('a&b')
    })

    it('should return undefined for undefined', () => {
      expect(decodeString(undefined)).toBeUndefined()
    })

    it('should decode empty string', () => {
      expect(decodeString('')).toBe('')
    })

    it('should decode URL-encoded special characters', () => {
      expect(decodeString('test%2Fpath%3Fquery%3D1')).toBe('test/path?query=1')
    })
  })

  describe('encodePreset', () => {
    it('should encode "Fit to Page" as "fit"', () => {
      expect(encodePreset('Fit to Page')).toBe('fit')
    })

    it('should extract dimensions from preset name', () => {
      expect(encodePreset('Medium (1000×625)')).toBe('1000x625')
      expect(encodePreset('Large (1920×1080)')).toBe('1920x1080')
    })

    it('should return undefined for undefined', () => {
      expect(encodePreset(undefined)).toBeUndefined()
    })

    it('should return original string if no dimensions found', () => {
      expect(encodePreset('Custom')).toBe('Custom')
    })

    it('should handle preset with different formats', () => {
      expect(encodePreset('Small (800×600)')).toBe('800x600')
    })
  })

  describe('decodePreset', () => {
    it('should decode "fit" as "Fit to Page"', () => {
      expect(decodePreset('fit')).toBe('Fit to Page')
    })

    it('should handle dimension format', () => {
      expect(decodePreset('1000x625')).toBe('1000x625')
      expect(decodePreset('1920x1080')).toBe('1920x1080')
    })

    it('should return undefined for undefined', () => {
      expect(decodePreset(undefined)).toBeUndefined()
    })

    it('should return original string if not special format', () => {
      expect(decodePreset('Custom')).toBe('Custom')
    })

    it('should handle invalid dimension format', () => {
      expect(decodePreset('1000')).toBe('1000')
      expect(decodePreset('abc')).toBe('abc')
    })
  })

  describe('round-trip encoding/decoding', () => {
    it('should preserve boolean through encode/decode', () => {
      expect(decodeBool(encodeBool(true))).toBe(true)
      expect(decodeBool(encodeBool(false))).toBe(false)
    })

    it('should preserve string through encode/decode', () => {
      const testStrings = ['hello world', 'test/path', 'a&b=c', '']
      testStrings.forEach((str) => {
        expect(decodeString(encodeString(str))).toBe(str)
      })
    })

    it('should preserve "Fit to Page" preset through encode/decode', () => {
      expect(decodePreset(encodePreset('Fit to Page'))).toBe('Fit to Page')
    })

    it('should preserve dimension presets through encode/decode', () => {
      const dimensions = encodePreset('Medium (1000×625)')
      expect(dimensions).toBe('1000x625')
      expect(decodePreset(dimensions)).toBe('1000x625')
    })
  })
})
