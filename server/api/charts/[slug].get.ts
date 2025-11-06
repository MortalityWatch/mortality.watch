import { db } from '../../utils/db'
import { savedCharts, users } from '../../../db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { logger } from '../../utils/logger'

/**
 * GET /api/charts/:slug
 *
 * Get a specific public chart by slug and increment view count
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Slug parameter is required'
    })
  }

  try {
    // Get chart with author info
    const result = await db
      .select({
        id: savedCharts.id,
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
      .where(
        and(
          eq(savedCharts.slug, slug),
          eq(savedCharts.isPublic, true)
        )
      )
      .limit(1)

    const chart = result[0]

    if (!chart) {
      throw createError({
        statusCode: 404,
        message: 'Chart not found'
      })
    }

    // Increment view count (async, non-blocking)
    db.update(savedCharts)
      .set({ viewCount: sql`${savedCharts.viewCount} + 1` })
      .where(eq(savedCharts.id, chart.id))
      .run()

    return {
      ...chart,
      authorName: chart.author?.displayName || chart.author?.firstName || 'Anonymous',
      author: undefined // Remove nested author object
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
