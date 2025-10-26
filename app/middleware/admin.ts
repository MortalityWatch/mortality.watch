export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { user, isAdmin, refreshSession } = useAuth()

  // Refresh session if not already loaded
  if (!user.value) {
    await refreshSession()
  }

  // If not authenticated, redirect to signin
  if (!user.value) {
    return navigateTo({
      path: '/auth/signin',
      query: { redirect: to.fullPath }
    })
  }

  // If not admin, redirect to home
  if (!isAdmin.value) {
    return navigateTo('/')
  }
})
