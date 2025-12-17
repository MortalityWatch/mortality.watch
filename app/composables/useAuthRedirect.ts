/**
 * Composable for handling auth redirects
 *
 * Provides URLs to login/signup pages that include the current page as a
 * redirect parameter, so users return to their original location after auth.
 */
export function useAuthRedirect() {
  const route = useRoute()

  /**
   * Get login URL with current page as redirect
   * Excludes auth pages from redirect to avoid loops
   */
  const loginUrl = computed(() => {
    const currentPath = route.fullPath
    // Don't redirect back to auth pages
    const authPages = ['/login', '/signup', '/forgot-password', '/reset-password', '/check-email', '/verify-email']
    const isAuthPage = authPages.some(page => currentPath.startsWith(page))

    if (isAuthPage || currentPath === '/') {
      return '/login'
    }

    return `/login?redirect=${encodeURIComponent(currentPath)}`
  })

  /**
   * Get signup URL with current page as redirect
   * Excludes auth pages from redirect to avoid loops
   */
  const signupUrl = computed(() => {
    const currentPath = route.fullPath
    // Don't redirect back to auth pages
    const authPages = ['/login', '/signup', '/forgot-password', '/reset-password', '/check-email', '/verify-email']
    const isAuthPage = authPages.some(page => currentPath.startsWith(page))

    if (isAuthPage || currentPath === '/') {
      return '/signup'
    }

    return `/signup?redirect=${encodeURIComponent(currentPath)}`
  })

  /**
   * Navigate to login with redirect
   */
  function goToLogin() {
    return navigateTo(loginUrl.value)
  }

  /**
   * Navigate to signup with redirect
   */
  function goToSignup() {
    return navigateTo(signupUrl.value)
  }

  return {
    loginUrl,
    signupUrl,
    goToLogin,
    goToSignup
  }
}
