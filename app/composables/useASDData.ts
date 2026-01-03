/**
 * ASD (Age-Standardized Deaths) Data Composable
 *
 * Handles fetching and processing age-stratified data for ASD calculations.
 * Uses the shared ASD module which calls the stats API /asd endpoint implementing
 * the Levitt method:
 * 1. Calculate mortality rates per age group (deaths/population)
 * 2. Fit baseline models on rates
 * 3. Apply predicted rates to current population
 * 4. Sum across age groups
 *
 * This properly accounts for population aging - when age structure changes
 * but rates stay constant, excess is ~0.
 */

import { ref } from 'vue'
import type { ChartType } from '@/model/period'
import { metadataService } from '@/services/metadataService'
import { updateDataset } from '@/lib/data'
import { logger } from '@/lib/logger'
import {
  fetchASDFromStatsApi,
  buildAgeGroupInputs,
  type ASDResult,
  type ASDFetchConfig
} from '@/lib/asd'

const asdLogger = logger.withPrefix('ASD')

// Re-export ASDResult for consumers
export type { ASDResult }

export interface ASDConfig {
  countries: string[]
  chartType: ChartType
  source: string
  baselineMethod: string
  baselineDateFrom?: string
  baselineDateTo?: string
  useTrend?: boolean
}

/**
 * ASD Data Composable
 *
 * Fetches age-stratified data and calculates age-standardized deaths
 * using the stats API.
 */
export function useASDData() {
  const config = useRuntimeConfig()
  const statsUrl = (config.public.statsUrl as string || 'https://stats.mortality.watch').replace(/\/+$/, '')

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
   *
   * Uses the shared ASD module for the core calculation logic.
   */
  async function fetchASDForCountry(
    country: string,
    chartType: ChartType,
    source: string,
    ageGroups: string[],
    baselineMethod: string,
    baselineDateFrom?: string,
    baselineDateTo?: string,
    useTrend: boolean = false
  ): Promise<ASDResult | null> {
    // Fetch data for all age groups
    const dataset = await updateDataset(chartType, [country], ageGroups)

    if (!dataset || Object.keys(dataset).length === 0) {
      throw new Error(`No data found for ${country} with age groups: ${ageGroups.join(', ')}`)
    }

    // Build age group inputs using shared helper
    const ageGroupInputs = buildAgeGroupInputs(
      ageGroups,
      source,
      ageGroup => dataset[ageGroup]?.[country]
    )

    if (!ageGroupInputs) {
      throw new Error(`No data found for source "${source}"`)
    }

    // Log skipped age groups (those that were requested but not in the result)
    const validAgeGroups = Array.from(ageGroupInputs.keys())
    const skippedAgeGroups = ageGroups.filter(ag => !validAgeGroups.includes(ag))
    if (skippedAgeGroups.length > 0) {
      asdLogger.warn(`Skipped age groups with insufficient data: ${skippedAgeGroups.join(', ')}`)
    }

    // Build config for the shared fetch function
    const config: ASDFetchConfig = {
      statsUrl,
      baselineMethod,
      baselineDateFrom,
      baselineDateTo,
      useTrend
    }

    // Call shared ASD fetch function
    const result = await fetchASDFromStatsApi(ageGroupInputs, config)

    if (!result) {
      throw new Error(`Insufficient age-stratified data for ASD calculation. Need at least 2 age groups with valid data.`)
    }

    return result
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
          config.baselineDateFrom,
          config.baselineDateTo,
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
