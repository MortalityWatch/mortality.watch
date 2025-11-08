import { db, inviteCodes } from '#db'
import { requireAdmin } from '../../../utils/auth'
import { eq } from 'drizzle-orm'

/**
 * Admin API: Deactivate invite code
 * DELETE /api/admin/invite-codes/:id
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = parseInt(event.context.params?.id || '')
  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid invite code ID'
    })
  }

  try {
    const deactivatedCode = await db
      .update(inviteCodes)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(inviteCodes.id, id))
      .returning()
      .get()

    if (!deactivatedCode) {
      throw createError({
        statusCode: 404,
        message: 'Invite code not found'
      })
    }

    return {
      success: true,
      message: 'Invite code deactivated successfully'
    }
  } catch {
    throw createError({
      statusCode: 500,
      message: 'Failed to deactivate invite code'
    })
  }
})
