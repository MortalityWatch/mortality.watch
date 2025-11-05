import { clearChartCache } from '../../utils/chartCache'

/**
 * Admin API: Clear chart cache
 * DELETE /api/admin/cache
 *
 * Requires admin authentication
 */
export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  try {
    const result = await clearChartCache()

    if (result.error) {
      throw createError({
        statusCode: 500,
        message: `Failed to clear cache: ${result.error}`
      })
    }

    return {
      success: true,
      cleared: result.cleared,
      message: `Successfully cleared ${result.cleared} cached charts`
    }
  } catch (err) {
    logger.error('Error clearing chart cache:', err instanceof Error ? err : new Error(String(err)))
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : 'Failed to clear cache'
    })
  }
})
