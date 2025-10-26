import { getCurrentUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)

  if (!user) {
    return {
      user: null,
      authenticated: false
    }
  }

  return {
    user,
    authenticated: true
  }
})
