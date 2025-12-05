import { eq, sql } from 'drizzle-orm'
import { db } from '../../utils/db'
import { shortUrls } from '../../../db/schema'

/**
 * GET /s/:id
 * Redirects to the stored path for the given short ID (12-char hash)
 * Stored paths are domain-agnostic (e.g., /explorer?c=USA)
 * Also increments the access count
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Missing short URL ID'
    })
  }

  // Look up the short URL
  const result = await db
    .select()
    .from(shortUrls)
    .where(eq(shortUrls.id, id))
    .limit(1)

  const entry = result[0]

  if (!entry) {
    throw createError({
      statusCode: 404,
      message: 'Short URL not found'
    })
  }

  // Increment access count and update last accessed time (non-blocking)
  db.update(shortUrls)
    .set({
      accessCount: sql`${shortUrls.accessCount} + 1`,
      lastAccessedAt: new Date()
    })
    .where(eq(shortUrls.id, id))
    .run()

  // Redirect to the stored page + query
  // fullUrl contains just the query string, page contains 'explorer' or 'ranking'
  const redirectPath = `/${entry.page}${entry.fullUrl ? `?${entry.fullUrl}` : ''}`
  return sendRedirect(event, redirectPath, 302)
})
