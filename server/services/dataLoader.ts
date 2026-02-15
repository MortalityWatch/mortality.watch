/**
 * Server-side Data Loader Service
 *
 * Unified service for loading mortality data and country metadata on the server.
 * Eliminates duplication across server routes and provides consistent error handling.
 *
 * Features:
 * - Country metadata loading with filtering
 * - Mortality data loading with parameters
 * - Data aggregation and transformation
 * - Consistent error handling and logging
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type {
  CountryRaw,
  CountryDataRaw,
  DatasetRaw,
  AllChartData,
  NumberEntryFields
} from '../../app/model'
import { Country, CountryData } from '../../app/model'
import { calculateBaselines } from '../utils/baselines'
import { CACHE_CONFIG } from '../../app/lib/config/constants'
// Import shared data processing functions - ensures identical behavior with client
import { getAllChartLabels as sharedGetAllChartLabels } from '../../app/lib/data/labels'
import { getAllChartData as sharedGetAllChartData } from '../../app/lib/data/aggregations'

// Default configuration constants
const DEFAULT_S3_BASE = 'https://s3.mortality.watch/data/mortality'
const DEFAULT_CACHE_DIR = CACHE_CONFIG.MORTALITY_DATA_DIR
const DEFAULT_FETCH_TIMEOUT_MS = 30000

/**
 * Parameters for loading mortality data
 */
export interface DataLoadParams {
  chartType: string
  countries: string[]
  ageGroups: string[]
  maxConcurrency?: number
}

/**
 * Parameters for chart data aggregation
 */
export interface ChartDataParams {
  dataKey: keyof CountryData
  chartType: string
  rawData: DatasetRaw
  allLabels: string[]
  startDateIndex: number
  cumulative: boolean
  ageGroupFilter?: string[]
  countryCodeFilter?: string[]
  baselineMethod?: string
  baselineDateFrom?: string
  baselineDateTo?: string
  keys?: (keyof NumberEntryFields)[]
}

/**
 * Concurrency limiter for controlled parallel execution
 */
function createConcurrencyLimiter(concurrency: number) {
  const queue: (() => void)[] = []
  let activeCount = 0

  return async <T>(fn: () => Promise<T>): Promise<T> => {
    while (activeCount >= concurrency) {
      await new Promise<void>(resolve => queue.push(resolve))
    }

    activeCount++
    try {
      return await fn()
    } finally {
      activeCount--
      const next = queue.shift()
      if (next) next()
    }
  }
}

/**
 * Unified Data Loader Service for server-side operations
 */
export class DataLoaderService {
  /**
   * Check if running in development mode
   * Uses getter to ensure config is read at runtime, not module load time
   */
  private get isDev(): boolean {
    return process.env.NODE_ENV === 'development'
  }

  /**
   * Check if local-only cache mode is enabled
   * Uses getter with useRuntimeConfig() to ensure .env is loaded
   * Note: Nuxt may convert env vars to booleans, so we check both types
   */
  private get useLocalCacheOnly(): boolean {
    try {
      const config = useRuntimeConfig()
      const value = config.public.useLocalCache as unknown
      return value === true || value === 'true'
    } catch {
      // Fallback to env var if useRuntimeConfig not available (e.g., during build)
      return process.env.NUXT_PUBLIC_USE_LOCAL_CACHE === 'true'
    }
  }

  /**
   * Get S3 base URL from runtime config
   * Uses getter to ensure config is read at runtime, not module load time
   */
  private get s3Base(): string {
    try {
      const config = useRuntimeConfig()
      return (config.mortalityDataS3Base as string) || DEFAULT_S3_BASE
    } catch {
      return process.env.MORTALITY_DATA_S3_BASE || DEFAULT_S3_BASE
    }
  }

  /**
   * Get cache directory from runtime config
   * Uses getter to ensure config is read at runtime, not module load time
   */
  private get cacheDir(): string {
    try {
      const config = useRuntimeConfig()
      return (config.mortalityDataCacheDir as string) || DEFAULT_CACHE_DIR
    } catch {
      return process.env.MORTALITY_DATA_CACHE_DIR || DEFAULT_CACHE_DIR
    }
  }

  /**
   * Get fetch timeout from runtime config
   * Uses getter to ensure config is read at runtime, not module load time
   */
  private get fetchTimeoutMs(): number {
    try {
      const config = useRuntimeConfig()
      const value = config.mortalityDataFetchTimeout
      return typeof value === 'number' ? value : DEFAULT_FETCH_TIMEOUT_MS
    } catch {
      return parseInt(process.env.MORTALITY_DATA_FETCH_TIMEOUT || String(DEFAULT_FETCH_TIMEOUT_MS), 10)
    }
  }

  /**
   * Load country metadata from S3 or local cache
   *
   * @param options - Optional filtering for specific countries
   * @returns Record of countries indexed by ISO3C code
   */
  async loadCountryMetadata(options?: {
    filterCountries?: string[]
  }): Promise<Record<string, Country>> {
    try {
      // Load raw CSV data
      const csvText = await this.fetchMetadataCsv()

      // Parse CSV into objects (simple CSV parser)
      const rawObjects = this.parseCSV(csvText)
      const data: Record<string, Country> = {}

      // Filter countries if specified
      const filterCountries = options?.filterCountries || []

      for (const rawObj of rawObjects) {
        const typedObj = rawObj as unknown as Record<string, unknown>
        if (!typedObj.iso3c) continue

        // Convert to Country class instance
        const CountryConstructor = Country as unknown as new (raw: CountryRaw) => Country
        const parsedObj = new CountryConstructor(rawObj as unknown as CountryRaw)
        const iso = parsedObj.iso3c

        // Apply filter if provided
        if (filterCountries.length > 0 && !filterCountries.includes(iso)) {
          continue
        }

        if (!data[iso]) {
          data[iso] = parsedObj
        } else {
          // Merge data sources for countries with multiple entries
          data[iso].data_source = [
            ...data[iso].data_source,
            ...parsedObj.data_source
          ]
        }
      }

      return data
    } catch (error) {
      console.error('Error loading country metadata:', error)
      throw new Error(`Failed to load country metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Load country metadata by ISO code
   *
   * @param iso3c - ISO3C country code
   * @returns Country object or undefined
   */
  async loadCountryByIso(iso3c: string): Promise<Country | undefined> {
    const allCountries = await this.loadCountryMetadata()
    return allCountries[iso3c]
  }

  /**
   * Load mortality data for specified parameters
   *
   * @param params - Data loading parameters
   * @returns Raw dataset organized by age group and country
   */
  async loadMortalityData(params: DataLoadParams): Promise<DatasetRaw> {
    const { chartType, countries, ageGroups, maxConcurrency = 10 } = params

    try {
      const limit = createConcurrencyLimiter(maxConcurrency)
      const operations: Promise<CountryData[]>[] = []

      // Fetch data for all country/age group combinations with concurrency control
      countries.forEach((country) => {
        ageGroups.forEach((ag) => {
          operations.push(
            limit(() => this.fetchCountryData(chartType, country, ag))
          )
        })
      })

      const results = await Promise.all(operations)
      const rows = results.flat()
      const data: DatasetRaw = {}

      // Organize data by age group and country
      rows.forEach((row) => {
        const { age_group, iso3c } = row
        data[age_group] = data[age_group] || {}
        data[age_group][iso3c] = data[age_group][iso3c] || []
        data[age_group][iso3c].push(row)
      })

      return data
    } catch (error) {
      console.error('Error loading mortality data:', error)
      // Rethrow to surface errors instead of silently returning empty
      throw error
    }
  }

  /**
   * Load mortality data for a specific country
   *
   * @param chartType - Chart type (weekly, monthly, yearly)
   * @param country - Country ISO3C code
   * @param ageGroups - Age groups to load
   * @returns Raw dataset for the country
   */
  async loadMortalityDataForCountry(
    chartType: string,
    country: string,
    ageGroups: string[]
  ): Promise<DatasetRaw> {
    return this.loadMortalityData({
      chartType,
      countries: [country],
      ageGroups
    })
  }

  /**
   * Get all unique chart labels from raw data
   *
   * Uses the shared getAllChartLabels function from app/lib/data/labels.ts
   * to ensure identical behavior with client-side code.
   *
   * @param rawData - Raw dataset
   * @param isAsmrType - Whether using ASMR data type
   * @param ageGroupFilter - Optional age group filter
   * @param countryCodeFilter - Optional country filter
   * @param chartType - Chart type for sorting
   * @returns Sorted array of unique labels
   */
  getAllChartLabels(
    rawData: DatasetRaw,
    isAsmrType: boolean,
    ageGroupFilter?: string[],
    countryCodeFilter?: string[],
    chartType?: string
  ): string[] {
    // Use shared function to ensure identical behavior with client
    return sharedGetAllChartLabels(rawData, isAsmrType, ageGroupFilter, countryCodeFilter, chartType)
  }

  /**
   * Get all chart data with optional baseline calculations
   *
   * Uses the shared getAllChartData function from app/lib/data/aggregations.ts
   * to ensure identical behavior with client-side code. The server-side
   * baseline calculator is injected to handle server-specific concerns
   * (circuit breaker, server-side queuing, etc.).
   *
   * @param params - Chart data parameters
   * @returns All chart data with labels and metadata
   */
  async getAllChartData(params: ChartDataParams): Promise<AllChartData> {
    const {
      dataKey,
      chartType,
      rawData,
      allLabels,
      startDateIndex,
      cumulative,
      ageGroupFilter,
      countryCodeFilter,
      baselineMethod,
      baselineDateFrom,
      baselineDateTo,
      keys
    } = params

    // Use shared function with server-side baseline calculator injected
    return sharedGetAllChartData(
      dataKey,
      chartType,
      rawData,
      allLabels,
      startDateIndex,
      cumulative,
      ageGroupFilter,
      countryCodeFilter,
      baselineMethod,
      baselineDateFrom,
      baselineDateTo,
      keys,
      undefined, // progressCb - not used on server
      undefined, // statsUrl - uses default
      calculateBaselines // Server-side baseline calculator
    )
  }

  // Private helper methods

  /**
   * Fetch metadata CSV from S3 or local cache
   */
  private async fetchMetadataCsv(): Promise<string> {
    // Check local files only when USE_LOCAL_CACHE=true (offline dev mode)
    if (this.useLocalCacheOnly) {
      const localPath = join(this.cacheDir, 'world_meta.csv')
      if (existsSync(localPath)) {
        try {
          return readFileSync(localPath, 'utf-8')
        } catch (error) {
          console.error(`Error reading local file ${localPath}:`, error)
        }
      }

      throw new Error(
        `Local metadata file not found at: ${localPath}\n`
        + 'Please run "npm run download-data" to cache data locally.\n'
        + 'Alternatively, set NUXT_PUBLIC_USE_LOCAL_CACHE=false to fetch from S3.'
      )
    }

    // Fetch from S3
    const url = `${this.s3Base}/world_meta.csv`
    const response = await fetch(url, {
      signal: AbortSignal.timeout(this.fetchTimeoutMs)
    })

    if (!response.ok) {
      throw new Error(
        `Failed to fetch metadata from S3: ${response.status} ${response.statusText}\n`
        + `URL: ${url}\n`
        + 'This may indicate a network issue or that the data file is not available.'
      )
    }

    const data = await response.text()

    return data
  }

  /**
   * Fetch country data CSV
   */
  private async fetchCountryData(
    chartType: string,
    country: string,
    ageGroup: string
  ): Promise<CountryData[]> {
    try {
      const ageSuffix = ageGroup === 'all' ? '' : `_${ageGroup}`
      const path = `${country}/${chartType}${ageSuffix}.csv`

      // Check local files only when USE_LOCAL_CACHE=true (offline dev mode)
      if (this.useLocalCacheOnly) {
        const localPath = join(this.cacheDir, path)
        if (existsSync(localPath)) {
          try {
            const csvText = readFileSync(localPath, 'utf-8')
            return this.parseCountryData(csvText, ageGroup, chartType)
          } catch (error) {
            console.error(`Error reading local file ${localPath}:`, error)
          }
        }

        throw new Error(
          `Local mortality data file not found at: ${localPath}\n`
          + `Missing: ${country}/${chartType}/${ageGroup}\n`
          + 'Please run "npm run download-data" to cache data locally.\n'
          + 'Alternatively, set NUXT_PUBLIC_USE_LOCAL_CACHE=false to fetch from S3.'
        )
      }

      // Fetch from S3
      const url = `${this.s3Base}/${path}`
      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.fetchTimeoutMs)
      })

      if (!response.ok) {
        throw new Error(
          `Failed to fetch mortality data from S3: ${response.status} ${response.statusText}\n`
          + `URL: ${url}\n`
          + `Country: ${country}, Chart Type: ${chartType}, Age Group: ${ageGroup}\n`
          + 'This may indicate a network issue or that the data file is not available.'
        )
      }

      const csvText = await response.text()

      return this.parseCountryData(csvText, ageGroup, chartType)
    } catch (error) {
      console.error(`Error fetching ${country}/${chartType}/${ageGroup}:`, error)
      // Rethrow instead of returning empty
      throw error
    }
  }

  /**
   * Parse CSV text into array of objects
   */
  private parseCSV(csvText: string): Record<string, unknown>[] {
    const lines = csvText.trim().split('\n')
    if (lines.length === 0) return []

    // Strip quotes from headers
    const headers = lines[0]!.split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const results: Record<string, unknown>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]!.split(',')
      const obj: Record<string, unknown> = {}

      headers.forEach((header, index) => {
        let value = values[index]?.trim()
        // Strip quotes from string values
        if (value?.startsWith('"') && value?.endsWith('"')) {
          value = value.slice(1, -1)
        }
        // Fields that should remain as strings even if they look numeric
        // 'type' contains comma-separated resolution codes like "1, 2, 3"
        // 'source' and 'source_asmr' are source names
        const stringFields = ['type', 'source', 'source_asmr', 'iso3c', 'date']
        if (stringFields.includes(header)) {
          obj[header] = value
        } else {
          // Try to parse as number, otherwise keep as string
          obj[header] = value && !isNaN(Number(value)) ? Number(value) : value
        }
      })

      results.push(obj)
    }

    return results
  }

  /**
   * Parse country data CSV into CountryData objects
   */
  private parseCountryData(
    csvText: string,
    ageGroup: string,
    chartType: string
  ): CountryData[] {
    const rawObjects = this.parseCSV(csvText)
    const data: CountryData[] = []

    const CountryDataConstructor = CountryData as unknown as new (
      raw: CountryDataRaw,
      ageGroup: string,
      chartType: string
    ) => CountryData

    for (const rawObj of rawObjects) {
      try {
        const parsedObj = new CountryDataConstructor(rawObj as unknown as CountryDataRaw, ageGroup, chartType)
        if (!parsedObj.iso3c) continue
        data.push(parsedObj)
      } catch (e) {
        console.error(`[parseCountryData] Error creating CountryData:`, e, rawObj)
      }
    }

    return data
  }

  // Note: Data transformation methods (getDataForCountry, hideCdcSuppressed, etc.)
  // have been removed and replaced with shared functions from app/lib/data/
  // to ensure identical behavior between client and server.
}

/**
 * Singleton instance of DataLoaderService
 *
 * This singleton is used throughout the server for consistent data loading behavior.
 * For testing, mock the methods on this instance rather than the instance itself:
 *
 * @example
 * ```typescript
 * // In tests
 * vi.spyOn(dataLoader, 'loadCountryMetadata').mockResolvedValue(mockData)
 * ```
 */
export const dataLoader = new DataLoaderService()
