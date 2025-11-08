import { CreateInviteCodeSchema } from '../../../schemas'
import { db, inviteCodes } from '#db'
import { generateInviteCode } from '../../../utils/inviteCode'
import { requireAdmin } from '../../../utils/auth'

/**
 * Admin API: Create invite code
 * POST /api/admin/invite-codes
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const result = CreateInviteCodeSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]!.message
    })
  }

  const { code, maxUses, expiresAt, grantsProMonths, notes } = result.data

  // Calculate grantsProUntil from grantsProMonths if provided
  let grantsProUntil: Date | null = null
  if (grantsProMonths) {
    grantsProUntil = new Date()
    grantsProUntil.setMonth(grantsProUntil.getMonth() + grantsProMonths)
  } else if (expiresAt) {
    grantsProUntil = new Date(expiresAt)
  }

  try {
    const newCode = await db
      .insert(inviteCodes)
      .values({
        code: code.toUpperCase(),
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        grantsProUntil,
        notes: notes || null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
      .get()

    return {
      success: true,
      inviteCode: newCode,
      message: 'Invite code created successfully'
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      throw createError({
        statusCode: 400,
        message: 'An invite code with this code already exists'
      })
    }
    throw createError({
      statusCode: 500,
      message: 'Failed to create invite code'
    })
  }
})
