import { eq, sql } from 'drizzle-orm'
import { db } from '../../utils/db'
import { charts } from '../../../db/schema'
import { migrateLegacyParams } from '../../../app/lib/url/legacyParams'

/**
 * GET /s/:id
 * Redirects to the stored chart config for the given ID (12-char hash)
 * Also increments the access count
 *
 * Handles legacy URL formats:
 * - Migrates old parameter names (bdf→bf, cum→ce, etc.)
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || !/^[0-9a-f]{12}$/.test(id)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid chart ID'
    })
  }

  // Look up the chart
  const result = await db
    .select()
    .from(charts)
    .where(eq(charts.id, id))
    .limit(1)

  const entry = result[0]

  if (!entry) {
    throw createError({
      statusCode: 404,
      message: `Chart with ID "${id}" not found. The chart may have been deleted or the link may be invalid.`
    })
  }

  // Increment access count and update last accessed time (non-blocking)
  // Note: savedCharts.viewCount is incremented by /api/shorten when Explorer/Ranking loads
  db.update(charts)
    .set({
      accessCount: sql`${charts.accessCount} + 1`,
      lastAccessedAt: new Date()
    })
    .where(eq(charts.id, id))
    .run()

  // Migrate legacy URL parameters to current format
  const migratedConfig = entry.config ? migrateLegacyParams(entry.config) : ''

  // Redirect to the stored page + migrated config
  const redirectPath = `/${entry.page}${migratedConfig ? `?${migratedConfig}` : ''}`
  return sendRedirect(event, redirectPath, 302)
})
