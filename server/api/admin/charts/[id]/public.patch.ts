import { db } from '../../../../utils/db'
import { savedCharts } from '../../../../../db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '../../../../utils/logger'

/**
 * PATCH /api/admin/charts/:id/public
 *
 * Toggle public status for a chart (owner or admin)
 */
export default defineEventHandler(async (event) => {
  // Require authentication
  const user = await requireAuth(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Chart ID is required'
    })
  }

  const chartId = parseInt(id, 10)
  if (isNaN(chartId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid chart ID'
    })
  }

  // Check if user is owner or admin
  const result = await db
    .select({
      id: savedCharts.id,
      userId: savedCharts.userId
    })
    .from(savedCharts)
    .where(eq(savedCharts.id, chartId))
    .limit(1)

  const chart = result[0]

  if (!chart) {
    throw createError({
      statusCode: 404,
      message: 'Chart not found'
    })
  }

  if (chart.userId !== user.id && user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to modify this chart'
    })
  }

  const body = await readBody(event)
  const { isPublic } = body

  if (typeof isPublic !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: 'isPublic must be a boolean'
    })
  }

  try {
    // If setting to private, also set featured to false
    const updates = isPublic
      ? { isPublic }
      : { isPublic, isFeatured: false }

    await db
      .update(savedCharts)
      .set(updates)
      .where(eq(savedCharts.id, chartId))
      .run()

    return { success: true, isPublic }
  } catch (err) {
    logger.error('Error updating chart public status:', err instanceof Error ? err : new Error(String(err)))
    throw createError({
      statusCode: 500,
      message: 'Failed to update chart public status'
    })
  }
})
