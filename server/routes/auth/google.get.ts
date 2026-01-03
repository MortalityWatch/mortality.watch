import { handleSocialAuth } from '../../utils/auth'

export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['openid', 'email', 'profile']
  },
  async onSuccess(event, { user }) {
    // User data from Google:
    // - sub: Google user ID
    // - email: User's email
    // - name: User's display name
    // - picture: User's profile picture URL
    // - email_verified: Whether email is verified

    if (!user.email) {
      throw createError({
        statusCode: 400,
        message: 'Email is required for registration'
      })
    }

    // Get invite code from cookie (set by frontend before OAuth redirect)
    const inviteCode = getCookie(event, 'oauth_invite_code')
    // Clear the invite code cookie after reading
    if (inviteCode) {
      deleteCookie(event, 'oauth_invite_code')
    }

    // Handle the social auth (creates or updates user, sets auth cookie)
    await handleSocialAuth(
      event,
      'google',
      user.sub,
      user.email,
      user.name,
      user.picture,
      inviteCode || undefined
    )

    // Redirect to home page after successful login
    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    // Clear invite code cookie on error
    deleteCookie(event, 'oauth_invite_code')
    // Redirect to login page with error
    return sendRedirect(event, '/login?error=google_oauth_failed')
  }
})
