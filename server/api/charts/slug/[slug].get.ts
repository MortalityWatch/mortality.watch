import { db } from '../../../utils/db'
import { savedCharts, users, charts } from '../../../../db/schema'
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
    // Get chart with author info and chart config
    const result = await db
      .select({
        id: savedCharts.id,
        userId: savedCharts.userId,
        chartId: savedCharts.chartId,
        name: savedCharts.name,
        description: savedCharts.description,
        slug: savedCharts.slug,
        thumbnailUrl: savedCharts.thumbnailUrl,
        isFeatured: savedCharts.isFeatured,
        isPublic: savedCharts.isPublic,
        viewCount: savedCharts.viewCount,
        createdAt: savedCharts.createdAt,
        updatedAt: savedCharts.updatedAt,
        author: {
          displayName: users.displayName,
          firstName: users.firstName
        },
        chart: {
          config: charts.config,
          page: charts.page
        }
      })
      .from(savedCharts)
      .leftJoin(users, eq(savedCharts.userId, users.id))
      .leftJoin(charts, eq(savedCharts.chartId, charts.id))
      .where(eq(savedCharts.slug, slug))
      .limit(1)

    const savedChart = result[0]

    if (!savedChart) {
      throw createError({
        statusCode: 404,
        message: 'Chart not found'
      })
    }

    // Check access: must be public OR user must be the owner
    if (!savedChart.isPublic && savedChart.userId !== user?.id) {
      throw createError({
        statusCode: 404,
        message: 'Chart not found'
      })
    }

    // Increment view count only for public charts (non-blocking - errors logged but don't fail request)
    let viewCountIncremented = false
    if (savedChart.isPublic) {
      try {
        db.update(savedCharts)
          .set({ viewCount: sql`${savedCharts.viewCount} + 1` })
          .where(eq(savedCharts.id, savedChart.id))
          .run()
        viewCountIncremented = true
      } catch (err) {
        // Log error but don't fail the request - view count increment is non-critical
        logger.error(
          'Failed to increment view count',
          err instanceof Error ? err : new Error(String(err)),
          { chartId: savedChart.id, slug: savedChart.slug }
        )
      }
    }

    // Build response with chartState for backwards compatibility
    // The charts.config is a query string, charts.page is the page type
    const chartType = savedChart.chart?.page || 'explorer'
    const config = savedChart.chart?.config || ''

    return {
      id: savedChart.id,
      userId: savedChart.userId,
      chartId: savedChart.chartId,
      name: savedChart.name,
      description: savedChart.description,
      slug: savedChart.slug,
      chartType,
      // Return config as query string - client will use this to redirect
      chartConfig: config,
      thumbnailUrl: savedChart.thumbnailUrl,
      isFeatured: savedChart.isFeatured,
      isPublic: savedChart.isPublic,
      viewCount: viewCountIncremented ? savedChart.viewCount + 1 : savedChart.viewCount,
      createdAt: savedChart.createdAt,
      updatedAt: savedChart.updatedAt,
      authorName: savedChart.author?.displayName || savedChart.author?.firstName || 'Anonymous'
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
