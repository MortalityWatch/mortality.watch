import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../utils/db'
import { shortUrls } from '../../db/schema'

const requestSchema = z.object({
  hash: z.string().length(12, 'Hash must be exactly 12 characters'),
  query: z.string(), // Query string without leading ?
  page: z.enum(['explorer', 'ranking']).default('explorer')
})

/**
 * POST /api/shorten
 * Stores a pre-computed hash → path mapping
 *
 * The hash is computed client-side (deterministic, instant).
 * This endpoint stores path only (no domain) so URLs work across environments.
 *
 * Request: { hash: string, path: string }
 * Response: { success: true }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate request
  const result = requestSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request: hash (12 chars) and path (starting with /) are required'
    })
  }

  const { hash, query, page } = result.data

  // Check if hash already exists
  const existing = await db
    .select()
    .from(shortUrls)
    .where(eq(shortUrls.id, hash))
    .limit(1)

  if (existing.length > 0) {
    // Already exists, nothing to do
    return { success: true }
  }

  // Insert new mapping (query string, page stored separately)
  await db.insert(shortUrls).values({
    id: hash,
    urlHash: hash,
    fullUrl: query,
    page
  })

  return { success: true }
})
