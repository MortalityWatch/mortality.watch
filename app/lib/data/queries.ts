import Papa from 'papaparse'
import {
  CountryData,
  Country,
  type CountryRaw,
  type CountryDataRaw
} from '~/model'
import { dataLoader } from '../dataLoader'
import { metadataCache } from '../cache/metadataCache'

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

  // Cache miss - fetch and parse
  const text = await dataLoader.fetchMetadata()
  const rawObjects = Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  }).data as CountryRaw[]

  // Filter by specified countries if provided
  const filterCountries = options?.filterCountries || []
  const result = filterCountries.length > 0
    ? rawObjects.filter(obj => filterCountries.includes(obj.iso3c))
    : rawObjects

  // Store in cache
  metadataCache.setFlat(result, options?.filterCountries)

  return result
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

  // Cache miss - fetch and parse
  const text = await dataLoader.fetchMetadata()
  const rawObjects = Papa.parse(text, { header: true }).data as unknown[]
  const data: Record<string, Country> = {}

  // Get dev countries filter from options
  const filterCountries = options?.filterCountries || []

  for (const rawObj of rawObjects) {
    const typedObj = rawObj as Record<string, unknown>
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
    const rawObjects = Papa.parse(rawData, {
      header: true,
      delimiter: ',',
      newline: '\n'
    }).data
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
