export default defineNuxtPlugin(async () => {
  const { refreshSession } = useAuth()

  // Initialize session on both server and client
  await refreshSession()
})
