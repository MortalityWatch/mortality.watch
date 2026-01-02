import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { db } from '../utils/db'
import { charts } from '../../db/schema'

const requestSchema = z.object({
  hash: z.string().length(12, 'Hash must be exactly 12 characters'),
  query: z.string(), // Query string without leading ?
  page: z.enum(['explorer', 'ranking']).default('explorer')
})

/**
 * POST /api/shorten
 * Stores a pre-computed hash → config mapping in the charts table
 *
 * The hash is computed client-side (deterministic, instant).
 * This endpoint stores config only (no domain) so URLs work across environments.
 *
 * Request: { hash: string, query: string, page: string }
 * Response: { success: true }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validate request
  const result = requestSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request: hash (12 chars) and query are required'
    })
  }

  const { hash, query, page } = result.data

  // Check if hash already exists
  const existing = await db
    .select()
    .from(charts)
    .where(eq(charts.id, hash))
    .limit(1)

  if (existing.length > 0) {
    // Already exists - increment accessCount to track views from Explorer/Ranking pages
    await db
      .update(charts)
      .set({ accessCount: sql`${charts.accessCount} + 1` })
      .where(eq(charts.id, hash))
    return { success: true }
  }

  // Insert new chart config
  await db.insert(charts).values({
    id: hash,
    config: query,
    page
  })

  return { success: true }
})
