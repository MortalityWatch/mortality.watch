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
  fetchASDForCountry as sharedFetchASDForCountry,
  type ASDResult,
  type ASDDataLoader
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
 * Client-side data loader adapter
 * Wraps updateDataset to match the ASDDataLoader interface
 */
const clientDataLoader: ASDDataLoader = async (chartType, countries, ageGroups) => {
  const dataset = await updateDataset(chartType, countries, ageGroups)
  // Cast to the expected interface - the actual data structure is compatible
  return dataset as unknown as Record<string, Record<string, Array<{ date: string, source: string, deaths?: number | null, population?: number | null }>>>
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
   * Uses the shared fetchASDForCountry function with the client-side data loader.
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
    // Use shared function with client-side data loader
    const result = await sharedFetchASDForCountry(
      clientDataLoader,
      country,
      chartType,
      source,
      ageGroups,
      {
        statsUrl,
        baselineMethod,
        baselineDateFrom,
        baselineDateTo,
        useTrend
      }
    )

    if (!result) {
      asdLogger.warn(`Insufficient age-stratified data for ASD calculation for ${country}`)
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
