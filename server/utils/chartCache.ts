import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

/**
 * Chart filesystem cache for rendered PNG images
 * Implements 7-day TTL caching strategy for Phase 10
 */

const CACHE_DIR = '.data/cache/charts'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

// Unused for now but kept for future potential use
// interface CacheEntry {
//   buffer: Buffer
//   timestamp: number
//   key: string
// }

/**
 * Generate cache key from chart state
 */
export function generateCacheKey(queryParams: Record<string, unknown>): string {
  // Sort keys for consistent hashing
  const sortedParams = Object.keys(queryParams)
    .sort()
    .reduce((acc, key) => {
      acc[key] = queryParams[key]
      return acc
    }, {} as Record<string, unknown>)

  const paramsString = JSON.stringify(sortedParams)
  const hash = createHash('sha256').update(paramsString).digest('hex')
  return hash
}

/**
 * Ensure cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true })
  } catch (err) {
    console.error('Failed to create cache directory:', err)
  }
}

/**
 * Get cached chart if available and not expired
 */
export async function getCachedChart(cacheKey: string): Promise<Buffer | null> {
  try {
    const filePath = join(CACHE_DIR, `${cacheKey}.png`)
    const stats = await fs.stat(filePath)

    // Check if cache entry is expired
    const age = Date.now() - stats.mtimeMs
    if (age > CACHE_TTL) {
      // Cache expired, delete it
      await fs.unlink(filePath).catch(() => {})
      return null
    }

    // Read and return cached buffer
    const buffer = await fs.readFile(filePath)
    return buffer
  } catch {
    // File doesn't exist or error reading - return null
    return null
  }
}

/**
 * Save rendered chart to filesystem cache
 */
export async function saveCachedChart(
  cacheKey: string,
  buffer: Buffer
): Promise<void> {
  try {
    await ensureCacheDir()
    const filePath = join(CACHE_DIR, `${cacheKey}.png`)
    await fs.writeFile(filePath, buffer)
  } catch (err) {
    console.error('Failed to save chart to cache:', err)
    // Non-fatal error - just log it
  }
}

/**
 * Clear all cached charts (for admin cache clear)
 */
export async function clearChartCache(): Promise<{ cleared: number, error?: string }> {
  try {
    await ensureCacheDir()
    const files = await fs.readdir(CACHE_DIR)
    const pngFiles = files.filter(f => f.endsWith('.png'))

    let cleared = 0
    for (const file of pngFiles) {
      try {
        await fs.unlink(join(CACHE_DIR, file))
        cleared++
      } catch {
        console.error(`Failed to delete cached file ${file}`)
      }
    }

    return { cleared }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    return { cleared: 0, error }
  }
}

/**
 * Clear expired cache entries (runs periodically)
 */
export async function clearExpiredCache(): Promise<{ cleared: number }> {
  try {
    await ensureCacheDir()
    const files = await fs.readdir(CACHE_DIR)
    const pngFiles = files.filter(f => f.endsWith('.png'))

    let cleared = 0
    for (const file of pngFiles) {
      try {
        const filePath = join(CACHE_DIR, file)
        const stats = await fs.stat(filePath)
        const age = Date.now() - stats.mtimeMs

        if (age > CACHE_TTL) {
          await fs.unlink(filePath)
          cleared++
        }
      } catch {
        // Ignore errors for individual files
      }
    }

    return { cleared }
  } catch {
    return { cleared: 0 }
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  count: number
  totalSize: number
  oldestEntry: number | null
  newestEntry: number | null
}> {
  try {
    await ensureCacheDir()
    const files = await fs.readdir(CACHE_DIR)
    const pngFiles = files.filter(f => f.endsWith('.png'))

    let totalSize = 0
    let oldestEntry: number | null = null
    let newestEntry: number | null = null

    for (const file of pngFiles) {
      try {
        const filePath = join(CACHE_DIR, file)
        const stats = await fs.stat(filePath)
        totalSize += stats.size

        if (oldestEntry === null || stats.mtimeMs < oldestEntry) {
          oldestEntry = stats.mtimeMs
        }
        if (newestEntry === null || stats.mtimeMs > newestEntry) {
          newestEntry = stats.mtimeMs
        }
      } catch {
        // Ignore errors for individual files
      }
    }

    return {
      count: pngFiles.length,
      totalSize,
      oldestEntry,
      newestEntry
    }
  } catch {
    return {
      count: 0,
      totalSize: 0,
      oldestEntry: null,
      newestEntry: null
    }
  }
}
