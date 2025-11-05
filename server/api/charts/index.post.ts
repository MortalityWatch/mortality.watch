import { db } from '../../utils/db'
import { savedCharts } from '../../../db/schema'
import { ChartSaveResponseSchema } from '../../schemas'

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

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now()

  try {
    const result = await db.insert(savedCharts).values({
      userId,
      name: name.trim(),
      description: description?.trim() || null,
      chartState,
      chartType,
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
