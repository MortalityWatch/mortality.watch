import Papa from 'papaparse'
import {
  CountryData,
  Country,
  type CountryRaw
} from '~/model'
import { dataLoader } from '../dataLoader'

const errHandler = (err: string) => console.error(err)

/**
 * Load country metadata as flat array with optional filtering
 */
export const loadCountryMetadataFlat = async (options?: {
  filterCountries?: string[]
}): Promise<CountryRaw[]> => {
  const text = await dataLoader.fetchMetadata()
  const rawObjects = Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  }).data as CountryRaw[]

  // Filter by specified countries if provided
  const filterCountries = options?.filterCountries || []
  if (filterCountries.length > 0) {
    return rawObjects.filter(obj => filterCountries.includes(obj.iso3c))
  }

  return rawObjects
}

/**
 * Load country metadata as Record indexed by iso3c code
 */
export const loadCountryMetadata = async (options?: {
  filterCountries?: string[]
}): Promise<Record<string, Country>> => {
  const text = await dataLoader.fetchMetadata()
  const rawObjects = Papa.parse(text, { header: true }).data as unknown[]
  const data: Record<string, Country> = {}

  // Get dev countries filter from options
  const filterCountries = options?.filterCountries || []

  if (import.meta.dev && filterCountries.length > 0) {
    console.log('[loadCountryMetadata] Filtering to countries:', filterCountries)
  }

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
      const parsedObj = new CountryData(rawObj, ageGroup, chartType)
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
