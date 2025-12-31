import { db } from '../../../utils/db'
import { savedCharts } from '../../../../db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * GET /api/charts/mine/:hash
 *
 * Check if the authenticated user has a saved chart with the given hash (chartId).
 * Returns the saved chart if found, or null if not.
 *
 * Used by explorer to detect if current state is already saved (show "Update" vs "Save").
 */
export default defineEventHandler(async (event) => {
  // Require authentication
  const user = await requireAuth(event)

  const hash = getRouterParam(event, 'hash')
  if (!hash) {
    throw createError({
      statusCode: 400,
      message: 'Chart hash is required'
    })
  }

  // Check if user has a saved chart with this hash
  const result = await db
    .select({
      id: savedCharts.id,
      slug: savedCharts.slug,
      name: savedCharts.name,
      createdAt: savedCharts.createdAt
    })
    .from(savedCharts)
    .where(
      and(
        eq(savedCharts.userId, user.id),
        eq(savedCharts.chartId, hash)
      )
    )
    .limit(1)

  // Return null if not found (this is expected behavior, not an error)
  return result[0] || null
})
