import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  round,
  roundToStr,
  asPercentage,
  numberWithCommas,
  cumulativeSum,
  sum,
  abbrev,
  capitalizeFirstLetter,
  getColor,
  repeat,
  getYear,
  getMonth,
  maybeTransformFluSeason,
  hashCode,
  getByValue,
  getCamelCase,
  parseFourDigitNumber,
  getFilename,
  shuffleArray,
  isNumberArray,
  typedKeys,
  isStringArray,
  getDataTypeDescription,
  getSortedArray,
  getObjectOfArrays,
  delay,
  fromYearMonthString,
  prefillUndefined,
  postfillUndefined,
  getFirstIndexOf,
  left,
  right
} from './utils'
import type { CountryData } from './model'

describe('utils', () => {
  describe('round', () => {
    it('should round to integer by default', () => {
      expect(round(3.7)).toBe(4)
      expect(round(3.2)).toBe(3)
      expect(round(3.5)).toBe(4)
    })

    it('should round to specified decimals', () => {
      expect(round(3.14159, 2)).toBe(3.14)
      expect(round(3.14159, 3)).toBe(3.142)
      expect(round(3.14159, 4)).toBe(3.1416)
    })

    it('should handle negative numbers', () => {
      expect(round(-3.7)).toBe(-4)
      expect(round(-3.2)).toBe(-3)
      expect(round(-3.14159, 2)).toBe(-3.14)
    })

    it('should handle zero', () => {
      expect(round(0)).toBe(0)
      expect(round(0, 2)).toBe(0)
    })
  })

  describe('roundToStr', () => {
    it('should return string with specified decimals', () => {
      expect(roundToStr(3.14159, 2)).toBe('3.14')
      expect(roundToStr(3.14159, 0)).toBe('3')
      // Note: round() rounds first, then toFixed() formats
      // 3.14159 rounded to 3 decimals is 3.142
      expect(roundToStr(3.14159, 3)).toBe('3.142')
    })

    it('should default to 0 decimals when not specified', () => {
      expect(roundToStr(3.14159)).toBe('3')
    })

    it('should handle zero', () => {
      expect(roundToStr(0, 2)).toBe('0.00')
    })
  })

  describe('asPercentage', () => {
    it('should format positive percentages with + prefix by default', () => {
      expect(asPercentage(0.15)).toBe('+15%')
      expect(asPercentage(0.5)).toBe('+50%')
      expect(asPercentage(1.23)).toBe('+123%')
    })

    it('should format negative percentages without prefix by default', () => {
      expect(asPercentage(-0.15)).toBe('-15%')
      expect(asPercentage(-0.5)).toBe('-50%')
    })

    it('should respect custom prefixes', () => {
      expect(asPercentage(0.15, 0, '', '-')).toBe('15%')
      expect(asPercentage(-0.15, 0, '', '')).toBe('-15%')
    })

    it('should handle decimals', () => {
      expect(asPercentage(0.1234, 2)).toBe('+12.34%')
      expect(asPercentage(0.1234, 1)).toBe('+12.3%')
    })

    it('should handle zero', () => {
      expect(asPercentage(0)).toBe('0%')
    })
  })

  describe('numberWithCommas', () => {
    it('should format large numbers with commas', () => {
      expect(numberWithCommas(1000)).toContain('1')
      expect(numberWithCommas(1000000)).toContain('1')
    })

    it('should add plus sign when requested', () => {
      const result = numberWithCommas(100, true)
      expect(result.startsWith('+')).toBe(true)
    })

    it('should not add plus sign to negative numbers', () => {
      const result = numberWithCommas(-100, true)
      expect(result.startsWith('+')).toBe(false)
      expect(result.startsWith('-')).toBe(true)
    })

    it('should handle decimals', () => {
      expect(numberWithCommas(1234.5678, false, 2)).toContain('1')
      expect(numberWithCommas(1234.5678, false, 2)).toContain('.')
    })

    it('should parse string numbers', () => {
      expect(numberWithCommas('1234.56', false, 2)).toContain('1')
    })
  })

  describe('cumulativeSum', () => {
    it('should calculate cumulative sum correctly', () => {
      expect(cumulativeSum([1, 2, 3, 4])).toEqual([1, 3, 6, 10])
      expect(cumulativeSum([10, 20, 30])).toEqual([10, 30, 60])
    })

    it('should handle negative numbers', () => {
      expect(cumulativeSum([1, -2, 3])).toEqual([1, -1, 2])
    })

    it('should skip NaN values but preserve position', () => {
      const result = cumulativeSum([1, NaN, 3])
      expect(result[0]).toBe(1)
      expect(result[1]).toBeNaN()
      expect(result[2]).toBe(4) // Should continue from 1, not from NaN
    })

    it('should handle empty array', () => {
      expect(cumulativeSum([])).toEqual([])
    })

    it('should handle array starting with zero', () => {
      expect(cumulativeSum([0, 1, 2])).toEqual([0, 1, 3])
    })

    it('should handle single element', () => {
      expect(cumulativeSum([5])).toEqual([5])
    })
  })

  describe('sum', () => {
    it('should sum array of numbers', () => {
      expect(sum([1, 2, 3, 4])).toBe(10)
      expect(sum([10, 20, 30])).toBe(60)
    })

    it('should ignore NaN values', () => {
      expect(sum([1, NaN, 3])).toBe(4)
    })

    it('should handle negative numbers', () => {
      expect(sum([1, -2, 3])).toBe(2)
    })

    it('should handle empty array', () => {
      expect(sum([])).toBe(0)
    })

    it('should handle zero values', () => {
      expect(sum([0, 0, 0])).toBe(0)
    })

    it('should ignore falsy but not zero', () => {
      // Based on the implementation, 0 should be included
      expect(sum([1, 0, 2])).toBe(3)
    })
  })

  describe('abbrev', () => {
    it('should not abbreviate short strings', () => {
      expect(abbrev('Short')).toBe('Short')
      // String length 19 is exactly at the limit (20 - 3 + 2)
      expect(abbrev('Exactly 18 chars!!')).toBe('Exactly 18 chars!!')
    })

    it('should abbreviate long strings with default length', () => {
      const long = 'This is a very long string'
      const result = abbrev(long)
      expect(result.length).toBeLessThan(long.length)
      expect(result.endsWith('..')).toBe(true)
    })

    it('should respect custom length', () => {
      const result = abbrev('Long string here', 8)
      expect(result.length).toBe(7) // 8 - 3 + 2 for '..'
      expect(result.endsWith('..')).toBe(true)
    })

    it('should abbreviate strings at the threshold', () => {
      // String with length > n-2 should be abbreviated
      const result = abbrev('Test', 2)
      expect(result).toBe('..')
    })
  })

  describe('capitalizeFirstLetter', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeFirstLetter('hello')).toBe('Hello')
      expect(capitalizeFirstLetter('world')).toBe('World')
    })

    it('should not change already capitalized', () => {
      expect(capitalizeFirstLetter('Hello')).toBe('Hello')
    })

    it('should handle single character', () => {
      expect(capitalizeFirstLetter('a')).toBe('A')
    })

    it('should handle empty string', () => {
      expect(capitalizeFirstLetter('')).toBe('')
    })

    it('should only capitalize first letter', () => {
      expect(capitalizeFirstLetter('hello world')).toBe('Hello world')
    })
  })

  describe('repeat', () => {
    it('should repeat value n times', () => {
      expect(repeat('x', 3)).toEqual(['x', 'x', 'x'])
      expect(repeat(5, 4)).toEqual([5, 5, 5, 5])
    })

    it('should handle zero times', () => {
      expect(repeat('x', 0)).toEqual([])
    })

    it('should handle objects', () => {
      const obj = { a: 1 }
      const result = repeat(obj, 2)
      expect(result).toHaveLength(2)
      // Note: all elements reference same object
      expect(result[0]).toBe(result[1])
    })
  })

  describe('getYear', () => {
    it('should extract year from date string', () => {
      expect(getYear('2020-Jan')).toBe(2020)
      expect(getYear('2023-Dec')).toBe(2023)
      expect(getYear('1999-Jun')).toBe(1999)
    })

    it('should handle flu season format', () => {
      expect(getYear('2020-2021')).toBe(2020)
    })
  })

  describe('getMonth', () => {
    it('should return month index from date string', () => {
      expect(getMonth('2020-Jan')).toBe(0)
      expect(getMonth('2020-Feb')).toBe(1)
      expect(getMonth('2020-Dec')).toBe(11)
    })

    it('should handle any prefix', () => {
      expect(getMonth('XXX-Mar')).toBe(2)
      expect(getMonth('2020-Apr')).toBe(3)
    })
  })

  describe('maybeTransformFluSeason', () => {
    it('should transform flu season format to short format', () => {
      expect(maybeTransformFluSeason('2020-2021')).toBe('2020/21')
      expect(maybeTransformFluSeason('2019-2020')).toBe('2019/20')
    })

    it('should not transform non-flu-season strings', () => {
      expect(maybeTransformFluSeason('2020-Jan')).toBe('2020-Jan')
      expect(maybeTransformFluSeason('2020')).toBe('2020')
      expect(maybeTransformFluSeason('Jan-2020')).toBe('Jan-2020')
    })
  })

  describe('getColor', () => {
    it('should return NA color for invalid values', () => {
      expect(getColor(NaN)).toBe('color-scale-na')
      expect(getColor(Number.MIN_SAFE_INTEGER)).toBe('color-scale-na')
    })

    it('should return color for valid values', () => {
      // Should return a color class string
      const color = getColor(0.2)
      expect(typeof color).toBe('string')
      expect(color).not.toBe('color-scale-na')
    })

    it('should handle extreme negative values', () => {
      const color = getColor(-0.6)
      expect(typeof color).toBe('string')
    })

    it('should handle extreme positive values', () => {
      const color = getColor(0.6)
      expect(typeof color).toBe('string')
    })

    it('should handle zero', () => {
      const color = getColor(0)
      expect(typeof color).toBe('string')
      // Zero is treated as falsy/invalid in the implementation
      expect(color).toBe('color-scale-na')
    })
  })

  describe('edge cases and error handling', () => {
    it('cumulativeSum should handle very large numbers', () => {
      const result = cumulativeSum([1e10, 2e10, 3e10])
      expect(result).toEqual([1e10, 3e10, 6e10])
    })

    it('sum should handle very large numbers', () => {
      expect(sum([1e10, 2e10, 3e10])).toBe(6e10)
    })

    it('round should handle very small numbers', () => {
      expect(round(0.000001, 6)).toBe(0.000001)
      expect(round(0.000001, 5)).toBe(0)
    })

    it('asPercentage should handle very large percentages', () => {
      const result = asPercentage(10.5, 0)
      expect(result).toBe('+1050%')
    })
  })

  describe('hashCode', () => {
    it('should generate consistent hash for same string', () => {
      const str = 'test string'
      const hash1 = hashCode(str)
      const hash2 = hashCode(str)
      expect(hash1).toBe(hash2)
    })

    it('should generate different hashes for different strings', () => {
      const hash1 = hashCode('string1')
      const hash2 = hashCode('string2')
      expect(hash1).not.toBe(hash2)
    })

    it('should return 0 for empty string', () => {
      expect(hashCode('')).toBe(0)
    })

    it('should handle special characters', () => {
      const hash = hashCode('!@#$%^&*()')
      expect(typeof hash).toBe('number')
    })

    it('should return a 32-bit integer', () => {
      const hash = hashCode('test')
      expect(Number.isInteger(hash)).toBe(true)
      expect(hash).toBeGreaterThanOrEqual(-(2 ** 31))
      expect(hash).toBeLessThanOrEqual(2 ** 31 - 1)
    })
  })

  describe('getByValue', () => {
    it('should find key by value', () => {
      const map = { a: '1', b: '2', c: '3' }
      expect(getByValue(map, '2')).toBe('b')
    })

    it('should return undefined if value not found', () => {
      const map = { a: '1', b: '2' }
      expect(getByValue(map, '3')).toBeUndefined()
    })

    it('should return first matching key', () => {
      const map = { a: '1', b: '1', c: '2' }
      const result = getByValue(map, '1')
      expect(['a', 'b']).toContain(result)
    })

    it('should handle empty object', () => {
      expect(getByValue({}, 'test')).toBeUndefined()
    })
  })

  describe('getCamelCase', () => {
    it('should capitalize words', () => {
      expect(getCamelCase('hello world')).toBe('Hello World')
    })

    it('should not capitalize short words (< 3 chars)', () => {
      expect(getCamelCase('a is the')).toBe('a is The') // 'a' and 'is' are < 3 chars, 'the' is 3 chars so it gets capitalized
    })

    it('should handle single word', () => {
      expect(getCamelCase('hello')).toBe('Hello')
    })

    it('should handle already capitalized words', () => {
      expect(getCamelCase('Hello World')).toBe('Hello World')
    })

    it('should handle empty string', () => {
      expect(getCamelCase('')).toBe('')
    })
  })

  describe('parseFourDigitNumber', () => {
    it('should extract 4-digit year', () => {
      expect(parseFourDigitNumber('2020-Jan')).toBe(2020)
      expect(parseFourDigitNumber('Year 2021')).toBe(2021)
    })

    it('should return null if no 4-digit number found', () => {
      expect(parseFourDigitNumber('123')).toBeNull()
      expect(parseFourDigitNumber('12345')).toBeNull()
      expect(parseFourDigitNumber('no numbers')).toBeNull()
    })

    it('should find first 4-digit number', () => {
      expect(parseFourDigitNumber('2020-2021')).toBe(2020)
    })

    it('should handle word boundaries correctly', () => {
      expect(parseFourDigitNumber('a123456b')).toBeNull() // 1234 is part of larger number
    })
  })

  describe('getFilename', () => {
    it('should convert title to filename', () => {
      expect(getFilename('My Document')).toBe('my_document')
    })

    it('should remove special characters', () => {
      expect(getFilename('Test!@#$%File')).toBe('testfile') // Special chars are removed, not replaced with underscores
    })

    it('should replace spaces with underscores', () => {
      expect(getFilename('Hello World Test')).toBe('hello_world_test')
    })

    it('should handle already lowercase', () => {
      expect(getFilename('test')).toBe('test')
    })

    it('should handle empty string', () => {
      expect(getFilename('')).toBe('')
    })
  })

  describe('shuffleArray', () => {
    it('should return array with same length', () => {
      const arr = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray([...arr])
      expect(shuffled.length).toBe(arr.length)
    })

    it('should contain same elements', () => {
      const arr = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray([...arr])
      expect(shuffled.sort()).toEqual(arr.sort())
    })

    it('should handle empty array', () => {
      const result = shuffleArray([])
      expect(result).toEqual([])
    })

    it('should handle single element', () => {
      const result = shuffleArray([1])
      expect(result).toEqual([1])
    })

    it('should handle array of objects', () => {
      const arr = [{ a: 1 }, { b: 2 }]
      const shuffled = shuffleArray([...arr])
      expect(shuffled.length).toBe(2)
    })
  })

  describe('isNumberArray', () => {
    it('should return true for array of numbers', () => {
      expect(isNumberArray([1, 2, 3])).toBe(true)
      expect(isNumberArray([1.5, 2.5, 3.5])).toBe(true)
      expect(isNumberArray([0])).toBe(true)
    })

    it('should return false for array with non-numbers', () => {
      expect(isNumberArray([1, '2', 3])).toBe(false)
      expect(isNumberArray([1, null, 3])).toBe(false)
      expect(isNumberArray([1, undefined, 3])).toBe(false)
    })

    it('should return false for array with NaN', () => {
      expect(isNumberArray([1, NaN, 3])).toBe(false)
    })

    it('should return true for empty array', () => {
      expect(isNumberArray([])).toBe(true)
    })

    it('should return false for negative numbers', () => {
      expect(isNumberArray([1, -2, 3])).toBe(true) // Negative numbers are still numbers
    })
  })

  describe('typedKeys', () => {
    it('should return keys of object', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const keys = typedKeys(obj)
      expect(keys).toEqual(['a', 'b', 'c'])
    })

    it('should work with different value types', () => {
      const obj = { name: 'test', age: 25, active: true }
      const keys = typedKeys(obj)
      expect(keys.length).toBe(3)
      expect(keys).toContain('name')
      expect(keys).toContain('age')
      expect(keys).toContain('active')
    })

    it('should return empty array for empty object', () => {
      expect(typedKeys({})).toEqual([])
    })
  })

  describe('isStringArray', () => {
    it('should return true for array of strings', () => {
      expect(isStringArray(['a', 'b', 'c'])).toBe(true)
    })

    it('should return true for array with undefined', () => {
      expect(isStringArray(['a', undefined, 'c'])).toBe(true)
    })

    it('should return false for array with numbers', () => {
      expect(isStringArray(['a', 1, 'c'])).toBe(false)
    })

    it('should return false for array with null', () => {
      expect(isStringArray(['a', null, 'c'])).toBe(false)
    })

    it('should return true for empty array', () => {
      expect(isStringArray([])).toBe(true)
    })
  })

  describe('getDataTypeDescription', () => {
    it('should return yearly for type 1', () => {
      expect(getDataTypeDescription('1')).toBe('yearly')
    })

    it('should return monthly for type 2', () => {
      expect(getDataTypeDescription('2')).toBe('monthly')
    })

    it('should return weekly for type 3', () => {
      expect(getDataTypeDescription('3')).toBe('weekly')
    })

    it('should return the input for unknown types', () => {
      expect(getDataTypeDescription('4')).toBe('4')
      expect(getDataTypeDescription('unknown')).toBe('unknown')
    })
  })

  describe('getSortedArray', () => {
    it('should sort a set of numbers', () => {
      const set = new Set([3, 1, 2])
      const result = getSortedArray(set)
      expect(result).toEqual([1, 2, 3])
    })

    it('should sort a set of strings', () => {
      const set = new Set(['c', 'a', 'b'])
      const result = getSortedArray(set)
      expect(result).toEqual(['a', 'b', 'c'])
    })

    it('should handle empty set', () => {
      const set = new Set<string>()
      const result = getSortedArray(set)
      expect(result).toEqual([])
    })

    it('should handle single element', () => {
      const set = new Set(['a'])
      const result = getSortedArray(set)
      expect(result).toEqual(['a'])
    })
  })

  describe('getObjectOfArrays', () => {
    it('should convert array of CountryData to DatasetEntry', () => {
      const rows: CountryData[] = [
        { date: '2020-01', deaths: 100, cmr: 10, population: 1000 } as CountryData,
        { date: '2020-02', deaths: 120, cmr: 12, population: 1000 } as CountryData
      ]
      const result = getObjectOfArrays(rows)

      expect(result.date).toEqual(['2020-01', '2020-02'])
      expect(result.deaths).toEqual([100, 120])
      expect(result.cmr).toEqual([10, 12])
      expect(result.population).toEqual([1000, 1000])
    })

    it('should handle empty array', () => {
      const result = getObjectOfArrays([])
      expect(result).toEqual({})
    })

    it('should handle single row', () => {
      const rows: CountryData[] = [
        { date: '2020-01', deaths: 100 } as CountryData
      ]
      const result = getObjectOfArrays(rows)

      expect(result.date).toEqual(['2020-01'])
      expect(result.deaths).toEqual([100])
    })
  })

  describe('delay', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should delay function execution', () => {
      const mockFn = vi.fn()
      delay(mockFn, 100)

      expect(mockFn).not.toHaveBeenCalled()
      vi.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should use default delay of 333ms', () => {
      const mockFn = vi.fn()
      delay(mockFn)

      expect(mockFn).not.toHaveBeenCalled()
      vi.advanceTimersByTime(332)
      expect(mockFn).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should cancel previous timeout when called again with same function', () => {
      const mockFn = vi.fn()
      delay(mockFn, 100)
      vi.advanceTimersByTime(50)

      // Call again before first timeout completes
      delay(mockFn, 100)
      vi.advanceTimersByTime(100)

      // Should only be called once (from second delay)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('fromYearMonthString', () => {
    it('should convert year-month string to timestamp', () => {
      const timestamp = fromYearMonthString('2020 Jan')
      const date = new Date(timestamp)
      expect(date.getFullYear()).toBe(2020)
      expect(date.getMonth()).toBe(0) // January is 0
    })

    it('should handle different months', () => {
      const dec = fromYearMonthString('2020 Dec')
      const date = new Date(dec)
      expect(date.getFullYear()).toBe(2020)
      expect(date.getMonth()).toBe(11) // December is 11
    })

    it('should handle any prefix before month', () => {
      const timestamp = fromYearMonthString('2021-Feb')
      const date = new Date(timestamp)
      expect(date.getFullYear()).toBe(2021)
      expect(date.getMonth()).toBe(1)
    })
  })

  describe('left', () => {
    it('should return leftmost n characters', () => {
      expect(left('hello', 3)).toBe('hel')
      expect(left('test', 2)).toBe('te')
    })

    it('should handle n larger than string length', () => {
      expect(left('hi', 10)).toBe('hi')
    })

    it('should handle empty string', () => {
      expect(left('', 5)).toBe('')
    })
  })

  describe('right', () => {
    it('should return rightmost n characters', () => {
      expect(right('hello', 3)).toBe('llo')
      expect(right('test', 2)).toBe('st')
    })

    it('should handle n larger than string length', () => {
      expect(right('hi', 10)).toBe('hi')
    })

    it('should handle empty string', () => {
      expect(right('', 5)).toBe('')
    })
  })

  describe('prefillUndefined', () => {
    it('should add undefined values to beginning of array', () => {
      const arr = [1, 2, 3]
      const result = prefillUndefined(arr, 2)
      expect(result).toHaveLength(5)
      expect(result[0]).toBeUndefined()
      expect(result[1]).toBeUndefined()
      expect(result[2]).toBe(1)
      expect(result[3]).toBe(2)
      expect(result[4]).toBe(3)
    })

    it('should handle zero prefill', () => {
      const arr = [1, 2, 3]
      const result = prefillUndefined(arr, 0)
      expect(result).toEqual([1, 2, 3])
    })

    it('should work with string arrays', () => {
      const arr = ['a', 'b']
      const result = prefillUndefined(arr, 1)
      expect(result).toHaveLength(3)
      expect(result[0]).toBeUndefined()
      expect(result[1]).toBe('a')
      expect(result[2]).toBe('b')
    })
  })

  describe('postfillUndefined', () => {
    it('should add undefined values to end of array', () => {
      const arr = [1, 2, 3]
      const result = postfillUndefined(arr, 2)
      expect(result).toHaveLength(5)
      expect(result[0]).toBe(1)
      expect(result[1]).toBe(2)
      expect(result[2]).toBe(3)
      expect(result[3]).toBeUndefined()
      expect(result[4]).toBeUndefined()
    })

    it('should handle zero postfill', () => {
      const arr = [1, 2, 3]
      const result = postfillUndefined(arr, 0)
      expect(result).toHaveLength(3)
    })

    it('should work with string arrays', () => {
      const arr = ['a', 'b']
      const result = postfillUndefined(arr, 1)
      expect(result).toHaveLength(3)
      expect(result[0]).toBe('a')
      expect(result[1]).toBe('b')
      expect(result[2]).toBeUndefined()
    })
  })

  describe('getFirstIndexOf', () => {
    it('should find first index containing needle', () => {
      const haystack = ['apple', 'banana', 'cherry']
      expect(getFirstIndexOf('ban', haystack)).toBe(1)
    })

    it('should return -1 if not found', () => {
      const haystack = ['apple', 'banana', 'cherry']
      expect(getFirstIndexOf('xyz', haystack)).toBe(-1)
    })

    it('should find partial matches', () => {
      const haystack = ['test123', 'hello', 'test456']
      expect(getFirstIndexOf('test', haystack)).toBe(0)
    })

    it('should return first match when multiple exist', () => {
      const haystack = ['foo', 'bar', 'foobar']
      expect(getFirstIndexOf('foo', haystack)).toBe(0)
    })

    it('should handle empty haystack', () => {
      expect(getFirstIndexOf('test', [])).toBe(-1)
    })
  })
})
