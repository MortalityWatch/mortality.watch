import { db, inviteCodes } from '#db'
import { requireAdmin } from '../../../utils/auth'
import { desc } from 'drizzle-orm'

/**
 * Admin API: List all invite codes
 * GET /api/admin/invite-codes
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const activeOnly = query.active === 'true'
  const unusedOnly = query.unused === 'true'

  try {
    let codes = await db
      .select()
      .from(inviteCodes)
      .orderBy(desc(inviteCodes.createdAt))
      .all()

    // Filter by active status if requested
    if (activeOnly) {
      codes = codes.filter(code => code.isActive)
    }

    // Filter by unused if requested
    if (unusedOnly) {
      codes = codes.filter(code => code.currentUses === 0)
    }

    return {
      success: true,
      inviteCodes: codes,
      total: codes.length
    }
  } catch {
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch invite codes'
    })
  }
})
