import { clearAuthToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // Clear auth token cookie
  clearAuthToken(event)

  return {
    success: true,
    message: 'Signed out successfully'
  }
})
