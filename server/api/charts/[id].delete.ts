import { db } from '../../utils/db'
import { savedCharts } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { ChartDeleteResponseSchema } from '../../schemas'
import { logger } from '../../utils/logger'

/**
 * DELETE /api/charts/:id
 *
 * Delete a saved chart
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

    // Only owner or admin can delete
    if (chart.userId !== user.id && user.role !== 'admin') {
      throw createError({ statusCode: 403, message: 'Permission denied' })
    }

    await db.delete(savedCharts).where(eq(savedCharts.id, chartId))

    const response = {
      success: true as const,
      message: 'Chart deleted successfully'
    }
    return ChartDeleteResponseSchema.parse(response)
  } catch (err) {
    logger.error('Error deleting chart:', err instanceof Error ? err : new Error(String(err)))
    throw createError({
      statusCode: 500,
      message: 'Failed to delete chart'
    })
  }
})
