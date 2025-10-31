import { requireAdmin } from '~/server/utils/auth'
import { checkDataStaleness } from '~/server/tasks/check-data-staleness'

/**
 * Admin API: Manually trigger data staleness check
 * POST /api/admin/check-staleness
 *
 * Requires admin authentication
 * Manually runs the staleness check and sends alerts if needed
 */
export default defineEventHandler(async (event) => {
  // Require admin authentication
  await requireAdmin(event)

  try {
    const result = await checkDataStaleness()

    return {
      success: true,
      ...result
    }
  } catch (err) {
    console.error('Error running staleness check:', err)
    throw createError({
      statusCode: 500,
      message: err instanceof Error ? err.message : 'Failed to run staleness check'
    })
  }
})
