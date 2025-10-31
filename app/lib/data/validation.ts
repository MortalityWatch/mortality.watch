/**
 * Data Validation Utilities
 *
 * Provides runtime data validation with fallback to cached/previous versions
 * Handles validation failures gracefully and alerts admins when necessary
 */

import { z } from 'zod'
import Papa from 'papaparse'
import type { CountryRaw, CountryDataRaw } from '@/model/country'

// Zod schema for country metadata validation
const CountryRawSchema = z.object({
  iso3c: z.string().min(3).max(3),
  jurisdiction: z.string().min(1),
  min_date: z.string(),
  max_date: z.string(),
  type: z.string(),
  age_groups: z.string(),
  source: z.string()
})

// Zod schema for country data validation
const CountryDataRawSchema = z.object({
  iso3c: z.string().min(3).max(3),
  population: z.string(),
  date: z.string(),
  type: z.string(),
  source: z.string(),
  source_asmr: z.string(),
  deaths: z.string(),
  cmr: z.string(),
  asmr_who: z.string(),
  asmr_esp: z.string(),
  asmr_usa: z.string(),
  asmr_country: z.string()
})

interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: z.ZodError
  usedCache?: boolean
}

interface ValidationCache {
  metadata?: string
  mortalityData: Map<string, string>
}

// In-memory cache for fallback data
const validationCache: ValidationCache = {
  mortalityData: new Map()
}

/**
 * Validate and parse metadata CSV with fallback
 */
export async function validateMetadata(
  csvText: string
): Promise<ValidationResult<CountryRaw[]>> {
  try {
    // Parse CSV
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    })

    // Log CSV parsing errors but don't fail immediately
    // Some rows may be corrupt but others valid
    if (parsed.errors.length > 0) {
      console.warn(`CSV parsing warnings: ${parsed.errors.length} errors found`)
      console.warn('Sample errors:', parsed.errors.slice(0, 3))
    }

    // Validate each row with Zod
    const validatedData: CountryRaw[] = []
    const errors: Array<{ row: number, errors: z.ZodIssue[] }> = []

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i]
      const result = CountryRawSchema.safeParse(row)

      if (result.success) {
        validatedData.push(result.data as CountryRaw)
      } else {
        errors.push({
          row: i + 1,
          errors: result.error.issues
        })
      }
    }

    // If we have some valid data, consider it successful
    if (validatedData.length > 0) {
      // Update cache with valid data
      validationCache.metadata = csvText

      // Log warnings for invalid rows but don't fail
      if (errors.length > 0) {
        console.warn(`Metadata validation warnings: ${errors.length} invalid rows`)
        console.warn('First few errors:', errors.slice(0, 3))
      }

      return {
        success: true,
        data: validatedData
      }
    }

    // All rows failed - try to use cached version
    if (validationCache.metadata) {
      console.error('All metadata rows failed validation, using cached version')
      const cachedParsed = Papa.parse(validationCache.metadata, {
        header: true,
        skipEmptyLines: true
      })

      // Send alert to admin
      await sendValidationAlert('metadata', errors)

      return {
        success: true,
        data: cachedParsed.data as CountryRaw[],
        usedCache: true
      }
    }

    // No cache available - fail
    throw new Error('Metadata validation failed and no cache available')
  } catch (error) {
    console.error('Metadata validation error:', error)

    // Try to use cached version
    if (validationCache.metadata) {
      const cachedParsed = Papa.parse(validationCache.metadata, {
        header: true,
        skipEmptyLines: true
      })

      // Send alert to admin
      await sendValidationAlert('metadata', error)

      return {
        success: true,
        data: cachedParsed.data as CountryRaw[],
        usedCache: true
      }
    }

    return {
      success: false,
      errors: error as z.ZodError
    }
  }
}

/**
 * Validate and parse mortality data CSV with fallback
 */
export async function validateMortalityData(
  csvText: string,
  country: string,
  chartType: string,
  ageGroup: string
): Promise<ValidationResult<CountryDataRaw[]>> {
  const cacheKey = `${country}/${chartType}/${ageGroup}`

  try {
    // Parse CSV
    const parsed = Papa.parse(csvText, {
      header: true,
      delimiter: ',',
      newline: '\n'
    })

    // Log CSV parsing errors but don't fail immediately
    // Some rows may be corrupt but others valid
    if (parsed.errors.length > 0) {
      console.warn(`Mortality data CSV parsing warnings for ${cacheKey}: ${parsed.errors.length} errors found`)
      console.warn('Sample errors:', parsed.errors.slice(0, 3))
    }

    // Validate each row with Zod (but be lenient)
    const validatedData: CountryDataRaw[] = []
    const errors: Array<{ row: number, errors: z.ZodIssue[] }> = []

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i]
      const result = CountryDataRawSchema.safeParse(row)

      if (result.success) {
        validatedData.push(result.data as CountryDataRaw)
      } else {
        errors.push({
          row: i + 1,
          errors: result.error.issues
        })
      }
    }

    // If we have some valid data, consider it successful
    if (validatedData.length > 0) {
      // Update cache with valid data
      validationCache.mortalityData.set(cacheKey, csvText)

      // Log warnings for invalid rows but don't fail
      if (errors.length > 0) {
        console.warn(`Mortality data validation warnings for ${cacheKey}: ${errors.length} invalid rows`)
      }

      return {
        success: true,
        data: validatedData
      }
    }

    // All rows failed - try to use cached version
    const cached = validationCache.mortalityData.get(cacheKey)
    if (cached) {
      console.error(`All rows failed validation for ${cacheKey}, using cached version`)
      const cachedParsed = Papa.parse(cached, {
        header: true,
        delimiter: ',',
        newline: '\n'
      })

      // Send alert to admin
      await sendValidationAlert(cacheKey, errors)

      return {
        success: true,
        data: cachedParsed.data as CountryDataRaw[],
        usedCache: true
      }
    }

    // No cache available - fail
    throw new Error(`Mortality data validation failed for ${cacheKey} and no cache available`)
  } catch (error) {
    console.error(`Mortality data validation error for ${cacheKey}:`, error)

    // Try to use cached version
    const cached = validationCache.mortalityData.get(cacheKey)
    if (cached) {
      const cachedParsed = Papa.parse(cached, {
        header: true,
        delimiter: ',',
        newline: '\n'
      })

      // Send alert to admin
      await sendValidationAlert(cacheKey, error)

      return {
        success: true,
        data: cachedParsed.data as CountryDataRaw[],
        usedCache: true
      }
    }

    return {
      success: false,
      errors: error as z.ZodError
    }
  }
}

/**
 * Send validation failure alert to admin
 * Only sends if running on server-side and in production
 */
async function sendValidationAlert(dataType: string, error: unknown) {
  // Only send alerts on server-side
  if (!import.meta.server) return

  // Skip in development
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[DEV] Would send validation alert for ${dataType}`)
    return
  }

  try {
    // Call internal API to send email alert
    await $fetch('/api/admin/data-quality-alert', {
      method: 'POST',
      body: {
        dataType,
        error: error instanceof Error ? error.message : JSON.stringify(error),
        timestamp: new Date().toISOString()
      }
    })
  } catch (alertError) {
    console.error('Failed to send validation alert:', alertError)
  }
}

/**
 * Clear validation cache (useful for testing)
 */
export function clearValidationCache() {
  delete validationCache.metadata
  validationCache.mortalityData.clear()
}
