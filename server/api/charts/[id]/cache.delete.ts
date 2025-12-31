/**
 * DELETE /api/charts/:id/cache
 *
 * Clears the cached PNG images for a specific chart.
 * Admin only - clears both thumbnail and preview cache variants.
 */

import { eq } from 'drizzle-orm'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { db } from '../../../utils/db'
import { savedCharts, charts } from '../../../../db/schema'
import { requireAuth } from '../../../utils/auth'
import { generateCacheKey } from '../../../utils/chartCache'

const CACHE_DIR = '.data/cache/charts'

/**
 * Build cache keys for all common variants of a chart config
 * (thumbnails in light/dark mode, different sizes, etc.)
 */
function buildCacheKeys(chartConfig: string, _chartType: 'explorer' | 'ranking'): string[] {
  const keys: string[] = []

  // Common dimension variants
  const variants = [
    // Thumbnail variants (used in ChartCard)
    { width: 352, height: 198, dp: 2, z: 1.33, ti: '0', qr: '0', l: '0', cap: '0' },
    // OG image / preview variants
    { width: 1200, height: 630, dp: 2, z: 1 },
    { width: 1200, height: 630, dp: 1, z: 1 },
    // Default size
    { width: 800, height: 600, dp: 2, z: 1 },
    { width: 800, height: 600, dp: 1, z: 1 }
  ]

  // Dark mode variants
  const darkModes = ['0', '1']

  // Base query params from chart config
  const baseParams = new URLSearchParams(chartConfig)
  const baseQueryParams: Record<string, unknown> = {}
  for (const [key, value] of baseParams.entries()) {
    baseQueryParams[key] = value
  }

  // Generate cache key for each variant + dark mode combination
  for (const variant of variants) {
    for (const dm of darkModes) {
      const params = {
        ...baseQueryParams,
        ...variant,
        dm
      }
      keys.push(generateCacheKey(params))
    }
  }

  return keys
}

export default defineEventHandler(async (event) => {
  // Require authentication
  const user = await requireAuth(event)

  // Only admins can clear cache
  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: 'Only admins can clear chart cache'
    })
  }

  // Get chart ID from route params
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Chart ID is required'
    })
  }

  const chartId = parseInt(id, 10)
  if (isNaN(chartId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid chart ID'
    })
  }

  // Get the saved chart and join with charts table for config
  const result = await db
    .select({
      chartId: savedCharts.chartId,
      config: charts.config,
      page: charts.page
    })
    .from(savedCharts)
    .innerJoin(charts, eq(savedCharts.chartId, charts.id))
    .where(eq(savedCharts.id, chartId))
    .limit(1)

  const chartData = result[0]
  if (!chartData) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Chart not found'
    })
  }

  const { config, page } = chartData

  // Build cache keys for all variants
  const chartType = (page || 'explorer') as 'explorer' | 'ranking'
  const cacheKeys = buildCacheKeys(config, chartType)

  // Delete cache files
  let cleared = 0
  for (const key of cacheKeys) {
    const filePath = join(CACHE_DIR, `${key}.png`)
    try {
      await fs.unlink(filePath)
      cleared++
    } catch {
      // File doesn't exist, ignore
    }
  }

  return {
    success: true,
    cleared,
    message: cleared > 0 ? `Cleared ${cleared} cached image(s)` : 'No cached images found'
  }
})
