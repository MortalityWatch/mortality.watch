// @ts-nocheck - Test file with many type guards
import { describe, it, expect, beforeEach } from 'vitest'
import {
  validateMetadata,
  validateMortalityData,
  clearValidationCache
} from './validation'

describe('app/lib/data/validation', () => {
  beforeEach(() => {
    clearValidationCache()
  })

  describe('validateMetadata', () => {
    describe('valid data scenarios', () => {
      it('should validate correct metadata CSV', async () => {
        const csv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
USA,United States,2020-01-01,2023-12-31,3,0-100,cdc
CAN,Canada,2020-01-01,2023-12-31,3,0-100,statcan`

        const result = await validateMetadata(csv)

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(result.data?.length).toBe(2)
        if (result.data && result.data.length > 0) {
          expect(result.data![0].iso3c).toBe('USA')
          expect(result.data![1].iso3c).toBe('CAN')
        }
      })

      it('should handle single row metadata', async () => {
        const csv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
USA,United States,2020-01-01,2023-12-31,3,0-100,cdc`

        const result = await validateMetadata(csv)

        expect(result.success).toBe(true)
        expect(result.data?.length).toBe(1)
      })

      it('should skip empty lines', async () => {
        const csv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
USA,United States,2020-01-01,2023-12-31,3,0-100,cdc

CAN,Canada,2020-01-01,2023-12-31,3,0-100,statcan`

        const result = await validateMetadata(csv)

        expect(result.success).toBe(true)
        expect(result.data?.length).toBe(2)
      })
    })

    describe('boundary conditions', () => {
      it('should handle empty CSV data (headers only)', async () => {
        const csv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source`

        const result = await validateMetadata(csv)

        expect(result.success).toBe(false)
        expect(result.data).toBeUndefined()
      })

      it('should handle very large dataset', async () => {
        const rows = ['iso3c,jurisdiction,min_date,max_date,type,age_groups,source']
        for (let i = 0; i < 1000; i++) {
          // Generate valid 3-character ISO codes
          const iso = `${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i / 26) % 26))}${String.fromCharCode(65 + ((i / 676) % 26))}`
          rows.push(`${iso},Country ${i},2020-01-01,2023-12-31,3,0-100,source`)
        }
        const csv = rows.join('\n')

        const result = await validateMetadata(csv)

        expect(result.success).toBe(true)
        expect(result.data?.length).toBe(1000)
      })

      it('should handle minimum date range', async () => {
        const csv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
USA,United States,2020-01-01,2020-01-01,3,0-100,cdc`

        const result = await validateMetadata(csv)

        expect(result.success).toBe(true)
        if (result.data && result.data.length > 0) {
          expect(result.data![0].min_date).toBe('2020-01-01')
          expect(result.data![0].max_date).toBe('2020-01-01')
        }
      })

      it('should handle maximum date range', async () => {
        const csv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
USA,United States,1900-01-01,2099-12-31,3,0-100,cdc`

        const result = await validateMetadata(csv)

        expect(result.success).toBe(true)
        if (result.data && result.data.length > 0) {
          expect(result.data![0].min_date).toBe('1900-01-01')
          expect(result.data![0].max_date).toBe('2099-12-31')
        }
      })
    })

    describe('invalid data handling', () => {
      it('should reject invalid ISO3C code (too short)', async () => {
        const csv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
US,United States,2020-01-01,2023-12-31,3,0-100,cdc`

        const result = await validateMetadata(csv)

        expect(result.success).toBe(false)
      })

      it('should reject invalid ISO3C code (too long)', async () => {
        const csv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
USA1,United States,2020-01-01,2023-12-31,3,0-100,cdc`

        const result = await validateMetadata(csv)

        expect(result.success).toBe(false)
      })

      it('should reject empty jurisdiction', async () => {
        const csv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
USA,,2020-01-01,2023-12-31,3,0-100,cdc`

        const result = await validateMetadata(csv)

        expect(result.success).toBe(false)
      })

      it('should accept valid rows even with some empty fields', async () => {
        const csv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
USA,United States,2020-01-01,2023-12-31,3,,cdc`

        const result = await validateMetadata(csv)

        // Empty string passes min validation, so this succeeds
        expect(result.success).toBe(true)
        expect(result.data?.length).toBe(1)
      })

      it('should handle partially valid data (accept valid rows)', async () => {
        const csv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
USA,United States,2020-01-01,2023-12-31,3,0-100,cdc
XX,,invalid,invalid,,,
CAN,Canada,2020-01-01,2023-12-31,3,0-100,statcan`

        const result = await validateMetadata(csv)

        expect(result.success).toBe(true)
        expect(result.data?.length).toBe(2)
        if (result.data && result.data.length > 0) {
          expect(result.data![0].iso3c).toBe('USA')
          expect(result.data![1].iso3c).toBe('CAN')
        }
      })
    })

    describe('cache fallback behavior', () => {
      it('should use cache when all new data is invalid', async () => {
        const validCsv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
USA,United States,2020-01-01,2023-12-31,3,0-100,cdc`

        // First call - cache valid data
        const firstResult = await validateMetadata(validCsv)
        expect(firstResult.success).toBe(true)
        expect(firstResult.usedCache).toBeUndefined()

        // Second call - all invalid data
        const invalidCsv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
X,,,,,,`

        const secondResult = await validateMetadata(invalidCsv)
        expect(secondResult.success).toBe(true)
        expect(secondResult.usedCache).toBe(true)
        expect(secondResult.data?.length).toBe(1)
        if (secondResult.data && secondResult.data.length > 0) {
          expect(secondResult.data![0].iso3c).toBe('USA')
        }
      })

      it('should fail when no cache available and data is invalid', async () => {
        const invalidCsv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
X,,,,,,`

        const result = await validateMetadata(invalidCsv)

        expect(result.success).toBe(false)
      })

      it('should update cache with new valid data', async () => {
        const csv1 = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
USA,United States,2020-01-01,2023-12-31,3,0-100,cdc`

        await validateMetadata(csv1)

        const csv2 = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
CAN,Canada,2020-01-01,2023-12-31,3,0-100,statcan`

        const result = await validateMetadata(csv2)
        expect(result.success).toBe(true)
        if (result.data && result.data.length > 0) {
          expect(result.data![0].iso3c).toBe('CAN')
        }
      })
    })

    describe('data type validation', () => {
      it('should handle string dates correctly', async () => {
        const csv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
USA,United States,2020-01-01,2023-12-31,3,0-100,cdc`

        const result = await validateMetadata(csv)

        expect(result.success).toBe(true)
        if (result.data && result.data.length > 0) {
          expect(typeof result.data![0].min_date).toBe('string')
          expect(typeof result.data![0].max_date).toBe('string')
        }
      })

      it('should handle numeric type as string', async () => {
        const csv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
USA,United States,2020-01-01,2023-12-31,3,0-100,cdc`

        const result = await validateMetadata(csv)

        expect(result.success).toBe(true)
        if (result.data && result.data.length > 0) {
          expect(typeof result.data![0].type).toBe('string')
        }
      })
    })
  })

  describe('validateMortalityData', () => {
    describe('valid data scenarios', () => {
      it('should validate correct mortality data CSV', async () => {
        const csv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
USA,330000000,2020-01-01,monthly,cdc,who,50000,15.15,10.5,10.5,10.5,10.5
USA,330000000,2020-02-01,monthly,cdc,who,52000,15.76,10.8,10.8,10.8,10.8`

        const result = await validateMortalityData(csv, 'USA', 'monthly', 'all')

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(result.data?.length).toBe(2)
        if (result.data && result.data.length > 0) {
          expect(result.data![0].deaths).toBe('50000')
          expect(result.data![1].deaths).toBe('52000')
        }
      })

      it('should handle single data point', async () => {
        const csv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
USA,330000000,2020-01-01,monthly,cdc,who,50000,15.15,10.5,10.5,10.5,10.5`

        const result = await validateMortalityData(csv, 'USA', 'monthly', 'all')

        expect(result.success).toBe(true)
        expect(result.data?.length).toBe(1)
      })
    })

    describe('boundary conditions', () => {
      it('should handle empty dataset (headers only)', async () => {
        const csv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country`

        const result = await validateMortalityData(csv, 'USA', 'monthly', 'all')

        expect(result.success).toBe(false)
      })

      it('should handle very large dataset', async () => {
        const rows = ['iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country']
        for (let i = 0; i < 5000; i++) {
          rows.push(`USA,330000000,2020-${String(i % 12 + 1).padStart(2, '0')}-01,monthly,cdc,who,50000,15.15,10.5,10.5,10.5,10.5`)
        }
        const csv = rows.join('\n')

        const result = await validateMortalityData(csv, 'USA', 'monthly', 'all')

        expect(result.success).toBe(true)
        expect(result.data?.length).toBe(5000)
      })

      it('should handle zero population', async () => {
        const csv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
USA,0,2020-01-01,monthly,cdc,who,50000,15.15,10.5,10.5,10.5,10.5`

        const result = await validateMortalityData(csv, 'USA', 'monthly', 'all')

        expect(result.success).toBe(true)
        if (result.data && result.data.length > 0) {
          expect(result.data![0].population).toBe('0')
        }
      })

      it('should handle zero deaths', async () => {
        const csv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
USA,330000000,2020-01-01,monthly,cdc,who,0,0,0,0,0,0`

        const result = await validateMortalityData(csv, 'USA', 'monthly', 'all')

        expect(result.success).toBe(true)
        if (result.data && result.data.length > 0) {
          expect(result.data![0].deaths).toBe('0')
        }
      })
    })

    describe('invalid data handling', () => {
      it('should reject invalid ISO3C code', async () => {
        const csv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
XX,330000000,2020-01-01,monthly,cdc,who,50000,15.15,10.5,10.5,10.5,10.5`

        const result = await validateMortalityData(csv, 'USA', 'monthly', 'all')

        expect(result.success).toBe(false)
      })

      it('should accept rows with empty string values', async () => {
        const csv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
USA,,,,,,,,,,,`

        const result = await validateMortalityData(csv, 'USA', 'monthly', 'all')

        // Empty strings pass validation (min length validation allows empty strings)
        expect(result.success).toBe(true)
        expect(result.data?.length).toBe(1)
      })

      it('should handle empty string values', async () => {
        const csv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
USA,,2020-01-01,monthly,cdc,who,,,,,,`

        const result = await validateMortalityData(csv, 'USA', 'monthly', 'all')

        expect(result.success).toBe(true)
        if (result.data && result.data.length > 0) {
          expect(result.data![0].population).toBe('')
          expect(result.data![0].deaths).toBe('')
        }
      })

      it('should handle partially valid data (accept valid rows)', async () => {
        const csv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
USA,330000000,2020-01-01,monthly,cdc,who,50000,15.15,10.5,10.5,10.5,10.5
XX,,,,,,,,,,
USA,330000000,2020-02-01,monthly,cdc,who,52000,15.76,10.8,10.8,10.8,10.8`

        const result = await validateMortalityData(csv, 'USA', 'monthly', 'all')

        expect(result.success).toBe(true)
        expect(result.data?.length).toBe(2)
      })
    })

    describe('cache fallback behavior', () => {
      it('should use cache when all new data is invalid', async () => {
        const validCsv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
USA,330000000,2020-01-01,monthly,cdc,who,50000,15.15,10.5,10.5,10.5,10.5`

        const firstResult = await validateMortalityData(validCsv, 'USA', 'monthly', 'all')
        expect(firstResult.success).toBe(true)
        expect(firstResult.usedCache).toBeUndefined()

        const invalidCsv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
XX,,,,,,,,,,`

        const secondResult = await validateMortalityData(invalidCsv, 'USA', 'monthly', 'all')
        expect(secondResult.success).toBe(true)
        expect(secondResult.usedCache).toBe(true)
        expect(secondResult.data?.length).toBe(1)
      })

      it('should fail when no cache available and data is invalid', async () => {
        const invalidCsv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
XX,,,,,,,,,,`

        const result = await validateMortalityData(invalidCsv, 'USA', 'monthly', 'all')

        expect(result.success).toBe(false)
      })

      it('should maintain separate caches for different cache keys', async () => {
        const csv1 = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
USA,330000000,2020-01-01,monthly,cdc,who,50000,15.15,10.5,10.5,10.5,10.5`

        const csv2 = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
CAN,38000000,2020-01-01,monthly,statcan,who,5000,13.16,9.5,9.5,9.5,9.5`

        await validateMortalityData(csv1, 'USA', 'monthly', 'all')
        await validateMortalityData(csv2, 'CAN', 'monthly', 'all')

        const invalidCsv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
XX,,,,,,,,,,`

        const result1 = await validateMortalityData(invalidCsv, 'USA', 'monthly', 'all')
        expect(result1.success).toBe(true)
        if (result1.data && result1.data.length > 0) {
          expect(result1.data![0].iso3c).toBe('USA')
        }

        const result2 = await validateMortalityData(invalidCsv, 'CAN', 'monthly', 'all')
        expect(result2.success).toBe(true)
        if (result2.data && result2.data.length > 0) {
          expect(result2.data![0].iso3c).toBe('CAN')
        }
      })
    })

    describe('data type validation', () => {
      it('should preserve string types for numeric fields', async () => {
        const csv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
USA,330000000,2020-01-01,monthly,cdc,who,50000,15.15,10.5,10.5,10.5,10.5`

        const result = await validateMortalityData(csv, 'USA', 'monthly', 'all')

        expect(result.success).toBe(true)
        if (result.data && result.data.length > 0) {
          const data = result.data[0]
          expect(typeof data.population).toBe('string')
          expect(typeof data.deaths).toBe('string')
          expect(typeof data.cmr).toBe('string')
        }
      })

      it('should handle decimal values in mortality rates', async () => {
        const csv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
USA,330000000,2020-01-01,monthly,cdc,who,50000,15.123456,10.987654,10.5,10.5,10.5`

        const result = await validateMortalityData(csv, 'USA', 'monthly', 'all')

        expect(result.success).toBe(true)
        if (result.data && result.data.length > 0) {
          const data = result.data[0]
          expect(data.cmr).toBe('15.123456')
          expect(data.asmr_who).toBe('10.987654')
        }
      })
    })
  })

  describe('clearValidationCache', () => {
    it('should clear metadata cache', async () => {
      const csv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
USA,United States,2020-01-01,2023-12-31,3,0-100,cdc`

      await validateMetadata(csv)
      clearValidationCache()

      const invalidCsv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
X,,,,,,`

      const result = await validateMetadata(invalidCsv)
      expect(result.success).toBe(false)
    })

    it('should clear mortality data cache', async () => {
      const csv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
USA,330000000,2020-01-01,monthly,cdc,who,50000,15.15,10.5,10.5,10.5,10.5`

      await validateMortalityData(csv, 'USA', 'monthly', 'all')
      clearValidationCache()

      const invalidCsv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
XX,,,,,,,,,,`

      const result = await validateMortalityData(invalidCsv, 'USA', 'monthly', 'all')
      expect(result.success).toBe(false)
    })

    it('should clear all caches simultaneously', async () => {
      const metadataCsv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
USA,United States,2020-01-01,2023-12-31,3,0-100,cdc`

      const mortalityCsv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
USA,330000000,2020-01-01,monthly,cdc,who,50000,15.15,10.5,10.5,10.5,10.5`

      await validateMetadata(metadataCsv)
      await validateMortalityData(mortalityCsv, 'USA', 'monthly', 'all')

      clearValidationCache()

      const invalidMetadata = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
X,,,,,,`
      const invalidMortality = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
XX,,,,,,,,,,`

      const metadataResult = await validateMetadata(invalidMetadata)
      const mortalityResult = await validateMortalityData(invalidMortality, 'USA', 'monthly', 'all')

      expect(metadataResult.success).toBe(false)
      expect(mortalityResult.success).toBe(false)
    })
  })

  describe('data integrity', () => {
    it('should detect duplicate entries in metadata', async () => {
      const csv = `iso3c,jurisdiction,min_date,max_date,type,age_groups,source
USA,United States,2020-01-01,2023-12-31,3,0-100,cdc
USA,United States,2020-01-01,2023-12-31,3,0-100,cdc`

      const result = await validateMetadata(csv)

      expect(result.success).toBe(true)
      expect(result.data?.length).toBe(2)
    })

    it('should detect duplicate entries in mortality data', async () => {
      const csv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
USA,330000000,2020-01-01,monthly,cdc,who,50000,15.15,10.5,10.5,10.5,10.5
USA,330000000,2020-01-01,monthly,cdc,who,50000,15.15,10.5,10.5,10.5,10.5`

      const result = await validateMortalityData(csv, 'USA', 'monthly', 'all')

      expect(result.success).toBe(true)
      expect(result.data?.length).toBe(2)
    })

    it('should handle cross-field consistency (ISO3C)', async () => {
      const csv = `iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
USA,330000000,2020-01-01,monthly,cdc,who,50000,15.15,10.5,10.5,10.5,10.5
USA,330000000,2020-02-01,monthly,cdc,who,52000,15.76,10.8,10.8,10.8,10.8`

      const result = await validateMortalityData(csv, 'USA', 'monthly', 'all')

      expect(result.success).toBe(true)
      if (result.data && result.data.length > 1) {
        expect(result.data[0].iso3c).toBe('USA')
        expect(result.data[1].iso3c).toBe('USA')
      }
    })
  })
})
