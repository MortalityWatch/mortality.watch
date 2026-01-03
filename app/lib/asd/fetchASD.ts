/**
 * ASD (Age-Standardized Deaths) Fetching
 *
 * Shared module for calculating age-standardized deaths using the stats API.
 * Used by both client-side (useASDData composable) and SSR (chartPngHelpers).
 *
 * The Levitt method implemented by the stats API:
 * 1. Calculate mortality rates per age group (deaths/population)
 * 2. Fit baseline models on rates
 * 3. Apply predicted rates to current population
 * 4. Sum across age groups
 *
 * This properly accounts for population aging - when age structure changes
 * but rates stay constant, excess is ~0.
 */

import { fetchWithRetry } from '../fetch/fetchWithRetry'

/**
 * Result from ASD calculation
 */
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

/**
 * Configuration for ASD calculation
 */
export interface ASDFetchConfig {
  /** Stats API base URL (e.g., 'https://stats.mortality.watch') */
  statsUrl: string
  /** Baseline method (e.g., 'lm', 'lin_reg', 'gam') */
  baselineMethod: string
  /** Baseline start date (optional) */
  baselineDateFrom?: string
  /** Baseline end date (optional) */
  baselineDateTo?: string
  /** Use trend in baseline (for lin_reg method) */
  useTrend?: boolean
}

/**
 * Input data for a single age group
 */
export interface AgeGroupInput {
  /** Date string -> { deaths, population } */
  dataByDate: Map<string, { deaths: number | null, population: number | null }>
}

/**
 * Build ASD payload and call stats API
 *
 * This is the core shared logic extracted from both client and SSR implementations.
 *
 * @param ageGroupInputs - Map of age group name to input data
 * @param config - ASD fetch configuration
 * @returns ASD result or null if insufficient data
 */
export async function fetchASDFromStatsApi(
  ageGroupInputs: Map<string, AgeGroupInput>,
  config: ASDFetchConfig
): Promise<ASDResult | null> {
  // Collect all unique dates across age groups
  const allDates = new Set<string>()
  for (const input of ageGroupInputs.values()) {
    for (const date of input.dataByDate.keys()) {
      allDates.add(date)
    }
  }

  if (allDates.size === 0) {
    return null
  }

  // Sort dates chronologically
  const sortedDates = Array.from(allDates).sort()

  // Build age_groups payload, filtering out groups with insufficient data
  const MIN_VALID_DATA_POINTS = 3
  const ageGroupsPayload: Array<{ deaths: (number | null)[], population: (number | null)[] }> = []
  const validAgeGroups: string[] = []

  for (const [ageGroup, input] of ageGroupInputs.entries()) {
    const deaths: (number | null)[] = []
    const population: (number | null)[] = []

    for (const date of sortedDates) {
      const row = input.dataByDate.get(date)
      if (row) {
        deaths.push(row.deaths)
        population.push(row.population)
      } else {
        deaths.push(null)
        population.push(null)
      }
    }

    // Count valid data points (non-null deaths AND population)
    const validCount = deaths.filter((d, i) => d !== null && population[i] !== null).length

    if (validCount >= MIN_VALID_DATA_POINTS) {
      ageGroupsPayload.push({ deaths, population })
      validAgeGroups.push(ageGroup)
    }
  }

  if (ageGroupsPayload.length < 2) {
    return null
  }

  // Determine baseline indices (1-indexed for R API)
  let bs = 1
  let be = Math.min(sortedDates.length, 5)

  // Find baseline index by matching label
  // For non-yearly charts (midyear/fluseason), labels are like '2017/18'
  // but URL params are just '2017', so we need to match by year prefix
  //
  // For "from" date: find first label starting with that year (e.g., '2017' → '2017/18')
  // For "to" date: find last label containing that year (e.g., '2019' → '2018/19')
  const findLabelIndex = (dateOrYear: string, findLast: boolean = false): number => {
    // First try exact match
    const exactIdx = sortedDates.indexOf(dateOrYear)
    if (exactIdx >= 0) return exactIdx

    // For short years (4 chars), find label containing that year
    if (dateOrYear.length === 4) {
      if (findLast) {
        // Find last label that contains the year (anywhere in label)
        // For midyear '2018/19', year 2019 appears at the end
        for (let i = sortedDates.length - 1; i >= 0; i--) {
          const label = sortedDates[i]
          if (label && label.includes(dateOrYear)) return i
        }
      } else {
        // Find first label that starts with the year
        return sortedDates.findIndex(label => label.startsWith(dateOrYear))
      }
    }

    return -1
  }

  if (config.baselineDateFrom) {
    const idx = findLabelIndex(config.baselineDateFrom, false)
    if (idx >= 0) bs = idx + 1
  }
  if (config.baselineDateTo) {
    const idx = findLabelIndex(config.baselineDateTo, true)
    if (idx >= 0) be = idx + 1
  }

  // Clamp to valid range
  bs = Math.max(1, Math.min(bs, sortedDates.length))
  be = Math.max(bs, Math.min(be, sortedDates.length))

  // Call the stats API
  const statsUrl = config.statsUrl.replace(/\/+$/, '')
  const endpoint = `${statsUrl}/asd`
  const body = {
    age_groups: ageGroupsPayload,
    h: 0,
    m: config.baselineMethod,
    t: config.useTrend ? 1 : 0,
    bs,
    be
  }

  const response = await fetchWithRetry(endpoint, body)
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
 * Build age group inputs from raw country data
 *
 * Helper function that converts various data formats to the standard AgeGroupInput format.
 *
 * @param ageGroups - List of age group names to process
 * @param source - Data source to filter by
 * @param getAgeGroupData - Function to get data rows for an age group
 * @returns Map of age group to input data, or null if no data found
 */
export function buildAgeGroupInputs<T extends { date: string, source: string, deaths?: number | null, population?: number | null }>(
  ageGroups: string[],
  source: string,
  getAgeGroupData: (ageGroup: string) => T[] | undefined
): Map<string, AgeGroupInput> | null {
  const result = new Map<string, AgeGroupInput>()
  let hasData = false

  for (const ageGroup of ageGroups) {
    const data = getAgeGroupData(ageGroup)
    if (!data) continue

    const dataByDate = new Map<string, { deaths: number | null, population: number | null }>()

    for (const row of data) {
      if (row.source === source) {
        hasData = true
        dataByDate.set(row.date, {
          deaths: row.deaths ?? null,
          population: row.population ?? null
        })
      }
    }

    if (dataByDate.size > 0) {
      result.set(ageGroup, { dataByDate })
    }
  }

  return hasData ? result : null
}

/**
 * Align ASD result to chart labels
 *
 * Maps ASD data arrays to match the chart's label array,
 * inserting nulls where ASD data is not available.
 *
 * @param asdResult - ASD calculation result
 * @param chartLabels - Target chart labels to align to
 * @returns Aligned arrays for each metric
 */
export function alignASDToChartLabels(
  asdResult: ASDResult,
  chartLabels: string[]
): {
  asd: (number | null)[]
  asd_bl: (number | null)[]
  lower: (number | null)[]
  upper: (number | null)[]
  zscore: (number | null)[]
} {
  // Create lookup from ASD labels to indices
  const asdLabelToIndex = new Map<string, number>()
  asdResult.labels.forEach((label, idx) => asdLabelToIndex.set(label, idx))

  // Helper to align a single array
  const alignArray = (arr: (number | null)[]): (number | null)[] => {
    return chartLabels.map((label) => {
      const idx = asdLabelToIndex.get(label)
      return idx !== undefined ? (arr[idx] ?? null) : null
    })
  }

  return {
    asd: alignArray(asdResult.asd),
    asd_bl: alignArray(asdResult.asd_bl),
    lower: alignArray(asdResult.lower),
    upper: alignArray(asdResult.upper),
    zscore: alignArray(asdResult.zscore)
  }
}
