import { eq, sql } from 'drizzle-orm'
import { db } from '../../utils/db'
import { charts } from '../../../db/schema'

/**
 * GET /s/:id
 * Redirects to the stored chart config for the given ID (12-char hash)
 * Also increments the access count
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
      message: 'Chart not found'
    })
  }

  // Increment access count and update last accessed time (non-blocking)
  db.update(charts)
    .set({
      accessCount: sql`${charts.accessCount} + 1`,
      lastAccessedAt: new Date()
    })
    .where(eq(charts.id, id))
    .run()

  // Redirect to the stored page + config
  const redirectPath = `/${entry.page}${entry.config ? `?${entry.config}` : ''}`
  return sendRedirect(event, redirectPath, 302)
})
