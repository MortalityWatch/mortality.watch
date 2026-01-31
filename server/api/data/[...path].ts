import { readFileSync, existsSync } from 'fs'
import { join, resolve, normalize } from 'path'
import { CACHE_CONFIG } from '../../../app/lib/config/constants'

const S3_BASE = 'https://s3.mortality.watch/data/mortality'
const CACHE_DIR = CACHE_CONFIG.MORTALITY_DATA_DIR

// Allowed patterns for data paths:
// - world_meta.csv (metadata file)
// - {country}/{chartType}.csv (e.g., USA/weekly.csv)
// - {country}/{chartType}_{ageGroup}.csv (e.g., USA/weekly_0-14.csv, USA/weekly_85+.csv)
// - {jurisdiction}/{chartType}.csv (e.g., USA-FL/weekly.csv for sub-country jurisdictions)
// - UK regional codes: GBRTENW (England & Wales), GBR_SCO (Scotland), GBR_NIR (Northern Ireland)
const VALID_PATH_PATTERN = /^(?:world_meta\.csv|(?:[A-Z]{2,3}(?:-[A-Z]{2,3})?|GBR(?:TENW|_[A-Z]{3}))\/[a-z]+(?:_[\w+-]+)?\.csv)$/

/**
 * Validates and sanitizes the path parameter to prevent path traversal attacks.
 * Returns the sanitized path or throws an error if invalid.
 */
function validatePath(path: string): string {
  // Normalize the path to resolve any . or .. segments
  const normalized = normalize(path)

  // Reject paths with directory traversal attempts
  if (normalized.includes('..') || normalized.startsWith('/') || normalized.startsWith('\\')) {
    throw createError({
      statusCode: 400,
      message: 'Invalid path: directory traversal not allowed'
    })
  }

  // Reject paths with null bytes (common attack vector)
  if (path.includes('\0')) {
    throw createError({
      statusCode: 400,
      message: 'Invalid path: null bytes not allowed'
    })
  }

  // Validate against allowed pattern
  if (!VALID_PATH_PATTERN.test(normalized)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid path format'
    })
  }

  return normalized
}

export default defineEventHandler(async (event) => {
  const rawPath = getRouterParam(event, 'path')

  if (!rawPath) {
    throw createError({
      statusCode: 400,
      message: 'Path parameter is required'
    })
  }

  // Validate and sanitize the path
  const path = validatePath(rawPath)

  const config = useRuntimeConfig()
  const isDev = process.env.NODE_ENV === 'development'
  // Nuxt may convert 'true' string to boolean true at runtime, so check both types
  const configValue = config.public.useLocalCache as unknown
  const useLocalCacheOnly = configValue === true || configValue === 'true'

  // Check local files only when USE_LOCAL_CACHE=true (offline dev mode)
  if (useLocalCacheOnly) {
    const localPath = join(CACHE_DIR, path)

    // Additional safety check: ensure resolved path is within cache directory
    const resolvedPath = resolve(localPath)
    const resolvedCacheDir = resolve(CACHE_DIR)
    if (!resolvedPath.startsWith(resolvedCacheDir + '/')) {
      throw createError({
        statusCode: 400,
        message: 'Invalid path: access denied'
      })
    }

    if (existsSync(localPath)) {
      try {
        const data = readFileSync(localPath, 'utf-8')
        setResponseHeaders(event, {
          'Content-Type': 'text/csv',
          'Cache-Control': 'public, max-age=3600'
        })
        return data
      } catch (error) {
        logger.error(`Error reading local file ${localPath}:`, error instanceof Error ? error : new Error(String(error)))
      }
    }

    throw createError({
      statusCode: 404,
      message: `Local file not found: ${path}. Run 'npm run download-data' to cache data locally.`
    })
  }

  // Production: Fetch directly from S3 (no server-side caching to avoid stale data)
  // Browser caching via Cache-Control headers handles client-side caching

  // Fetch from S3
  const s3Url = `${S3_BASE}/${path}`

  try {
    const response = await fetch(s3Url, {
      signal: AbortSignal.timeout(30000) // 30 second timeout
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: `Failed to fetch data from S3: ${response.statusText}`
      })
    }

    const data = await response.text()

    setResponseHeaders(event, {
      'Content-Type': 'text/csv',
      'Cache-Control': isDev ? 'public, max-age=3600' : 'public, max-age=86400'
    })

    return data
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw createError({
        statusCode: 504,
        message: 'Request timeout while fetching data from S3'
      })
    }
    throw createError({
      statusCode: 500,
      message: `Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
})
