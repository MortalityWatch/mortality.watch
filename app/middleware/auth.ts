export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { user, refreshSession } = useAuth()

  // Refresh session if not already loaded
  if (!user.value) {
    await refreshSession()
  }

  // If still not authenticated, redirect to signin
  if (!user.value) {
    return navigateTo({
      path: '/auth/signin',
      query: { redirect: to.fullPath }
    })
  }
})
