// requireAdmin and db are auto-imported from server/utils
import { dataLoader } from '@/lib/dataLoader'
import Papa from 'papaparse'
import type { CountryRaw } from '@/model/country'
import { getStalenessStatus, isSourceIgnored } from '../../../server/config/staleness'
import { dataQualityOverrides } from '#db'
import { DataQualityResponseSchema } from '../../schemas'

/**
 * Admin API: Get data quality and freshness report
 * GET /api/admin/data-quality
 *
 * Requires admin authentication
 *
 * Returns:
 * - Last update timestamp per country
 * - Data staleness status (fresh, stale)
 * - Data source information
 * - Summary statistics
 */
export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  try {
    // Fetch metadata CSV
    const metadataText = await dataLoader.fetchMetadata()
    const rawObjects = Papa.parse(metadataText, {
      header: true,
      skipEmptyLines: true
    }).data as CountryRaw[]

    // Fetch all overrides
    const overrides = await db.select().from(dataQualityOverrides).all()
    const overrideMap = new Map(
      overrides.map(o => [`${o.iso3c}:${o.source}`, o.status])
    )

    const now = Date.now()
    const ONE_DAY = 24 * 60 * 60 * 1000

    // Process each country's data, filtering out ignored sources
    const countries = rawObjects
      .filter(country => !isSourceIgnored(country.source))
      .map((country) => {
        const maxDate = new Date(country.max_date)
        const lastUpdateMs = maxDate.getTime()
        const daysSinceUpdate = Math.floor((now - lastUpdateMs) / ONE_DAY)

        // Determine status based on source-specific staleness thresholds
        const status = getStalenessStatus(country.source, daysSinceUpdate)

        // Get override status if it exists
        const overrideKey = `${country.iso3c}:${country.source}`
        const overrideStatus = overrideMap.get(overrideKey) || 'monitor'

        return {
          iso3c: country.iso3c,
          jurisdiction: country.jurisdiction,
          lastUpdate: country.max_date,
          lastUpdateTimestamp: lastUpdateMs,
          daysSinceUpdate,
          status,
          overrideStatus,
          dataSource: country.source,
          type: country.type,
          ageGroups: country.age_groups,
          minDate: country.min_date
        }
      })

    // Sort by staleness (most stale first)
    countries.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate)

    // Helper to calculate median
    const calculateMedian = (values: number[]): number => {
      if (values.length === 0) return 0
      const sorted = [...values].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      if (sorted.length % 2 === 0) {
        const val1 = sorted[mid - 1]
        const val2 = sorted[mid]
        return val1 !== undefined && val2 !== undefined ? Math.floor((val1 + val2) / 2) : 0
      }
      return sorted[mid] ?? 0
    }

    const freshCountries = countries.filter(c => c.status === 'fresh')
    const staleCountries = countries.filter(c => c.status === 'stale')

    // Calculate summary statistics
    const summary = {
      total: countries.length,
      fresh: freshCountries.length,
      stale: staleCountries.length,
      medianFreshDays: calculateMedian(freshCountries.map(c => c.daysSinceUpdate)),
      medianStaleDays: calculateMedian(staleCountries.map(c => c.daysSinceUpdate)),
      mostStaleCountry: countries[0]
        ? {
            iso3c: countries[0].iso3c,
            jurisdiction: countries[0].jurisdiction,
            daysSinceUpdate: countries[0].daysSinceUpdate
          }
        : null,
      mostRecentUpdate: countries.reduce((mostRecent, c) =>
        c.lastUpdateTimestamp > mostRecent ? c.lastUpdateTimestamp : mostRecent,
      0
      )
    }

    const response = {
      success: true as const,
      timestamp: new Date().toISOString(),
      summary,
      countries
    }
    return DataQualityResponseSchema.parse(response)
  } catch (err) {
    logger.error('Error fetching data quality report', err instanceof Error ? err : new Error(String(err)))
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : 'Failed to fetch data quality report'
    })
  }
})
