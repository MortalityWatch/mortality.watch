export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { user, isAdmin, refreshSession } = useAuth()

  // Refresh session if not already loaded
  if (!user.value) {
    await refreshSession()
  }

  // If not authenticated, redirect to login
  if (!user.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }

  // If not admin, redirect to home
  if (!isAdmin.value) {
    return navigateTo('/')
  }
})
