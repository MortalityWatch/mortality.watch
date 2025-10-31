import { getCacheStats } from '../../utils/chartCache'

/**
 * Admin API: Get chart cache statistics
 * GET /api/admin/cache
 *
 * Requires admin authentication
 */
export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  try {
    const stats = await getCacheStats()

    return {
      success: true,
      stats: {
        count: stats.count,
        totalSize: stats.totalSize,
        totalSizeMB: (stats.totalSize / 1024 / 1024).toFixed(2),
        oldestEntry: stats.oldestEntry
          ? new Date(stats.oldestEntry).toISOString()
          : null,
        newestEntry: stats.newestEntry
          ? new Date(stats.newestEntry).toISOString()
          : null
      }
    }
  } catch (err) {
    console.error('Error getting cache stats:', err)
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : 'Failed to get cache stats'
    })
  }
})
