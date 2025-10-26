export default defineNuxtRouteMiddleware((to, _from) => {
  const { isAuthenticated } = useAuth()

  // If not authenticated, redirect to login
  // Session is already loaded by the auth plugin
  if (!isAuthenticated.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})
