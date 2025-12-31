/**
 * ASD (Age-Standardized Deaths) Data Composable
 *
 * Handles fetching and processing age-stratified data for ASD calculations.
 * Uses the stats API /asd endpoint which implements the Levitt method:
 * 1. Calculate mortality rates per age group (deaths/population)
 * 2. Fit baseline models on rates
 * 3. Apply predicted rates to current population
 * 4. Sum across age groups
 *
 * This properly accounts for population aging - when age structure changes
 * but rates stay constant, excess is ~0.
 */

import { ref } from 'vue'
import type { CountryData } from '@/model'
import type { ChartType } from '@/model/period'
import { metadataService } from '@/services/metadataService'
import { updateDataset } from '@/lib/data'
import { dataLoader } from '@/lib/dataLoader'

export interface ASDResult {
  /** Age-standardized observed deaths per period */
  asd: (number | null)[]
  /** Age-standardized expected deaths (baseline) per period */
  asd_bl: (number | null)[]
  /** Lower prediction interval */
  lower: (number | null)[]
  /** Upper prediction interval */
  upper: (number | null)[]
  /** Z-scores */
  zscore: (number | null)[]
  /** Date labels aligned with the data */
  labels: string[]
}

export interface ASDConfig {
  countries: string[]
  chartType: ChartType
  source: string
  baselineMethod: string
  baselineStartIdx?: number
  baselineEndIdx?: number
  useTrend?: boolean
}

interface AgeGroupData {
  deaths: (number | null)[]
  population: (number | null)[]
}

/**
 * ASD Data Composable
 *
 * Fetches age-stratified data and calculates age-standardized deaths
 * using the stats API.
 */
export function useASDData() {
  const config = useRuntimeConfig()
  const statsUrl = config.public.statsUrl as string || 'https://stats.mortality.watch'

  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * Get available sources for ASD calculation
   */
  function getAvailableSources(
    countries: string[],
    chartType: ChartType
  ): Map<string, string[]> {
    return metadataService.getCommonSourcesWithAgeGroups(countries, chartType)
  }

  /**
   * Fetch ASD data for a single country
   */
  async function fetchASDForCountry(
    country: string,
    chartType: ChartType,
    source: string,
    ageGroups: string[],
    baselineMethod: string,
    baselineStartIdx?: number,
    baselineEndIdx?: number,
    useTrend: boolean = false
  ): Promise<ASDResult | null> {
    // Fetch data for all age groups
    const dataset = await updateDataset(chartType, [country], ageGroups)

    if (!dataset || Object.keys(dataset).length === 0) {
      throw new Error(`No data found for ${country} with age groups: ${ageGroups.join(', ')}`)
    }

    // Get all unique dates across age groups and filter by source
    const allDates = new Set<string>()
    const ageGroupDataMap = new Map<string, Map<string, CountryData>>()

    for (const ageGroup of ageGroups) {
      const ageData = dataset[ageGroup]?.[country]
      if (!ageData) continue

      const dateMap = new Map<string, CountryData>()
      for (const row of ageData) {
        // Filter by source
        if (row.source === source) {
          allDates.add(row.date)
          dateMap.set(row.date, row)
        }
      }
      ageGroupDataMap.set(ageGroup, dateMap)
    }

    if (allDates.size === 0) {
      throw new Error(`No data found for source "${source}"`)
    }

    // Sort dates
    const sortedDates = Array.from(allDates).sort()

    // Build age_groups array for the API
    const ageGroupsPayload: AgeGroupData[] = []

    for (const ageGroup of ageGroups) {
      const dateMap = ageGroupDataMap.get(ageGroup)
      if (!dateMap) continue

      const deaths: (number | null)[] = []
      const population: (number | null)[] = []

      for (const date of sortedDates) {
        const row = dateMap.get(date)
        if (row) {
          deaths.push(row.deaths ?? null)
          population.push(row.population ?? null)
        } else {
          deaths.push(null)
          population.push(null)
        }
      }

      ageGroupsPayload.push({ deaths, population })
    }

    // Determine baseline indices
    const bs = baselineStartIdx ?? 1
    const be = baselineEndIdx ?? Math.min(sortedDates.length, 5)

    // Call the stats API
    const endpoint = `${statsUrl}/asd`
    const body = {
      age_groups: ageGroupsPayload,
      h: 0,
      m: baselineMethod,
      t: useTrend ? 1 : 0,
      bs,
      be
    }

    const response = await dataLoader.fetchBaseline(endpoint, body)
    const result = JSON.parse(response)

    return {
      asd: result.asd,
      asd_bl: result.asd_bl,
      lower: result.lower,
      upper: result.upper,
      zscore: result.zscore,
      labels: sortedDates
    }
  }

  /**
   * Fetch ASD data for multiple countries
   *
   * Returns a map of country -> ASDResult
   */
  async function fetchASD(
    config: ASDConfig
  ): Promise<Map<string, ASDResult>> {
    isLoading.value = true
    error.value = null

    try {
      const results = new Map<string, ASDResult>()

      // Get age groups for the selected source
      const sourcesMap = getAvailableSources(config.countries, config.chartType)
      const ageGroups = sourcesMap.get(config.source)

      if (!ageGroups || ageGroups.length === 0) {
        throw new Error(`No age groups available for source "${config.source}"`)
      }

      // Fetch for each country
      for (const country of config.countries) {
        const result = await fetchASDForCountry(
          country,
          config.chartType,
          config.source,
          ageGroups,
          config.baselineMethod,
          config.baselineStartIdx,
          config.baselineEndIdx,
          config.useTrend
        )

        if (result) {
          results.set(country, result)
        }
      }

      return results
    } catch (e) {
      error.value = e as Error
      throw e
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    getAvailableSources,
    fetchASD,
    fetchASDForCountry
  }
}
