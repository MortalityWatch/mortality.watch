import { db } from '../../../../utils/db'
import { savedCharts } from '../../../../../db/schema'
import { eq } from 'drizzle-orm'
import { ChartFeatureUpdateResponseSchema } from '../../../../schemas'

/**
 * PATCH /api/admin/charts/:id/featured
 *
 * Toggle featured status for a chart
 * Body: { isFeatured: boolean }
 *
 * Requires admin authentication
 */
export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  const id = parseInt(getRouterParam(event, 'id') || '')

  if (!id || isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: 'Valid chart ID is required'
    })
  }

  const body = await readBody(event)
  const { isFeatured } = body

  if (typeof isFeatured !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: 'isFeatured must be a boolean'
    })
  }

  try {
    // Update the chart
    const result = await db
      .update(savedCharts)
      .set({ isFeatured })
      .where(eq(savedCharts.id, id))
      .returning()

    if (!result || result.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'Chart not found'
      })
    }

    const response = {
      success: true as const,
      chart: result[0]
    }
    return ChartFeatureUpdateResponseSchema.parse(response)
  } catch (err) {
    if (err && typeof err === 'object' && 'statusCode' in err) {
      throw err
    }

    console.error('Error updating featured status:', err)
    throw createError({
      statusCode: 500,
      message: 'Failed to update featured status'
    })
  }
})
