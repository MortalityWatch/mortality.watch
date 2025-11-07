import { db } from '../../utils/db'
import { savedCharts } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { ChartVisibilityUpdateResponseSchema } from '../../schemas'

/**
 * PATCH /api/charts/:id
 *
 * Update chart visibility (isPublic)
 * Requires authentication and ownership (or admin)
 */
export default defineEventHandler(async (event) => {
  // Require authentication
  const user = await requireAuth(event)

  const chartId = parseInt(event.context.params?.id || '')

  if (isNaN(chartId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid chart ID'
    })
  }

  const body = await readBody(event)
  const { isPublic } = body

  // Validation
  if (typeof isPublic !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: 'isPublic must be a boolean'
    })
  }

  try {
    // Check ownership
    const charts = await db
      .select()
      .from(savedCharts)
      .where(eq(savedCharts.id, chartId))
      .limit(1)

    const chart = charts[0]

    if (!chart) {
      throw createError({ statusCode: 404, message: 'Chart not found' })
    }

    // Only owner or admin can update
    if (chart.userId !== user.id && user.role !== 'admin') {
      throw createError({ statusCode: 403, message: 'Permission denied' })
    }

    // Update chart visibility
    const updated = await db
      .update(savedCharts)
      .set({ isPublic })
      .where(eq(savedCharts.id, chartId))
      .returning()

    const response = {
      success: true as const,
      chart: updated[0]
    }
    return ChartVisibilityUpdateResponseSchema.parse(response)
  } catch (err) {
    logger.error('Error updating chart visibility:', err instanceof Error ? err : new Error(String(err)))
    throw createError({
      statusCode: 500,
      message: 'Failed to update chart visibility'
    })
  }
})
