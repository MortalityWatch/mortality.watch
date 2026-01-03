/**
 * Returns which OAuth providers are configured and available
 * This allows the frontend to conditionally show/hide OAuth buttons
 */
export default defineEventHandler(() => {
  // Check if OAuth credentials are configured
  // nuxt-auth-utils uses NUXT_OAUTH_<PROVIDER>_CLIENT_ID format
  const googleEnabled = !!(
    process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID
    && process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET
  )

  const twitterEnabled = !!(
    process.env.NUXT_OAUTH_X_CLIENT_ID
    && process.env.NUXT_OAUTH_X_CLIENT_SECRET
  )

  return {
    google: googleEnabled,
    twitter: twitterEnabled
  }
})
