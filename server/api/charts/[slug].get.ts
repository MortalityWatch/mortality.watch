import { db } from '../../utils/db'
import { savedCharts, users } from '../../../db/schema'
import { eq, and, sql } from 'drizzle-orm'

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

    console.error('Error fetching chart:', err)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch chart'
    })
  }
})
