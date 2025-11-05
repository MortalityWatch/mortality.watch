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
 * - Built-in caching via filesystemCache
 * - Consistent error handling and logging
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type {
  CountryRaw,
  CountryDataRaw,
  DatasetRaw,
  AllChartData,
  Dataset,
  NumberEntryFields,
  NumberArray,
  StringArray
} from '../../app/model'
import { Country, CountryData, stringKeys, numberKeys } from '../../app/model'
import { getObjectOfArrays, prefillUndefined, fromYearMonthString, left, right } from '../../app/utils'
import { filesystemCache } from '../utils/cache'

const S3_BASE = 'https://s3.mortality.watch/data/mortality'
const CACHE_DIR = '.data/cache/mortality'

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
  private readonly isDev: boolean
  private readonly useLocalCacheOnly: boolean

  constructor() {
    this.isDev = process.env.NODE_ENV === 'development'
    this.useLocalCacheOnly = process.env.NUXT_PUBLIC_USE_LOCAL_CACHE === 'true'
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
      return {}
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
    const allLabels = new Set<string>()
    const ageGroups = ageGroupFilter ?? Object.keys(rawData || {})
    const countryCodes = countryCodeFilter ?? Object.keys(rawData.all ?? {})
    const type = isAsmrType ? 'asmr_who' : 'cmr'

    for (const ag of ageGroups) {
      for (const iso3c of countryCodes) {
        if (!rawData[ag] || !rawData[ag][iso3c]) continue
        rawData[ag][iso3c].forEach((el: CountryData) => {
          if (el[type as keyof CountryData] !== undefined) {
            allLabels.add(el.date)
          }
        })
      }
    }

    const result = Array.from(allLabels)
    return this.sortLabels(result, chartType)
  }

  /**
   * Get all chart data with optional baseline calculations
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
      ageGroupFilter,
      countryCodeFilter,
      baselineMethod
    } = params

    const data: Dataset = {}
    const ageGroups = ageGroupFilter ?? Object.keys(rawData || {})
    const countryCodes = countryCodeFilter ?? Object.keys(rawData?.all || {})
    const noData: Record<string, Set<string>> = {}
    const noAsmr: Set<string> = new Set<string>()

    // Get Country data and labels
    for (const ag of ageGroups) {
      for (const iso3c of countryCodes) {
        if (!rawData[ag] || !rawData[ag][iso3c]) {
          if (!noData[iso3c]) noData[iso3c] = new Set<string>()
          noData[iso3c].add(ag)
          continue
        }

        const cd = this.getDataForCountry(
          rawData[ag][iso3c],
          iso3c,
          allLabels[startDateIndex] || ''
        )

        if (!data[ag]) data[ag] = {}

        const dataKeyStr = dataKey as string
        const dataValues = cd ? (cd[dataKeyStr as keyof CountryData] as number[] | undefined) : undefined

        if (
          !cd
          || (!baselineMethod && dataValues && dataValues.filter((x: number) => x).length === 0)
        ) {
          if (dataKeyStr.startsWith('asmr')) {
            noAsmr.add(iso3c)
          } else {
            if (!noData[iso3c]) noData[iso3c] = new Set<string>()
            noData[iso3c].add(ag)
          }
          continue
        }

        // Type assertion needed: cd is Record<string, unknown> from getDataForCountry()
        // but Dataset expects DatasetEntry (StringEntryFields & NumberEntryFields).
        // The data structure matches at runtime after parsing from CSV.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data[ag][iso3c] = cd as any
      }
    }

    const labels = this.getLabels(
      chartType,
      startDateIndex > 0 ? allLabels.slice(startDateIndex) : allLabels
    )

    // Align time series for all countries
    for (const ag of ageGroups) {
      if (!data[ag]) continue
      for (const iso3c of countryCodes) {
        if (!data[ag][iso3c]) continue

        let n = 0
        for (const label of labels) {
          if (data[ag][iso3c].date.includes(label)) break
          else n++
        }

        if (n > 0) {
          for (const key of stringKeys) {
            data[ag][iso3c][key] = prefillUndefined(
              data[ag][iso3c][key],
              n
            ) as StringArray
          }

          for (const key of numberKeys) {
            data[ag][iso3c][key] = prefillUndefined(
              data[ag][iso3c][key],
              n
            ) as NumberArray
          }
        }
      }
    }

    // Note: Baseline calculations would go here if needed
    // Skipping for now as it requires external API calls

    return { data, labels, notes: { noData, noAsmr } }
  }

  // Private helper methods

  /**
   * Fetch metadata CSV from S3 or local cache
   */
  private async fetchMetadataCsv(): Promise<string> {
    // Dev: Check local cache first
    if (this.isDev || this.useLocalCacheOnly) {
      const localPath = join(CACHE_DIR, 'world_meta.csv')
      if (existsSync(localPath)) {
        try {
          return readFileSync(localPath, 'utf-8')
        } catch (error) {
          console.error(`Error reading local file ${localPath}:`, error)
        }
      }

      if (this.useLocalCacheOnly) {
        throw new Error('Local metadata file not found. Run "npm run download-data" to cache data locally.')
      }

      console.warn(`Local metadata file not found, fetching from S3`)
    }

    // Production: Check TTL cache
    if (!this.isDev) {
      const cached = await filesystemCache.getMetadata()
      if (cached) {
        return cached
      }
    }

    // Fetch from S3
    const url = `${S3_BASE}/world_meta.csv`
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000)
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`)
    }

    const data = await response.text()

    // Cache in production
    if (!this.isDev) {
      await filesystemCache.setMetadata(data)
    }

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

      // Dev: Check local cache first
      if (this.isDev || this.useLocalCacheOnly) {
        const localPath = join(CACHE_DIR, path)
        if (existsSync(localPath)) {
          try {
            const csvText = readFileSync(localPath, 'utf-8')
            return this.parseCountryData(csvText, ageGroup, chartType)
          } catch (error) {
            console.error(`Error reading local file ${localPath}:`, error)
          }
        }

        if (this.useLocalCacheOnly) {
          throw new Error(`Local file not found: ${path}. Run "npm run download-data" to cache data locally.`)
        }

        console.warn(`Local file not found: ${localPath}, fetching from S3`)
      }

      // Production: Check TTL cache
      if (!this.isDev) {
        const cached = await filesystemCache.getMortalityData(country, chartType, ageGroup)
        if (cached) {
          return this.parseCountryData(cached, ageGroup, chartType)
        }
      }

      // Fetch from S3
      const url = `${S3_BASE}/${path}`
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30000)
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
      }

      const csvText = await response.text()

      // Cache in production
      if (!this.isDev) {
        await filesystemCache.setMortalityData(country, chartType, ageGroup, csvText)
      }

      return this.parseCountryData(csvText, ageGroup, chartType)
    } catch (error) {
      console.error(`Error fetching ${country}/${chartType}/${ageGroup}:`, error)
      return []
    }
  }

  /**
   * Parse CSV text into array of objects
   */
  private parseCSV(csvText: string): Record<string, unknown>[] {
    const lines = csvText.trim().split('\n')
    if (lines.length === 0) return []

    const headers = lines[0]!.split(',').map(h => h.trim())
    const results: Record<string, unknown>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]!.split(',')
      const obj: Record<string, unknown> = {}

      headers.forEach((header, index) => {
        const value = values[index]?.trim()
        // Try to parse as number, otherwise keep as string
        obj[header] = isNaN(Number(value)) ? value : Number(value)
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
      const parsedObj = new CountryDataConstructor(rawObj as unknown as CountryDataRaw, ageGroup, chartType)
      if (!parsedObj.iso3c) continue
      data.push(parsedObj)
    }

    return data
  }

  /**
   * Get data for a specific country from raw data array
   */
  private getDataForCountry(
    rawData: CountryData[],
    iso3c: string,
    startDate: string
  ): Record<string, unknown> | undefined {
    const data = rawData.filter((v: CountryData) => v.iso3c === iso3c)
    if (!data || !data.length) return undefined

    // Find skipIndex to skip entries until startDate
    let skipIndex = 0
    for (let i = 0; i < data.length; i++) {
      if (data[i]?.date === startDate) {
        skipIndex = i
        break
      }
    }

    const result = getObjectOfArrays(data.slice(skipIndex))

    // Hide CDC suppressed data for USA
    if (iso3c.startsWith('USA')) {
      this.hideCdcSuppressed(result)
    }

    return result
  }

  /**
   * Remove CDC deaths < 10 and their derivatives
   */
  private hideCdcSuppressed(result: Record<string, unknown[]>) {
    for (let i = 0; i < (result.deaths?.length || 0); i++) {
      const val = result.deaths?.[i] as number
      if (val >= 10) continue
      for (const [k, v] of Object.entries(result)) {
        if (!k.startsWith('deaths') && !k.startsWith('cmr')) continue
        v[i] = NaN
      }
    }
  }

  /**
   * Sort labels based on chart type
   */
  private sortLabels(labels: string[], chartType?: string): string[] {
    if (chartType === 'monthly') {
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ]
      const customSort = (a: string, b: string) => {
        const x = parseInt(left(a, 4), 10) + months.indexOf(right(a, 3)) / 12
        const y = parseInt(left(b, 4), 10) + months.indexOf(right(b, 3)) / 12
        return x - y
      }
      return labels.sort(customSort)
    }
    return labels.sort()
  }

  /**
   * Get labels with optional sorting
   */
  private getLabels(chartType: string, labels: string[]): string[] {
    if (chartType === 'monthly') {
      return labels.sort((a: string, b: string) => {
        return fromYearMonthString(a) - fromYearMonthString(b)
      })
    }
    return labels.sort()
  }
}

// Singleton instance
export const dataLoader = new DataLoaderService()
