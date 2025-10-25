import type {
  CountryData,
  DatasetRaw,
  DatasetEntry
} from '~/model'
import { getObjectOfArrays } from '~/utils'
import { fetchData } from './queries'

/**
 * Update dataset by fetching data for all country/ageGroup combinations
 * WARNING: This creates unbounded parallel requests - should be throttled
 */
export const updateDataset = async (
  chartType: string,
  countryCodes: string[],
  ageGroups: string[]
): Promise<DatasetRaw> => {
  try {
    const operations: Promise<CountryData[]>[] = []
    // Call fetchData in parallel for all combinations
    countryCodes.forEach((country) => {
      ageGroups.forEach((ag) => {
        operations.push(fetchData(chartType, country, ag))
      })
    })
    const results = await Promise.all(operations)
    const rows = results.flat()
    const data: DatasetRaw = {}
    rows.forEach((row) => {
      const { age_group, iso3c } = row
      data[age_group] = data[age_group] || {}
      data[age_group][iso3c] = data[age_group][iso3c] || []
      data[age_group][iso3c].push(row)
    })
    return data
  } catch (error) {
    console.error(error)
    return {}
  }
}

/**
 * Get data for a specific country from raw data array
 */
export const getDataForCountry = (
  rawData: CountryData[],
  iso3c: string,
  startDate: string
): DatasetEntry | undefined => {
  const data = rawData.filter((v: CountryData) => v.iso3c === iso3c)
  if (!data || !data.length) return undefined

  // Find skipIndex, which skips all entries until startDate.
  let skipIndex = undefined
  for (let i = 0; i < data.length; i++) {
    if (data[i]?.date === startDate) {
      skipIndex = i
      break
    }
  }

  const result = getObjectOfArrays(data.slice(skipIndex))
  if (iso3c.startsWith('USA')) hideCdcSuppressed(result)
  return result
}

/**
 * Remove CDC deaths < 10 and their derivatives
 */
const hideCdcSuppressed = (result: Record<string, unknown[]>) => {
  for (let i = 0; i < (result.deaths?.length || 0); i++) {
    const val = result.deaths?.[i] as number
    if (val >= 10) continue
    for (const [k, v] of Object.entries(result)) {
      if (!k.startsWith('deaths') && !k.startsWith('cmr')) continue
      v[i] = NaN
    }
  }
}
