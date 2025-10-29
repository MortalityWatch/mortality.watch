import { clearChartCache } from '../../utils/chartCache'

/**
 * Admin API: Clear chart cache
 * DELETE /api/admin/cache
 *
 * Requires admin authentication
 */
export default defineEventHandler(async (_event) => {
  // TODO: Add admin authentication check when auth is implemented
  // const user = await requireAuth(event)
  // if (user.role !== 'admin') {
  //   throw createError({ statusCode: 403, message: 'Admin access required' })
  // }

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
    console.error('Error clearing chart cache:', err)
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : 'Failed to clear cache'
    })
  }
})
