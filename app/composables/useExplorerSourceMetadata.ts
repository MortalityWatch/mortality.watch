import { ref } from 'vue'
import type { useExplorerState } from '@/composables/useExplorerState'
import type { DatasetRaw } from '@/model'
import type { ChartType } from '@/model/period'
import { metadataService } from '@/services/metadataService'
import { logger } from '@/lib/logger'
import { extractSourceInfoFromDataset, type CountrySourceInfo } from '@/lib/explorer/sourceInfo'

const log = logger.withPrefix('ExplorerDataOrchestration')

/** Source attribution and LE availability metadata for the active dataset. */
export function useExplorerSourceMetadata(state: ReturnType<typeof useExplorerState>) {
  /**
   * Source information for currently displayed data.
   * Maps country ISO3C code to source info (source name and age groups for ASD).
   * Updated when data is fetched.
   */
  const dataSourceInfo = ref<Map<string, CountrySourceInfo>>(new Map())

  /**
   * Per-country LE unavailability reasons surfaced from the dataset.
   * Maps country ISO3C code to the raw `le_unavailable_reason` string from
   * the data pipeline (e.g. "first_age_group_too_broad"). Only populated
   * when the LE metric is selected and the dataset carries a non-empty
   * reason for that country. Empty otherwise.
   *
   * The column will be missing in published data until the companion data-
   * pipeline change ships and the cron republishes — the extractor below
   * is a graceful no-op in that case.
   */
  const leUnavailableReasons = ref<Map<string, string>>(new Map())

  /**
   * Extract source information from the loaded dataset.
   * Uses the appropriate source column based on the metric type:
   * - ASMR types: source_asmr
   * - LE types: source (LE uses same data source as deaths)
   * - Other types: source
   * For ASD, source info is set separately in fetchAndInjectASDData.
   *
   * Also fetches age groups from metadata for age-stratified metrics (ASMR, LE).
   */
  const extractSourcesFromDataset = async (
    datasetToExtract: DatasetRaw,
    countries: string[],
    selectedLabels?: string[]
  ) => {
    // Don't overwrite ASD source info
    if (state.type.value === 'asd') return
    const metricType = state.type.value
    const needsAgeGroups = metricType === 'asmr' || metricType === 'le'
    const chartType = state.chartType.value as ChartType

    let metadataLoadPromise: Promise<void> | null = null
    const getSourceAgeGroups = async (country: string) => {
      if (!needsAgeGroups) return new Map<string, string[]>()

      try {
        if (!metadataLoadPromise) {
          metadataLoadPromise = metadataService.load()
        }
        await metadataLoadPromise

        return metadataService.getSourcesWithAgeGroups(country, chartType)
      } catch {
        log.warn('Could not load metadata for age groups')
        return new Map<string, string[]>()
      }
    }

    dataSourceInfo.value = await extractSourceInfoFromDataset(
      datasetToExtract,
      countries,
      metricType,
      selectedLabels,
      needsAgeGroups ? getSourceAgeGroups : undefined
    )
  }

  /**
   * Scan the loaded dataset for LE unavailability reasons.
   *
   * The data pipeline emits an optional `le_unavailable_reason` column on
   * LE-bearing rows (see MortalityWatch/data#15). When LE is computable the
   * column is missing/empty; when it cannot be computed (e.g. source only
   * publishes a broad first age band) the column carries a reason string
   * such as "first_age_group_too_broad".
   *
   * This is a graceful no-op when the column isn't present yet (defensive
   * shipping ahead of the data PR + cron republish).
   *
   * Only populated when the active metric is LE — for other metrics there
   * is nothing to surface.
   */
  const extractLeUnavailableReasons = (
    datasetToExtract: DatasetRaw,
    countries: string[]
  ) => {
    if (state.type.value !== 'le') {
      leUnavailableReasons.value = new Map()
      return
    }

    const reasons = new Map<string, string>()

    for (const country of countries) {
      // Look through age groups to find a row with a reason for this country.
      // We pick the first non-empty value; the data pipeline emits the same
      // reason for every LE-bearing row of an unavailable jurisdiction.
      let found: string | undefined
      for (const ageGroup of Object.keys(datasetToExtract)) {
        const countryData = datasetToExtract[ageGroup]?.[country]
        if (!countryData || countryData.length === 0) continue
        for (const row of countryData) {
          const reason = row?.le_unavailable_reason
          if (reason && reason !== '') {
            found = reason
            break
          }
        }
        if (found) break
      }
      if (found) reasons.set(country, found)
    }

    leUnavailableReasons.value = reasons
  }

  return { dataSourceInfo, leUnavailableReasons, extractSourcesFromDataset, extractLeUnavailableReasons }
}
