import { describe, it, expect } from 'vitest'
import {
  encodeBool,
  decodeBool,
  encodeString,
  decodeString
} from './fieldEncoders'

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
  })
})
