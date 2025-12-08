import { db } from '../../utils/db'
import { savedCharts, charts } from '../../../db/schema'
import { ChartSaveResponseSchema } from '../../schemas'
import { eq, and, sql } from 'drizzle-orm'
import { createHash } from 'crypto'
import { chartStateToQueryString } from '../../../app/lib/chartState'

// Default values that should be omitted from hash (to normalize equivalent configs)
const DEFAULTS: Record<string, string> = {
  cs: 'line',
  ct: 'yearly',
  bm: 'lin_reg',
  sp: 'esp',
  ag: 'all'
}

/**
 * Normalize config for consistent hashing (same logic as client-side)
 */
function normalizeConfig(params: Record<string, string | undefined>): Record<string, string> {
  const normalized: Record<string, string> = {}
  const sortedKeys = Object.keys(params).sort()

  for (const key of sortedKeys) {
    const value = params[key]
    if (value === undefined || value === null || value === '') continue
    if (DEFAULTS[key] === value) continue
    normalized[key] = value
  }

  return normalized
}

/**
 * Compute SHA-256 hash and return first 12 hex chars
 */
function computeConfigHash(params: Record<string, string | undefined>): string {
  const normalized = normalizeConfig(params)
  const jsonStr = JSON.stringify(normalized)
  const hash = createHash('sha256').update(jsonStr).digest('hex')
  return hash.slice(0, 12)
}

/**
 * Convert query string to params object for hashing
 */
function queryStringToParams(queryString: string): Record<string, string> {
  const params: Record<string, string> = {}
  const searchParams = new URLSearchParams(queryString)

  for (const [key, value] of searchParams.entries()) {
    if (params[key]) {
      params[key] = `${params[key]},${value}`
    } else {
      params[key] = value
    }
  }

  return params
}

/**
 * POST /api/charts
 *
 * Save a new chart
 * Body: { name, description, chartState, chartType, isPublic }
 *
 * Requires authentication (Tier 1+)
 */
export default defineEventHandler(async (event) => {
  // Require authentication (Tier 1+)
  const user = await requireAuth(event)
  if (user.tier < 1) {
    throw createError({
      statusCode: 403,
      message: 'Pro or Premium subscription required to save charts'
    })
  }

  const userId = user.id

  const body = await readBody(event)
  const { name, description, chartState, chartType, isPublic } = body

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Chart name is required'
    })
  }

  if (!chartState || typeof chartState !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'Chart state is required'
    })
  }

  if (!chartType || !['explorer', 'ranking'].includes(chartType)) {
    throw createError({
      statusCode: 400,
      message: 'Chart type must be "explorer" or "ranking"'
    })
  }

  // Parse chartState JSON and convert to query string
  let chartStateObj: Record<string, unknown>
  try {
    chartStateObj = JSON.parse(chartState)
  } catch {
    throw createError({
      statusCode: 400,
      message: 'Invalid chart state JSON'
    })
  }

  // Convert state to query string
  // For ranking charts, the state object already uses URL parameter keys (a, p, j, etc.)
  // For explorer charts, we need to convert field names to URL keys using chartStateToQueryString
  let queryString: string
  if (chartType === 'ranking') {
    // Ranking: state already has URL keys, just convert to query string
    const urlParams = new URLSearchParams()
    for (const [key, value] of Object.entries(chartStateObj)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => urlParams.append(key, String(v)))
        } else {
          urlParams.set(key, String(value))
        }
      }
    }
    queryString = urlParams.toString()
  } else {
    // Explorer: use chartStateToQueryString to convert field names to URL keys
    queryString = chartStateToQueryString(chartStateObj)
  }

  const params = queryStringToParams(queryString)
  const chartId = computeConfigHash(params)

  // Check if user already has a chart with this chartId
  try {
    const duplicates = await db
      .select()
      .from(savedCharts)
      .where(
        and(
          eq(savedCharts.userId, userId),
          eq(savedCharts.chartId, chartId)
        )
      )
      .limit(1)

    if (duplicates.length > 0 && duplicates[0]) {
      const existingChart = duplicates[0]
      throw createError({
        statusCode: 409,
        statusMessage: 'Duplicate Chart',
        message: 'You have already saved an identical chart',
        data: {
          duplicate: true,
          existingChart: {
            id: existingChart.id,
            slug: existingChart.slug,
            name: existingChart.name,
            createdAt: existingChart.createdAt
          }
        }
      })
    }
  } catch (err) {
    if (err && typeof err === 'object' && 'statusCode' in err && err.statusCode === 409) {
      throw err
    }
    logger.error('Error checking for duplicate chart:', err instanceof Error ? err : new Error(String(err)))
  }

  // Ensure chart config exists in charts table
  const existingChart = await db
    .select()
    .from(charts)
    .where(eq(charts.id, chartId))
    .limit(1)

  if (existingChart.length === 0) {
    // Create chart config entry
    await db.insert(charts).values({
      id: chartId,
      config: queryString,
      page: chartType as 'explorer' | 'ranking'
    })
  } else {
    // Increment createCount
    await db
      .update(charts)
      .set({ createCount: sql`${charts.createCount} + 1` })
      .where(eq(charts.id, chartId))
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now()

  try {
    const result = await db.insert(savedCharts).values({
      userId,
      chartId,
      name: name.trim(),
      description: description?.trim() || null,
      isPublic: isPublic === true,
      isFeatured: false,
      slug,
      viewCount: 0
    }).returning()

    const response = {
      success: true as const,
      chart: result[0]
    }
    return ChartSaveResponseSchema.parse(response)
  } catch (err) {
    logger.error('Error saving chart:', err instanceof Error ? err : new Error(String(err)))
    throw createError({
      statusCode: 500,
      message: 'Failed to save chart'
    })
  }
})
