/**
 * Data Validation Utilities
 *
 * Provides runtime data validation with fallback to cached/previous versions
 * Handles validation failures gracefully and alerts admins when necessary
 */

import { z } from 'zod'
import Papa from 'papaparse'
import type { CountryRaw, CountryDataRaw } from '@/model/country'
import { logger } from '@/lib/logger'

const log = logger.withPrefix('Validation')

/**
 * Zod schema for country metadata validation
 *
 * Validates the structure of country metadata records from CSV files.
 * Each field is required and must match the expected format.
 *
 * @property {string} iso3c - Country/jurisdiction code (e.g., "USA", "GBR", "USA-FL", "DEU-SN")
 * @property {string} jurisdiction - Country/region name (e.g., "United States", "USA - Florida")
 * @property {string} min_date - Earliest available data date
 * @property {string} max_date - Latest available data date
 * @property {string} type - Data type indicator
 * @property {string} age_groups - Available age group categories
 * @property {string} source - Data source identifier
 */
const CountryRawSchema = z.object({
  // Allow 3-letter codes (USA, DEU) or hyphenated sub-country codes (USA-FL, DEU-SN, CAN-ON)
  iso3c: z.string().min(3).max(6),
  jurisdiction: z.string().min(1),
  min_date: z.string(),
  max_date: z.string(),
  type: z.string(),
  age_groups: z.string(),
  source: z.string()
})

/**
 * Zod schema for country mortality data validation
 *
 * Validates the structure of mortality data records from CSV files.
 * All numeric fields are stored as strings in the CSV and will be
 * parsed to numbers during processing.
 *
 * Note: Age-group-specific CSV files (e.g., fluseason_85+.csv) do NOT contain
 * ASMR fields - only the aggregate files have them. Therefore ASMR fields
 * are optional in this schema.
 *
 * @property {string} iso3c - Country/jurisdiction code (e.g., "USA", "USA-FL", "DEU-SN")
 * @property {string} population - Population count (as string)
 * @property {string} date - Date/period of the data record
 * @property {string} type - Data type indicator
 * @property {string} source - Primary data source identifier
 * @property {string} [source_asmr] - ASMR data source identifier (optional, not in age-group files)
 * @property {string} deaths - Total deaths count (as string)
 * @property {string} cmr - Crude mortality rate (as string)
 * @property {string} [asmr_who] - Age-standardized mortality rate (WHO standard, optional)
 * @property {string} [asmr_esp] - Age-standardized mortality rate (European standard, optional)
 * @property {string} [asmr_usa] - Age-standardized mortality rate (US standard, optional)
 * @property {string} [asmr_country] - Age-standardized mortality rate (country-specific, optional)
 */
const CountryDataRawSchema = z.object({
  // Allow 3-letter codes (USA, DEU) or hyphenated sub-country codes (USA-FL, DEU-SN, CAN-ON)
  iso3c: z.string().min(3).max(6),
  population: z.string(),
  date: z.string(),
  type: z.string(),
  source: z.string(),
  source_asmr: z.string().optional(),
  deaths: z.string(),
  cmr: z.string(),
  le: z.string().optional(), // Life expectancy (direct value from age-stratified files)
  asmr_who: z.string().optional(),
  asmr_esp: z.string().optional(),
  asmr_usa: z.string().optional(),
  asmr_country: z.string().optional()
})

/**
 * Result of a validation operation
 *
 * @template T - The type of data being validated
 * @property {boolean} success - Whether validation succeeded
 * @property {T} [data] - Validated data (present if success is true)
 * @property {z.ZodError} [errors] - Validation errors (present if success is false)
 * @property {boolean} [usedCache] - Whether cached data was used as fallback
 */
interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: z.ZodError
  usedCache?: boolean
}

/**
 * In-memory cache for validation fallback
 *
 * Stores the last successfully validated CSV data to use as a fallback
 * when new data fails validation. This ensures the application remains
 * functional even when data quality issues occur.
 *
 * @property {string} [metadata] - Cached metadata CSV text
 * @property {Map<string, string>} mortalityData - Cached mortality data CSVs by key
 */
interface ValidationCache {
  metadata?: string
  mortalityData: Map<string, string>
}

/**
 * In-memory cache for fallback data
 *
 * Stores successfully validated data to use as a fallback when
 * subsequent validations fail. This provides resilience against
 * temporary data quality issues.
 */
const validationCache: ValidationCache = {
  mortalityData: new Map()
}

/**
 * Validate and parse country metadata CSV with graceful fallback
 *
 * This function validates country metadata from CSV format using Zod schemas.
 * It employs a lenient validation strategy:
 * 1. Parse CSV and validate each row individually
 * 2. Accept partial success (some valid rows)
 * 3. Fall back to cached data if all rows fail
 * 4. Only fail if no valid data and no cache available
 *
 * **Validation Logic:**
 * - Uses PapaParse for CSV parsing with header row detection
 * - Validates each row against CountryRawSchema
 * - Collects valid rows and logs warnings for invalid ones
 * - Success if at least one row is valid
 *
 * **Caching Strategy:**
 * - Updates cache on successful validation
 * - Falls back to cache if all rows fail
 * - Cache is in-memory and persists for application lifetime
 *
 * **Valid Input Example:**
 * ```csv
 * iso3c,jurisdiction,min_date,max_date,type,age_groups,source
 * USA,United States,2010-01-01,2024-12-31,weekly,all,cdc
 * ```
 *
 * **Invalid Input Example:**
 * ```csv
 * iso3c,jurisdiction,min_date,max_date,type,age_groups,source
 * US,United States,2010-01-01,2024-12-31,weekly,all,cdc  # iso3c too short
 * ```
 *
 * **Error Handling:**
 * - CSV parsing errors are logged but don't fail immediately
 * - Row validation errors are collected and logged
 * - Returns cached data on total failure
 * - Throws error only if no data available and no cache
 *
 * @param {string} csvText - Raw CSV text containing country metadata
 * @returns {Promise<ValidationResult<CountryRaw[]>>} Validation result with data or errors
 *
 * @example
 * ```typescript
 * const csvText = await fetchMetadataCSV()
 * const result = await validateMetadata(csvText)
 *
 * if (result.success) {
 *   console.log(`Validated ${result.data.length} countries`)
 *   if (result.usedCache) {
 *     console.warn('Using cached data due to validation issues')
 *   }
 * } else {
 *   console.error('Validation failed:', result.errors)
 * }
 * ```
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
      log.warn(`CSV parsing warnings: ${parsed.errors.length} errors found`, { sampleErrors: parsed.errors.slice(0, 3) })
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
        log.warn(`Metadata validation warnings: ${errors.length} invalid rows`, { sampleErrors: errors.slice(0, 3) })
      }

      return {
        success: true,
        data: validatedData
      }
    }

    // All rows failed - try to use cached version
    if (validationCache.metadata) {
      log.error('All metadata rows failed validation, using cached version')
      const cachedParsed = Papa.parse(validationCache.metadata, {
        header: true,
        skipEmptyLines: true
      })

      return {
        success: true,
        data: cachedParsed.data as CountryRaw[],
        usedCache: true
      }
    }

    // No cache available - fail
    throw new Error('Metadata validation failed and no cache available')
  } catch (error) {
    log.error('Metadata validation error', error)

    // Try to use cached version
    if (validationCache.metadata) {
      const cachedParsed = Papa.parse(validationCache.metadata, {
        header: true,
        skipEmptyLines: true
      })

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
 * Validate and parse mortality data CSV with graceful fallback
 *
 * This function validates mortality data from CSV format using Zod schemas.
 * It uses a lenient validation strategy similar to validateMetadata but with
 * per-country caching for better granularity.
 *
 * **Validation Logic:**
 * - Parses CSV with explicit delimiter and newline settings
 * - Validates each row against CountryDataRawSchema
 * - Accepts partial success (at least one valid row)
 * - Falls back to cached data for this specific country/chart/age combination
 *
 * **Caching Strategy:**
 * - Cache key format: `{country}/{chartType}/{ageGroup}`
 * - Example: "USA/weekly/all" or "GBR/yearly/0-14"
 * - Each combination cached independently
 * - Cache persists in-memory for application lifetime
 *
 * **Valid Input Example:**
 * ```csv
 * iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
 * USA,331449281,2020-01-01,weekly,cdc,who,50000,15.09,14.5,14.3,14.8,14.6
 * ```
 *
 * **Invalid Input Example:**
 * ```csv
 * iso3c,population,date,type,source,source_asmr,deaths,cmr,asmr_who,asmr_esp,asmr_usa,asmr_country
 * US,331449281,2020-01-01,weekly,cdc,who,50000,15.09,14.5,14.3,14.8,14.6  # iso3c too short
 * ```
 *
 * **Error Handling:**
 * - CSV parsing errors logged with sample errors
 * - Row validation errors collected and logged with context
 * - Returns cached data on total failure
 * - Throws error only if no valid data and no cache available
 *
 * **Security Considerations:**
 * - All numeric values kept as strings during validation
 * - No eval() or dynamic code execution
 * - Schema enforces expected field names and types
 *
 * @param {string} csvText - Raw CSV text containing mortality data
 * @param {string} country - Country ISO3C code (e.g., "USA")
 * @param {string} chartType - Chart type (e.g., "weekly", "yearly")
 * @param {string} ageGroup - Age group identifier (e.g., "all", "0-14")
 * @returns {Promise<ValidationResult<CountryDataRaw[]>>} Validation result with data or errors
 *
 * @example
 * ```typescript
 * const csvText = await fetchMortalityData('USA', 'weekly', 'all')
 * const result = await validateMortalityData(csvText, 'USA', 'weekly', 'all')
 *
 * if (result.success) {
 *   console.log(`Validated ${result.data.length} data points`)
 *   if (result.usedCache) {
 *     console.warn('Using cached data for USA/weekly/all')
 *   }
 * } else {
 *   console.error('Validation failed:', result.errors)
 * }
 * ```
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
      newline: '\n',
      skipEmptyLines: true
    })

    // Log CSV parsing errors but don't fail immediately
    // Some rows may be corrupt but others valid
    if (parsed.errors.length > 0) {
      log.warn(`Mortality data CSV parsing warnings for ${cacheKey}: ${parsed.errors.length} errors found`, { sampleErrors: parsed.errors.slice(0, 3) })
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
        log.warn(`Mortality data validation warnings for ${cacheKey}: ${errors.length} invalid rows`)
      }

      return {
        success: true,
        data: validatedData
      }
    }

    // All rows failed - try to use cached version
    const cached = validationCache.mortalityData.get(cacheKey)
    if (cached) {
      log.error(`All rows failed validation for ${cacheKey}, using cached version`)
      const cachedParsed = Papa.parse(cached, {
        header: true,
        delimiter: ',',
        newline: '\n'
      })

      return {
        success: true,
        data: cachedParsed.data as CountryDataRaw[],
        usedCache: true
      }
    }

    // No cache available - fail
    throw new Error(`Mortality data validation failed for ${cacheKey} and no cache available`)
  } catch (error) {
    log.error(`Mortality data validation error for ${cacheKey}`, error)

    // Try to use cached version
    const cached = validationCache.mortalityData.get(cacheKey)
    if (cached) {
      const cachedParsed = Papa.parse(cached, {
        header: true,
        delimiter: ',',
        newline: '\n'
      })

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
 * Clear all validation cache
 *
 * Removes all cached validation data from memory. This is primarily
 * useful for testing scenarios where you need to reset state between
 * test cases, or for forcing fresh validation in development.
 *
 * **Use Cases:**
 * - Unit testing: Reset cache between tests
 * - Development: Force re-validation of data
 * - Memory management: Clear cache if needed (rare)
 *
 * **Important Notes:**
 * - This clears both metadata and mortality data caches
 * - Next validation will have no fallback until new data is cached
 * - Should NOT be called in normal production flow
 * - Cache will be repopulated on next successful validation
 *
 * @example
 * ```typescript
 * // In a test suite
 * afterEach(() => {
 *   clearValidationCache()
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Force fresh validation
 * clearValidationCache()
 * const result = await validateMetadata(newCsvData)
 * // This will fail immediately if newCsvData is invalid (no cache fallback)
 * ```
 */
export function clearValidationCache() {
  delete validationCache.metadata
  validationCache.mortalityData.clear()
}
