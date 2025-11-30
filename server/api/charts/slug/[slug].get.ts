import { db } from '../../../utils/db'
import { savedCharts, users } from '../../../../db/schema'
import { eq, sql } from 'drizzle-orm'
import { logger } from '../../../utils/logger'

/**
 * GET /api/charts/slug/:slug
 *
 * Get a chart by slug (public charts or owner's private charts)
 * Increments view count for public charts
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Slug parameter is required'
    })
  }

  // Get current user (optional - not required for public charts)
  const user = await getCurrentUser(event)

  try {
    // Get chart with author info
    const result = await db
      .select({
        id: savedCharts.id,
        userId: savedCharts.userId,
        name: savedCharts.name,
        description: savedCharts.description,
        slug: savedCharts.slug,
        chartType: savedCharts.chartType,
        chartState: savedCharts.chartState,
        thumbnailUrl: savedCharts.thumbnailUrl,
        isFeatured: savedCharts.isFeatured,
        isPublic: savedCharts.isPublic,
        viewCount: savedCharts.viewCount,
        createdAt: savedCharts.createdAt,
        updatedAt: savedCharts.updatedAt,
        author: {
          displayName: users.displayName,
          firstName: users.firstName
        }
      })
      .from(savedCharts)
      .leftJoin(users, eq(savedCharts.userId, users.id))
      .where(eq(savedCharts.slug, slug))
      .limit(1)

    const chart = result[0]

    if (!chart) {
      throw createError({
        statusCode: 404,
        message: 'Chart not found'
      })
    }

    // Check access: must be public OR user must be the owner
    if (!chart.isPublic && chart.userId !== user?.id) {
      throw createError({
        statusCode: 404,
        message: 'Chart not found'
      })
    }

    // Increment view count only for public charts (non-blocking - errors logged but don't fail request)
    let viewCountIncremented = false
    if (chart.isPublic) {
      try {
        db.update(savedCharts)
          .set({ viewCount: sql`${savedCharts.viewCount} + 1` })
          .where(eq(savedCharts.id, chart.id))
          .run()
        viewCountIncremented = true
      } catch (err) {
        // Log error but don't fail the request - view count increment is non-critical
        logger.error(
          'Failed to increment view count',
          err instanceof Error ? err : new Error(String(err)),
          { chartId: chart.id, slug: chart.slug }
        )
      }
    }

    return {
      ...chart,
      authorName: chart.author?.displayName || chart.author?.firstName || 'Anonymous',
      author: undefined, // Remove nested author object
      // Only return incremented count if update succeeded
      viewCount: viewCountIncremented ? chart.viewCount + 1 : chart.viewCount
      // userId is included for ownership checking
    }
  } catch (err) {
    if (err && typeof err === 'object' && 'statusCode' in err) {
      throw err
    }

    logger.error('Error fetching chart:', err instanceof Error ? err : new Error(String(err)))

    // If the table doesn't exist (e.g., in e2e tests without migrations),
    // return 404 as if the chart doesn't exist
    if (err && typeof err === 'object' && 'code' in err && err.code === 'SQLITE_ERROR') {
      const message = 'message' in err ? String(err.message) : ''
      if (message.includes('no such table')) {
        logger.warn('Database table not found')
        throw createError({
          statusCode: 404,
          message: 'Chart not found'
        })
      }
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to fetch chart'
    })
  }
})
