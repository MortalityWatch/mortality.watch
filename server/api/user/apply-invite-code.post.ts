import { ApplyInviteCodeSchema } from '../../schemas'
import { applyInviteCodeToUser } from '../../utils/inviteCode'
import { requireAuth } from '../../utils/auth'

/**
 * API endpoint for retroactive invite code application
 * Allows existing users to apply an invite code to upgrade to Pro
 */
export default defineEventHandler(async (event) => {
  // Require authentication
  const user = await requireAuth(event)

  const body = await readBody(event)
  const result = ApplyInviteCodeSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]!.message
    })
  }

  const { code } = result.data
  const applyResult = await applyInviteCodeToUser(user.id, code)

  if (!applyResult.success) {
    throw createError({
      statusCode: 400,
      message: applyResult.message
    })
  }

  return {
    success: true,
    message: applyResult.message
  }
})
