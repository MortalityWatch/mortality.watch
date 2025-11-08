import { UpdateInviteCodeSchema } from '../../../schemas'
import { db, inviteCodes } from '#db'
import { requireAdmin } from '../../../utils/auth'
import { eq } from 'drizzle-orm'

/**
 * Admin API: Update invite code
 * PATCH /api/admin/invite-codes/:id
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

  const body = await readBody(event)
  const result = UpdateInviteCodeSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]!.message
    })
  }

  const updates: any = { updatedAt: new Date() }

  if (result.data.isActive !== undefined) {
    updates.isActive = result.data.isActive
  }
  if (result.data.maxUses !== undefined) {
    updates.maxUses = result.data.maxUses
  }
  if (result.data.expiresAt !== undefined) {
    updates.expiresAt = result.data.expiresAt ? new Date(result.data.expiresAt) : null
  }
  if (result.data.notes !== undefined) {
    updates.notes = result.data.notes
  }

  try {
    const updatedCode = await db
      .update(inviteCodes)
      .set(updates)
      .where(eq(inviteCodes.id, id))
      .returning()
      .get()

    if (!updatedCode) {
      throw createError({
        statusCode: 404,
        message: 'Invite code not found'
      })
    }

    return {
      success: true,
      inviteCode: updatedCode,
      message: 'Invite code updated successfully'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to update invite code'
    })
  }
})
