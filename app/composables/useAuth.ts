import type { User } from '#db/schema'

type AuthUser = Omit<User, 'passwordHash'>

interface UseAuthReturn {
  user: Ref<AuthUser | null>
  isAuthenticated: ComputedRef<boolean>
  isAdmin: ComputedRef<boolean>
  tier: ComputedRef<0 | 1 | 2>
  loading: Ref<boolean>
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>
  signUp: (email: string, password: string, firstName: string, lastName: string, tosAccepted: boolean) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: {
    firstName?: string
    lastName?: string
    displayName?: string
    currentPassword?: string
    newPassword?: string
  }) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  refreshSession: () => Promise<void>
}

/**
 * Auth composable for managing authentication state
 */
export function useAuth(): UseAuthReturn {
  const user = useState<AuthUser | null>('auth_user', () => null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const tier = computed<0 | 1 | 2>(() => {
    if (!user.value) return 0
    return user.value.tier as 0 | 1 | 2
  })

  /**
   * Sign in with email and password
   */
  async function signIn(email: string, password: string, remember: boolean = false) {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean, user: AuthUser }>(
        '/api/auth/signin',
        {
          method: 'POST',
          body: { email, password, remember }
        }
      )
      user.value = response.user
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign up with email, password, firstName, lastName, and TOS acceptance
   */
  async function signUp(email: string, password: string, firstName: string, lastName: string, tosAccepted: boolean) {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean, user: AuthUser }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: { email, password, firstName, lastName, tosAccepted }
        }
      )
      user.value = response.user
    } finally {
      loading.value = false
    }
  }

  /**
   * Sign out
   */
  async function signOut() {
    loading.value = true
    try {
      await $fetch('/api/auth/signout', { method: 'POST' })
      user.value = null
      // Redirect to home
      await navigateTo('/')
    } finally {
      loading.value = false
    }
  }

  /**
   * Update user profile
   */
  async function updateProfile(data: {
    firstName?: string
    lastName?: string
    displayName?: string
    currentPassword?: string
    newPassword?: string
  }) {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean, user: AuthUser }>(
        '/api/user/profile',
        {
          method: 'PATCH',
          body: data
        }
      )
      user.value = response.user
    } finally {
      loading.value = false
    }
  }

  /**
   * Request password reset
   */
  async function forgotPassword(email: string) {
    loading.value = true
    try {
      await $fetch('/api/auth/forgot-password', {
        method: 'POST',
        body: { email }
      })
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset password with token
   */
  async function resetPassword(token: string, password: string) {
    loading.value = true
    try {
      await $fetch<{ success: boolean }>('/api/auth/reset-password', {
        method: 'POST',
        body: { token, password }
      })
      // Refresh session after password reset
      await refreshSession()
    } finally {
      loading.value = false
    }
  }

  /**
   * Refresh session from server
   * Uses useFetch to properly forward cookies during SSR
   */
  async function refreshSession() {
    loading.value = true
    try {
      const { data } = await useFetch<{
        user: AuthUser | null
        authenticated: boolean
      }>('/api/auth/session', {
        // Force fetch on every call, don't use cached data
        key: `session-${Date.now()}`
      })
      user.value = data.value?.user || null
    } catch {
      // Session check failed, user is not authenticated
      user.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    isAuthenticated,
    isAdmin,
    tier,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    forgotPassword,
    resetPassword,
    refreshSession
  }
}
