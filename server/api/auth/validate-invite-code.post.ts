import { ValidateInviteCodeSchema, ValidateInviteCodeResponseSchema } from '../../schemas'
import { validateInviteCode } from '../../utils/inviteCode'

/**
 * Public API endpoint to validate an invite code
 * Does NOT consume the code - just checks if it's valid
 * Used for UX feedback on signup page
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = ValidateInviteCodeSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]!.message
    })
  }

  const { code } = result.data
  const inviteCode = await validateInviteCode(code)

  if (!inviteCode) {
    const response = {
      valid: false,
      message: 'Invalid or expired invite code'
    }
    return ValidateInviteCodeResponseSchema.parse(response)
  }

  const response = {
    valid: true,
    message: `Valid code! Grants Pro access${
      inviteCode.grantsProUntil
        ? ` until ${inviteCode.grantsProUntil.toLocaleDateString()}`
        : ''
    }`,
    grantsProUntil: inviteCode.grantsProUntil
  }

  return ValidateInviteCodeResponseSchema.parse(response)
})
