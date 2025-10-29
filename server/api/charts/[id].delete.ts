import { db } from '../../utils/db'
import { savedCharts } from '../../../db/schema'
import { eq } from 'drizzle-orm'

/**
 * DELETE /api/charts/:id
 *
 * Delete a saved chart
 * Requires authentication and ownership (or admin)
 */
export default defineEventHandler(async (event) => {
  // TODO: Add authentication check when auth is implemented
  // const user = await requireAuth(event)
  // if (!user) {
  //   throw createError({ statusCode: 401, message: 'Authentication required' })
  // }

  const chartId = parseInt(event.context.params?.id || '')

  if (isNaN(chartId)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid chart ID'
    })
  }

  try {
    // TODO: Add ownership check when auth is implemented
    // const chart = await db.query.savedCharts.findFirst({
    //   where: eq(savedCharts.id, chartId)
    // })
    //
    // if (!chart) {
    //   throw createError({ statusCode: 404, message: 'Chart not found' })
    // }
    //
    // if (chart.userId !== user.id && user.role !== 'admin') {
    //   throw createError({ statusCode: 403, message: 'Permission denied' })
    // }

    await db.delete(savedCharts).where(eq(savedCharts.id, chartId))

    return {
      success: true,
      message: 'Chart deleted successfully'
    }
  } catch (err) {
    console.error('Error deleting chart:', err)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete chart'
    })
  }
})
