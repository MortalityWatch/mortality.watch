import { describe, it, expect } from 'vitest'

// Test the path validation regex pattern
const VALID_PATH_PATTERN = /^(?:world_meta\.csv|[A-Z]{2,3}(?:-[A-Z]{2,3})?\/[a-z]+(?:_[\w+-]+)?\.csv)$/

describe('data path validation', () => {
  describe('valid paths', () => {
    it('should accept world_meta.csv', () => {
      expect(VALID_PATH_PATTERN.test('world_meta.csv')).toBe(true)
    })

    it('should accept country/chartType.csv patterns', () => {
      expect(VALID_PATH_PATTERN.test('USA/weekly.csv')).toBe(true)
      expect(VALID_PATH_PATTERN.test('GBR/monthly.csv')).toBe(true)
      expect(VALID_PATH_PATTERN.test('DE/yearly.csv')).toBe(true)
    })

    it('should accept country/chartType_ageGroup.csv patterns', () => {
      expect(VALID_PATH_PATTERN.test('USA/weekly_0-14.csv')).toBe(true)
      expect(VALID_PATH_PATTERN.test('GBR/monthly_15-64.csv')).toBe(true)
      expect(VALID_PATH_PATTERN.test('USA/weekly_65-74.csv')).toBe(true)
      expect(VALID_PATH_PATTERN.test('USA/weekly_75-84.csv')).toBe(true)
      expect(VALID_PATH_PATTERN.test('USA/weekly_85+.csv')).toBe(true)
    })

    it('should accept 2-letter and 3-letter country codes', () => {
      expect(VALID_PATH_PATTERN.test('US/weekly.csv')).toBe(true)
      expect(VALID_PATH_PATTERN.test('USA/weekly.csv')).toBe(true)
      expect(VALID_PATH_PATTERN.test('GB/monthly.csv')).toBe(true)
      expect(VALID_PATH_PATTERN.test('GBR/monthly.csv')).toBe(true)
    })

    it('should accept sub-country jurisdiction codes', () => {
      expect(VALID_PATH_PATTERN.test('USA-FL/weekly.csv')).toBe(true)
      expect(VALID_PATH_PATTERN.test('USA-CA/fluseason.csv')).toBe(true)
      expect(VALID_PATH_PATTERN.test('DEU-SN/monthly.csv')).toBe(true)
      expect(VALID_PATH_PATTERN.test('CAN-ON/yearly.csv')).toBe(true)
      expect(VALID_PATH_PATTERN.test('USA-FL/weekly_0-14.csv')).toBe(true)
      expect(VALID_PATH_PATTERN.test('USA-CA/weekly_85+.csv')).toBe(true)
    })
  })

  describe('path traversal attacks', () => {
    it('should reject paths with ../', () => {
      expect(VALID_PATH_PATTERN.test('../etc/passwd')).toBe(false)
      expect(VALID_PATH_PATTERN.test('USA/../../../etc/passwd')).toBe(false)
      expect(VALID_PATH_PATTERN.test('../../.data/db.sqlite')).toBe(false)
    })

    it('should reject absolute paths', () => {
      expect(VALID_PATH_PATTERN.test('/etc/passwd')).toBe(false)
      expect(VALID_PATH_PATTERN.test('/Users/ben/.ssh/id_rsa')).toBe(false)
    })

    it('should reject paths with encoded traversal', () => {
      expect(VALID_PATH_PATTERN.test('%2e%2e/etc/passwd')).toBe(false)
      expect(VALID_PATH_PATTERN.test('..%2f..%2fetc/passwd')).toBe(false)
    })
  })

  describe('invalid path formats', () => {
    it('should reject paths with wrong extension', () => {
      expect(VALID_PATH_PATTERN.test('USA/weekly.json')).toBe(false)
      expect(VALID_PATH_PATTERN.test('USA/weekly.txt')).toBe(false)
      expect(VALID_PATH_PATTERN.test('world_meta.json')).toBe(false)
    })

    it('should reject paths with lowercase country codes', () => {
      expect(VALID_PATH_PATTERN.test('usa/weekly.csv')).toBe(false)
      expect(VALID_PATH_PATTERN.test('gbr/monthly.csv')).toBe(false)
    })

    it('should reject paths with uppercase chart types', () => {
      expect(VALID_PATH_PATTERN.test('USA/WEEKLY.csv')).toBe(false)
      expect(VALID_PATH_PATTERN.test('USA/Weekly.csv')).toBe(false)
    })

    it('should reject paths with extra directories', () => {
      expect(VALID_PATH_PATTERN.test('USA/subdir/weekly.csv')).toBe(false)
      expect(VALID_PATH_PATTERN.test('region/USA/weekly.csv')).toBe(false)
    })

    it('should reject paths with special characters', () => {
      expect(VALID_PATH_PATTERN.test('USA/weekly;ls.csv')).toBe(false)
      expect(VALID_PATH_PATTERN.test('USA/weekly|cat.csv')).toBe(false)
      expect(VALID_PATH_PATTERN.test('USA/weekly`id`.csv')).toBe(false)
    })

    it('should reject empty or malformed paths', () => {
      expect(VALID_PATH_PATTERN.test('')).toBe(false)
      expect(VALID_PATH_PATTERN.test('/')).toBe(false)
      expect(VALID_PATH_PATTERN.test('.csv')).toBe(false)
      expect(VALID_PATH_PATTERN.test('USA/')).toBe(false)
      expect(VALID_PATH_PATTERN.test('/USA/weekly.csv')).toBe(false)
    })

    it('should reject country codes that are too long or short', () => {
      expect(VALID_PATH_PATTERN.test('U/weekly.csv')).toBe(false)
      expect(VALID_PATH_PATTERN.test('USAA/weekly.csv')).toBe(false)
      // But sub-country jurisdictions with hyphen are valid
      expect(VALID_PATH_PATTERN.test('USA-FLOR/weekly.csv')).toBe(false) // second part > 3 chars
      expect(VALID_PATH_PATTERN.test('USAA-FL/weekly.csv')).toBe(false) // first part > 3 chars
    })
  })
})
