import { describe, it, expect } from 'vitest'
import {
  getIso2Code,
  getFlagEmojiFromCode,
  getFlagEmoji,
  isSubNationalRegion,
  getParentCountry
} from './countryUtils'

describe('countryUtils', () => {
  describe('getIso2Code', () => {
    it('should return iso2 code for standard countries', () => {
      expect(getIso2Code('USA')).toBe('us')
      expect(getIso2Code('DEU')).toBe('de')
      expect(getIso2Code('GBR')).toBe('gb')
      expect(getIso2Code('SWE')).toBe('se')
    })

    it('should handle US states', () => {
      expect(getIso2Code('USA-CA')).toBe('us')
      expect(getIso2Code('USA-NY')).toBe('us')
      expect(getIso2Code('USA-TX')).toBe('us')
    })

    it('should handle Canadian provinces', () => {
      expect(getIso2Code('CAN-ON')).toBe('ca')
      expect(getIso2Code('CAN-QC')).toBe('ca')
    })

    it('should handle German states', () => {
      expect(getIso2Code('DEU-BY')).toBe('de')
      expect(getIso2Code('DEU-NW')).toBe('de')
    })

    it('should handle UK special cases', () => {
      expect(getIso2Code('GBRTENW')).toBe('gb')
      expect(getIso2Code('GBR_SCO')).toBe('gb')
      expect(getIso2Code('GBR_NIR')).toBe('gb')
    })

    it('should return null for invalid codes', () => {
      expect(getIso2Code('INVALID')).toBeNull()
      expect(getIso2Code('XXX')).toBeNull()
    })
  })

  describe('getFlagEmojiFromCode', () => {
    it('should convert iso2 code to flag emoji', () => {
      expect(getFlagEmojiFromCode('us')).toBe('🇺🇸')
      expect(getFlagEmojiFromCode('gb')).toBe('🇬🇧')
      expect(getFlagEmojiFromCode('de')).toBe('🇩🇪')
      expect(getFlagEmojiFromCode('se')).toBe('🇸🇪')
    })

    it('should handle uppercase codes', () => {
      expect(getFlagEmojiFromCode('US')).toBe('🇺🇸')
      expect(getFlagEmojiFromCode('GB')).toBe('🇬🇧')
    })

    it('should return empty string for invalid codes', () => {
      expect(getFlagEmojiFromCode('')).toBe('')
      expect(getFlagEmojiFromCode('a')).toBe('')
      expect(getFlagEmojiFromCode('abc')).toBe('')
    })
  })

  describe('getFlagEmoji', () => {
    it('should return flag emoji for standard countries', () => {
      expect(getFlagEmoji('USA')).toBe('🇺🇸')
      expect(getFlagEmoji('GBR')).toBe('🇬🇧')
      expect(getFlagEmoji('DEU')).toBe('🇩🇪')
    })

    it('should return parent country flag for sub-national regions', () => {
      expect(getFlagEmoji('USA-CA')).toBe('🇺🇸')
      expect(getFlagEmoji('CAN-ON')).toBe('🇨🇦')
      expect(getFlagEmoji('DEU-BY')).toBe('🇩🇪')
    })

    it('should return empty string for invalid codes', () => {
      expect(getFlagEmoji('INVALID')).toBe('')
    })
  })

  describe('isSubNationalRegion', () => {
    it('should return true for US states', () => {
      expect(isSubNationalRegion('USA-CA')).toBe(true)
      expect(isSubNationalRegion('USA-NY')).toBe(true)
    })

    it('should return true for Canadian provinces', () => {
      expect(isSubNationalRegion('CAN-ON')).toBe(true)
      expect(isSubNationalRegion('CAN-QC')).toBe(true)
    })

    it('should return true for German states', () => {
      expect(isSubNationalRegion('DEU-BY')).toBe(true)
      expect(isSubNationalRegion('DEU-NW')).toBe(true)
    })

    it('should return true for UK regions', () => {
      expect(isSubNationalRegion('GBRTENW')).toBe(true)
      expect(isSubNationalRegion('GBR_SCO')).toBe(true)
      expect(isSubNationalRegion('GBR_NIR')).toBe(true)
    })

    it('should return false for standard countries', () => {
      expect(isSubNationalRegion('USA')).toBe(false)
      expect(isSubNationalRegion('CAN')).toBe(false)
      expect(isSubNationalRegion('DEU')).toBe(false)
      expect(isSubNationalRegion('GBR')).toBe(false)
      expect(isSubNationalRegion('SWE')).toBe(false)
    })
  })

  describe('getParentCountry', () => {
    it('should return parent country for US states', () => {
      expect(getParentCountry('USA-CA')).toBe('USA')
      expect(getParentCountry('USA-NY')).toBe('USA')
    })

    it('should return parent country for Canadian provinces', () => {
      expect(getParentCountry('CAN-ON')).toBe('CAN')
    })

    it('should return parent country for German states', () => {
      expect(getParentCountry('DEU-BY')).toBe('DEU')
    })

    it('should return parent country for UK regions', () => {
      expect(getParentCountry('GBRTENW')).toBe('GBR')
      expect(getParentCountry('GBR_SCO')).toBe('GBR')
      expect(getParentCountry('GBR_NIR')).toBe('GBR')
    })

    it('should return null for standard countries', () => {
      expect(getParentCountry('USA')).toBeNull()
      expect(getParentCountry('CAN')).toBeNull()
      expect(getParentCountry('DEU')).toBeNull()
      expect(getParentCountry('GBR')).toBeNull()
    })
  })
})
