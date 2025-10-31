// requireAdmin is auto-imported from server/utils/auth.ts
import { dataLoader } from '@/lib/dataLoader'
import Papa from 'papaparse'
import type { CountryRaw } from '@/model/country'

/**
 * Admin API: Get data quality and freshness report
 * GET /api/admin/data-quality
 *
 * Requires admin authentication
 *
 * Returns:
 * - Last update timestamp per country
 * - Data staleness status (fresh, warning, stale)
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

    const now = Date.now()
    const ONE_DAY = 24 * 60 * 60 * 1000

    // Process each country's data
    const countries = rawObjects.map((country) => {
      const maxDate = new Date(country.max_date)
      const lastUpdateMs = maxDate.getTime()
      const daysSinceUpdate = Math.floor((now - lastUpdateMs) / ONE_DAY)

      // Determine status based on staleness
      let status: 'fresh' | 'warning' | 'stale'
      if (daysSinceUpdate < 7) {
        status = 'fresh'
      } else if (daysSinceUpdate < 14) {
        status = 'warning'
      } else {
        status = 'stale'
      }

      return {
        iso3c: country.iso3c,
        jurisdiction: country.jurisdiction,
        lastUpdate: country.max_date,
        lastUpdateTimestamp: lastUpdateMs,
        daysSinceUpdate,
        status,
        dataSource: country.source,
        type: country.type,
        ageGroups: country.age_groups,
        minDate: country.min_date
      }
    })

    // Sort by staleness (most stale first)
    countries.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate)

    // Calculate summary statistics
    const summary = {
      total: countries.length,
      fresh: countries.filter(c => c.status === 'fresh').length,
      warning: countries.filter(c => c.status === 'warning').length,
      stale: countries.filter(c => c.status === 'stale').length,
      averageDaysSinceUpdate: Math.floor(
        countries.reduce((sum, c) => sum + c.daysSinceUpdate, 0) / countries.length
      ),
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

    return {
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      countries
    }
  } catch (err) {
    console.error('Error fetching data quality report:', err)
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : 'Failed to fetch data quality report'
    })
  }
})
