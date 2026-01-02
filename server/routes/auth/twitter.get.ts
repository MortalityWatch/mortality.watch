import { handleSocialAuth } from '../../utils/auth'

export default defineOAuthXEventHandler({
  config: {
    scope: ['users.read', 'tweet.read']
  },
  async onSuccess(event, { user }) {
    // User data from X/Twitter:
    // - id: Twitter user ID
    // - username: Twitter handle
    // - name: Display name
    // - profile_image_url: Profile picture URL
    // Note: Twitter OAuth2 may not always return email depending on user settings and app permissions

    // Get email from user data if available, otherwise generate a placeholder
    // Twitter OAuth 2.0 may not return email without special permissions
    const email = user.email || `${user.id}@twitter.placeholder.local`

    // Handle the social auth (creates or updates user, sets auth cookie)
    await handleSocialAuth(
      event,
      'twitter',
      user.id,
      email,
      user.name,
      user.profile_image_url
    )

    // Redirect to home page after successful login
    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('Twitter OAuth error:', error)
    // Redirect to login page with error
    return sendRedirect(event, '/login?error=twitter_oauth_failed')
  }
})
