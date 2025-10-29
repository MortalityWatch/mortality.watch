import { db } from '../../utils/db'
import { savedCharts, users } from '../../../db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'

/**
 * GET /api/charts
 *
 * Get public charts for gallery
 * Optional query params:
 * - featured: true/false (filter by featured status)
 * - chartType: 'explorer' | 'ranking'
 * - limit: number (default 50)
 * - offset: number (default 0)
 * - sort: 'newest' | 'views' | 'featured' (default 'featured')
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const limit = Math.min(parseInt(query.limit as string) || 50, 100)
  const offset = parseInt(query.offset as string) || 0
  const featured = query.featured === 'true' ? true : query.featured === 'false' ? false : undefined
  const chartType = query.chartType as 'explorer' | 'ranking' | undefined
  const sort = (query.sort as string) || 'featured'

  try {
    // Build where conditions
    const conditions = [eq(savedCharts.isPublic, true)]

    if (featured !== undefined) {
      conditions.push(eq(savedCharts.isFeatured, featured))
    }

    if (chartType) {
      conditions.push(eq(savedCharts.chartType, chartType))
    }

    // Determine sort order
    let orderBy
    switch (sort) {
      case 'views':
        orderBy = [desc(savedCharts.viewCount), desc(savedCharts.createdAt)]
        break
      case 'newest':
        orderBy = [desc(savedCharts.createdAt)]
        break
      case 'featured':
      default:
        orderBy = [desc(savedCharts.isFeatured), desc(savedCharts.viewCount), desc(savedCharts.createdAt)]
        break
    }

    // Query with join to get author info
    const charts = await db
      .select({
        id: savedCharts.id,
        name: savedCharts.name,
        description: savedCharts.description,
        slug: savedCharts.slug,
        chartType: savedCharts.chartType,
        chartState: savedCharts.chartState,
        thumbnailUrl: savedCharts.thumbnailUrl,
        isFeatured: savedCharts.isFeatured,
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
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset)

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(savedCharts)
      .where(and(...conditions))

    const total = totalResult[0]?.count || 0

    return {
      charts: charts.map(chart => ({
        ...chart,
        authorName: chart.author?.displayName || chart.author?.firstName || 'Anonymous',
        author: undefined // Remove nested author object
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }
  } catch (err) {
    console.error('Error fetching public charts:', err)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch charts'
    })
  }
})
