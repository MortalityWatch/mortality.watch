<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Sign up',
  description: 'Create an account to get started'
})

const { signUp } = useAuth()
const router = useRouter()
const route = useRoute()
const { formError, handleAuthError, clearError } = useAuthError()
const { withRetry } = useErrorRecovery()
const { trackSignup } = useAnalytics()
const config = useRuntimeConfig()
const freeTrialDays = config.public.freeTrialDays
const tosAccepted = ref(false)

// Preserve redirect URL through signup flow
const redirectUrl = computed(() => route.query.redirect as string || '')
const loginUrlWithRedirect = computed(() =>
  redirectUrl.value ? `/login?redirect=${encodeURIComponent(redirectUrl.value)}` : '/login'
)

// Invite code handling
const inviteCode = ref<string | null>(null)
const inviteCodeValidating = ref(false)
const inviteCodeInfo = ref<{ valid: boolean, message?: string, grantsProUntil?: string } | null>(null)

// Check for invite code in URL params
onMounted(async () => {
  const code = route.query.code as string | undefined
  if (code) {
    inviteCode.value = code
    await validateInviteCode(code)
  }
})

async function validateInviteCode(code: string) {
  if (!code) return

  inviteCodeValidating.value = true
  try {
    const result = await $fetch<{ valid: boolean, message?: string, grantsProUntil?: string }>('/api/auth/validate-invite-code', {
      method: 'POST',
      body: { code }
    })
    inviteCodeInfo.value = result
  } catch {
    inviteCodeInfo.value = { valid: false, message: 'Invalid invite code' }
  } finally {
    inviteCodeValidating.value = false
  }
}

const fields = [{
  name: 'email',
  type: 'text' as const,
  label: 'Email',
  placeholder: 'Enter your email',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password' as const,
  placeholder: 'Enter your password',
  required: true
}]

const schema = z.object({
  email: z.preprocess(
    val => val || '',
    z.string().min(1, 'Email is required').email('Invalid email')
  ),
  password: z.preprocess(
    val => val || '',
    z.string().min(1, 'Password is required').min(8, 'Must be at least 8 characters')
  )
})

type Schema = z.output<typeof schema>

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  clearError()

  // Validate TOS acceptance
  if (!tosAccepted.value) {
    formError.value = 'You must accept the Terms of Service and Privacy Policy'
    return
  }

  try {
    await withRetry(() => signUp(event.data.email, event.data.password, '', '', tosAccepted.value, inviteCode.value || undefined), {
      maxRetries: 3,
      exponentialBackoff: true,
      context: 'signup'
    })

    // Track successful signup
    trackSignup(inviteCode.value ? 'invite' : 'email')

    // Redirect to verification page with email (preserve redirect URL)
    const checkEmailQuery: Record<string, string> = { email: event.data.email }
    if (redirectUrl.value) {
      checkEmailQuery.redirect = redirectUrl.value
    }
    await router.push({
      path: '/check-email',
      query: checkEmailQuery
    })
  } catch (error: unknown) {
    handleAuthError(error, 'signup')
  }
}
</script>

<template>
  <div>
    <!-- Invite code success message -->
    <UAlert
      v-if="inviteCodeInfo?.valid"
      color="success"
      variant="soft"
      :title="inviteCodeInfo.message || 'Valid invite code'"
      icon="i-lucide-check-circle"
      class="mb-6"
    />

    <!-- Invite code error message -->
    <UAlert
      v-else-if="inviteCodeInfo && !inviteCodeInfo.valid"
      color="warning"
      variant="soft"
      :title="inviteCodeInfo.message || 'Invalid invite code'"
      icon="i-lucide-alert-triangle"
      class="mb-6"
    />

    <!-- Form error message -->
    <UAlert
      v-if="formError"
      color="error"
      variant="soft"
      :title="formError"
      icon="i-lucide-alert-circle"
      :close-button="{ icon: 'i-lucide-x', color: 'gray', variant: 'link', padded: false }"
      class="mb-6"
      @close="clearError"
    />

    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Create an account
      </h1>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Already have an account? <ULink
          :to="loginUrlWithRedirect"
          class="text-primary font-medium"
        >Login</ULink>.
      </p>
    </div>

    <!-- Free trial banner -->
    <div class="mb-8 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
      <div class="flex items-center gap-2 justify-center">
        <UIcon
          name="i-lucide-sparkles"
          class="w-5 h-5 text-purple-600 dark:text-purple-400"
        />
        <p class="text-sm font-medium text-purple-800 dark:text-purple-200">
          Get {{ freeTrialDays }} days of Pro free with your account
        </p>
      </div>
    </div>

    <SocialLoginButtons :invite-code="inviteCode || undefined" />

    <UAuthForm
      :fields="fields"
      :schema="schema"
      :submit="{ label: 'Create account' }"
      @submit="(onSubmit as (event: FormSubmitEvent<Schema>) => Promise<void>)"
    >
      <template #validation>
        <UFormField
          name="tosAccepted"
        >
          <UCheckbox
            v-model="tosAccepted"
            name="tosAccepted"
          >
            <template #label>
              <span class="text-sm">
                I agree to the
                <ULink
                  to="/legal/terms"
                  target="_blank"
                  class="text-primary font-medium hover:underline"
                >Terms of Service</ULink>
                and
                <ULink
                  to="/legal/privacy"
                  target="_blank"
                  class="text-primary font-medium hover:underline"
                >Privacy Policy</ULink>
              </span>
            </template>
          </UCheckbox>
        </UFormField>
      </template>
    </UAuthForm>

    <p class="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
      By signing up with a social provider, you agree to our
      <ULink
        to="/legal/terms"
        class="text-primary hover:underline"
      >Terms of Service</ULink>
      and
      <ULink
        to="/legal/privacy"
        class="text-primary hover:underline"
      >Privacy Policy</ULink>.
    </p>
  </div>
</template>
