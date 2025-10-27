export default defineNuxtPlugin({
  name: 'auth',
  enforce: 'pre', // Run before other plugins and middleware
  async setup() {
    const { refreshSession } = useAuth()

    // Initialize session on both server and client
    await refreshSession()
  }
})
