import {
  CountryData,
  Country,
  type CountryRaw,
  type CountryDataRaw
} from '~/model'
import { dataLoader } from '../dataLoader'
import { metadataCache } from '../cache/metadataCache'
import { validateMetadata, validateMortalityData } from './validation'

const errHandler = (err: string) => console.error(err)

/**
 * Load country metadata as flat array with optional filtering
 * Uses cache to avoid repeated CSV parsing
 */
export const loadCountryMetadataFlat = async (options?: {
  filterCountries?: string[]
}): Promise<CountryRaw[]> => {
  // Check cache first
  const cached = metadataCache.getFlat(options?.filterCountries)
  if (cached) {
    return cached
  }

  // Cache miss - fetch and parse with validation
  try {
    const text = await dataLoader.fetchMetadata()

    // Validate data with fallback support
    const validationResult = await validateMetadata(text)

    if (!validationResult.success || !validationResult.data) {
      throw new Error('Metadata validation failed and no cache available')
    }

    // Log if we used cached data due to validation failure
    if (validationResult.usedCache) {
      console.warn('Using cached metadata due to validation failure')
    }

    const rawObjects = validationResult.data

    // Filter by specified countries if provided
    // Includes sub-national jurisdictions (e.g., USA matches USA, USA-ND, USA-CA, etc.)
    const filterCountries = options?.filterCountries || []
    const result = filterCountries.length > 0
      ? rawObjects.filter(obj =>
          filterCountries.includes(obj.iso3c)
          || filterCountries.some(fc => obj.iso3c.startsWith(`${fc}-`))
        )
      : rawObjects

    // Store in cache
    metadataCache.setFlat(result, options?.filterCountries)

    return result
  } catch (error) {
    console.error('Error loading metadata:', error)
    throw error
  }
}

/**
 * Load country metadata as Record indexed by iso3c code
 * Uses cache to avoid repeated CSV parsing
 */
export const loadCountryMetadata = async (options?: {
  filterCountries?: string[]
}): Promise<Record<string, Country>> => {
  // Check cache first
  const cached = metadataCache.get(options?.filterCountries)
  if (cached) {
    return cached
  }

  // Cache miss - fetch and parse with validation
  try {
    const text = await dataLoader.fetchMetadata()

    // Validate data with fallback support
    const validationResult = await validateMetadata(text)

    if (!validationResult.success || !validationResult.data) {
      throw new Error('Metadata validation failed and no cache available')
    }

    // Log if we used cached data due to validation failure
    if (validationResult.usedCache) {
      console.warn('Using cached metadata due to validation failure')
    }

    const rawObjects = validationResult.data
    const data: Record<string, Country> = {}

    // Get dev countries filter from options
    const filterCountries = options?.filterCountries || []

    for (const rawObj of rawObjects) {
      const typedObj = rawObj as unknown as Record<string, unknown>
      if (!typedObj.iso3c) continue

      const parsedObj = new Country(rawObj as CountryRaw)
      const iso = parsedObj.iso3c

      // Filter by specified countries if provided
      if (filterCountries.length > 0 && !filterCountries.includes(iso)) {
        continue
      }

      if (!data[iso]) data[iso] = parsedObj
      else
        data[iso].data_source = [
          ...data[iso].data_source,
          ...parsedObj.data_source
        ]
    }

    // Store in cache
    metadataCache.set(data, options?.filterCountries)

    return data
  } catch (error) {
    console.error('Error loading metadata:', error)
    throw error
  }
}

/**
 * Fetch data for a single country/chartType/ageGroup combination
 */
export const fetchData = async (
  chartType: string,
  country: string,
  ageGroup: string
): Promise<CountryData[]> => {
  try {
    const rawData = await dataLoader.fetchData(country, chartType, ageGroup)

    // Validate data with fallback support
    const validationResult = await validateMortalityData(rawData, country, chartType, ageGroup)

    if (!validationResult.success || !validationResult.data) {
      throw new Error(`Mortality data validation failed for ${country}/${chartType}/${ageGroup}`)
    }

    // Log if we used cached data due to validation failure
    if (validationResult.usedCache) {
      console.warn(`Using cached data for ${country}/${chartType}/${ageGroup} due to validation failure`)
    }

    const rawObjects = validationResult.data
    const data: CountryData[] = []

    for (const rawObj of rawObjects) {
      const parsedObj = new CountryData(rawObj as CountryDataRaw, ageGroup, chartType)
      if (!parsedObj.iso3c) continue
      data.push(parsedObj)
    }

    return data
  } catch (error) {
    console.error(`Error fetching ${country}/${chartType}/${ageGroup}:`, error)
    errHandler(error as string)
    return []
  }
}
