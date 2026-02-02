/**
 * PATCH /api/charts/:id
 *
 * Updates an existing saved chart's metadata and optionally its configuration.
 * Only the owner can update their saved chart.
 *
 * If chartState is provided, the chart's configuration will be updated to the new state.
 */

import { eq, and, sql } from 'drizzle-orm'
import { createHash } from 'crypto'
import { db } from '../../utils/db'
import { savedCharts, charts } from '../../../db/schema'
import { requireAuth } from '../../utils/auth'
import { chartStateToQueryString } from '../../../app/lib/chartState'

/**
 * Generate slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now()
}

// Default values that should be omitted from hash (to normalize equivalent configs)
const DEFAULTS: Record<string, string> = {
  cs: 'line',
  ct: 'yearly',
  bm: 'lin_reg',
  sp: 'esp',
  ag: 'all'
}

/**
 * Normalize config for consistent hashing
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

interface UpdateChartBody {
  name?: string
  description?: string | null
  notes?: string | null
  isPublic?: boolean
  chartState?: string // JSON string of chart state (optional - for updating config)
  chartType?: 'explorer' | 'ranking'
}

export default defineEventHandler(async (event) => {
  // Require authentication
  const user = await requireAuth(event)

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

  // Get request body
  const body = await readBody<UpdateChartBody>(event)

  // Verify ownership
  const existingChart = await db
    .select()
    .from(savedCharts)
    .where(
      and(
        eq(savedCharts.id, chartId),
        eq(savedCharts.userId, user.id)
      )
    )
    .limit(1)

  if (existingChart.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Chart not found or you do not have permission to update it'
    })
  }

  // Build update object
  const updates: Partial<typeof savedCharts.$inferInsert> = {}

  if (body.name !== undefined) {
    const trimmedName = body.name.trim()
    if (!trimmedName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Chart name cannot be empty'
      })
    }
    updates.name = trimmedName
    // Regenerate slug when name changes
    updates.slug = generateSlug(trimmedName)
  }

  if (body.description !== undefined) {
    updates.description = body.description?.trim() || null
  }

  if (body.notes !== undefined) {
    updates.notes = body.notes?.trim() || null
  }

  if (body.isPublic !== undefined) {
    updates.isPublic = body.isPublic
  }

  // Handle chart state update (replacing the chart configuration)
  if (body.chartState) {
    const chartType = body.chartType || 'explorer'

    // Parse chartState JSON
    let chartStateObj: Record<string, unknown>
    try {
      chartStateObj = JSON.parse(body.chartState)
    } catch {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'Invalid chartState JSON'
      })
    }

    // Convert to query string based on chart type
    let queryString: string
    if (chartType === 'ranking') {
      const urlParams = new URLSearchParams()
      for (const [key, value] of Object.entries(chartStateObj)) {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            for (const item of value) {
              urlParams.append(key, String(item))
            }
          } else {
            urlParams.set(key, String(value))
          }
        }
      }
      queryString = urlParams.toString()
    } else {
      queryString = chartStateToQueryString(chartStateObj)
    }

    const params = queryStringToParams(queryString)
    const newChartId = computeConfigHash(params)

    // Ensure chart config exists in charts table
    const existingConfig = await db
      .select()
      .from(charts)
      .where(eq(charts.id, newChartId))
      .limit(1)

    if (existingConfig.length === 0) {
      // Create new chart config
      await db.insert(charts).values({
        id: newChartId,
        config: queryString,
        page: chartType,
        createCount: 1,
        accessCount: 0
      })
    } else {
      // Increment create count
      await db
        .update(charts)
        .set({ createCount: sql`${charts.createCount} + 1` })
        .where(eq(charts.id, newChartId))
    }

    // Update the savedChart to point to the new config
    updates.chartId = newChartId
  }

  // If no updates provided, return existing chart
  if (Object.keys(updates).length === 0) {
    return {
      success: true,
      chart: existingChart[0]
    }
  }

  // Perform update
  await db
    .update(savedCharts)
    .set(updates)
    .where(eq(savedCharts.id, chartId))

  // Fetch updated chart
  const updatedChart = await db
    .select()
    .from(savedCharts)
    .where(eq(savedCharts.id, chartId))
    .limit(1)

  return {
    success: true,
    chart: updatedChart[0]
  }
})
