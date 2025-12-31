import { db } from '../../utils/db'
import { charts, savedCharts, users } from '../../../db/schema'
import { desc, sql, eq } from 'drizzle-orm'

/**
 * GET /api/charts/browse
 *
 * Get all charts ever created (for browsing)
 * Query params:
 * - limit: number (default 50, max 100)
 * - offset: number (default 0)
 * - sort: 'newest' | 'popular' | 'recent' (default 'newest')
 *
 * Admin users see additional author info (who saved the chart, if anyone)
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const user = await getCurrentUser(event)
  const isAdmin = user?.role === 'admin'

  const limit = Math.min(parseInt(query.limit as string) || 50, 100)
  const offset = parseInt(query.offset as string) || 0
  const sort = (query.sort as string) || 'newest'

  try {
    // Determine sort order
    let orderBy
    switch (sort) {
      case 'popular':
        orderBy = [desc(charts.accessCount), desc(charts.createdAt)]
        break
      case 'recent':
        // Most recently accessed
        orderBy = [desc(charts.lastAccessedAt), desc(charts.createdAt)]
        break
      case 'newest':
      default:
        orderBy = [desc(charts.createdAt)]
        break
    }

    // Query all charts
    const results = await db
      .select({
        id: charts.id,
        page: charts.page,
        config: charts.config,
        createCount: charts.createCount,
        accessCount: charts.accessCount,
        createdAt: charts.createdAt,
        lastAccessedAt: charts.lastAccessedAt
      })
      .from(charts)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset)

    // For admins, fetch saved chart info to show who saved each chart
    let savedByMap: Map<string, { name: string, count: number }> = new Map()
    if (isAdmin && results.length > 0) {
      const chartIds = results.map(c => c.id)
      const savedInfo = await db
        .select({
          chartId: savedCharts.chartId,
          displayName: users.displayName,
          firstName: users.firstName,
          email: users.email
        })
        .from(savedCharts)
        .leftJoin(users, eq(savedCharts.userId, users.id))
        .where(sql`${savedCharts.chartId} IN (${sql.join(chartIds.map(id => sql`${id}`), sql`, `)})`)

      // Group by chartId and get first saver + count
      const chartSavers: Map<string, { names: string[], count: number }> = new Map()
      for (const info of savedInfo) {
        const existing = chartSavers.get(info.chartId) || { names: [], count: 0 }
        const name = info.displayName || info.firstName || info.email || 'Unknown'
        existing.names.push(name)
        existing.count++
        chartSavers.set(info.chartId, existing)
      }

      savedByMap = new Map(
        Array.from(chartSavers.entries()).map(([chartId, data]) => [
          chartId,
          { name: data.names[0] || 'Unknown', count: data.count }
        ])
      )
    }

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(charts)

    const total = totalResult[0]?.count || 0

    return {
      charts: results.map(chart => ({
        ...chart,
        // Only include savedBy for admins
        savedBy: isAdmin ? savedByMap.get(chart.id) || null : undefined
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    }
  } catch (err) {
    logger.error('Error fetching charts for browse:', err instanceof Error ? err : new Error(String(err)))

    // Handle missing table gracefully
    if (err && typeof err === 'object' && 'code' in err && err.code === 'SQLITE_ERROR') {
      const message = 'message' in err ? String(err.message) : ''
      if (message.includes('no such table')) {
        return {
          charts: [],
          pagination: {
            total: 0,
            limit,
            offset,
            hasMore: false
          }
        }
      }
    }

    throw createError({
      statusCode: 500,
      message: 'Failed to fetch charts'
    })
  }
})
