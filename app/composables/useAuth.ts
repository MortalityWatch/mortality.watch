import type { User } from '#db/schema'

type AuthUser = Omit<User, 'passwordHash'>

interface UseAuthReturn {
  user: Ref<AuthUser | null>
  isAuthenticated: ComputedRef<boolean>
  isAdmin: ComputedRef<boolean>
  tier: ComputedRef<0 | 1 | 2>
  loading: Ref<boolean>
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>
  signUp: (email: string, password: string, firstName: string, lastName: string, tosAccepted: boolean, inviteCode?: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: (inviteCode?: string) => void
  signInWithTwitter: (inviteCode?: string) => void
  updateProfile: (data: {
    firstName?: string
    lastName?: string
    displayName?: string
    email?: string
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
   * Sign up with email, password, firstName, lastName, TOS acceptance, and optional invite code
   */
  async function signUp(email: string, password: string, firstName: string, lastName: string, tosAccepted: boolean, inviteCode?: string) {
    loading.value = true
    try {
      const response = await $fetch<{ success: boolean, user: AuthUser }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: { email, password, firstName, lastName, tosAccepted, inviteCode }
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
   * Sign in with Google OAuth
   * Redirects to Google OAuth flow - callback will handle session creation
   * @param inviteCode - Optional invite code to apply during registration
   */
  function signInWithGoogle(inviteCode?: string) {
    // Store invite code in cookie for the OAuth callback to use
    if (inviteCode) {
      const cookie = useCookie('oauth_invite_code', {
        maxAge: 60 * 10, // 10 minutes - enough time for OAuth flow
        path: '/',
        sameSite: 'lax'
      })
      cookie.value = inviteCode
    }
    navigateTo('/auth/google', { external: true })
  }

  /**
   * Sign in with Twitter/X OAuth
   * Redirects to Twitter OAuth flow - callback will handle session creation
   * @param inviteCode - Optional invite code to apply during registration
   */
  function signInWithTwitter(inviteCode?: string) {
    // Store invite code in cookie for the OAuth callback to use
    if (inviteCode) {
      const cookie = useCookie('oauth_invite_code', {
        maxAge: 60 * 10, // 10 minutes - enough time for OAuth flow
        path: '/',
        sameSite: 'lax'
      })
      cookie.value = inviteCode
    }
    navigateTo('/auth/twitter', { external: true })
  }

  /**
   * Update user profile
   */
  async function updateProfile(data: {
    firstName?: string
    lastName?: string
    displayName?: string
    email?: string
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
   * Uses useRequestFetch for SSR cookie forwarding, $fetch for client-side
   */
  async function refreshSession() {
    loading.value = true
    try {
      // Use useRequestFetch on server to forward cookies, $fetch on client
      const fetchFn = import.meta.server ? useRequestFetch() : $fetch
      const response = await fetchFn<{
        user: AuthUser | null
        authenticated: boolean
      }>('/api/auth/session')
      user.value = response?.user || null
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
    signInWithGoogle,
    signInWithTwitter,
    updateProfile,
    forgotPassword,
    resetPassword,
    refreshSession
  }
}
