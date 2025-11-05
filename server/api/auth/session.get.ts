import { getCurrentUser } from '../../utils/auth'
import { SessionResponseSchema } from '../../schemas'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)

  if (!user) {
    const response = {
      user: null,
      authenticated: false
    }
    return SessionResponseSchema.parse(response)
  }

  const response = {
    user,
    authenticated: true
  }
  return SessionResponseSchema.parse(response)
})
