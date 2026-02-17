import { inflate } from 'node:zlib'
import { promisify } from 'node:util'
import { migrateLegacyParams } from '../../../app/lib/url/legacyParams'

const inflateAsync = promisify(inflate)

/**
 * GET /chart/?qr=...
 *
 * Legacy redirect: old chart URLs encoded state as base64+zlib JSON in a `qr` parameter.
 * Decodes the JSON and redirects to /explorer with the equivalent query string.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const qr = query.qr

  if (typeof qr !== 'string' || !qr) {
    throw createError({
      statusCode: 400,
      message: 'Missing or invalid qr parameter'
    })
  }

  try {
    // Decode base64 (URL-safe) → zlib inflate → JSON parse
    const compressed = Buffer.from(qr, 'base64')
    const decompressed = await inflateAsync(compressed)
    const params = JSON.parse(decompressed.toString('utf-8'))

    // Build query string from decoded JSON keys
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value))
      }
    }

    // Apply legacy parameter migration (e.g., bdf→bf, cum→ce)
    const migrated = migrateLegacyParams(searchParams.toString())

    return sendRedirect(event, `/explorer?${migrated}`, 301)
  } catch {
    throw createError({
      statusCode: 400,
      message: 'Invalid qr parameter: could not decode chart state'
    })
  }
})
