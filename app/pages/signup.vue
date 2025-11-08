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
const tosAccepted = ref(false)

// Invite code handling
const inviteCode = ref<string | null>(null)
const inviteCodeValidating = ref(false)
const inviteCodeInfo = ref<{ valid: boolean; message?: string; grantsProUntil?: Date } | null>(null)

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
    const result = await $fetch<{ valid: boolean; message?: string; grantsProUntil?: Date }>('/api/auth/validate-invite-code', {
      method: 'POST',
      body: { code }
    })
    inviteCodeInfo.value = result
  } catch (error) {
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

    // Redirect to verification page with email
    await router.push({
      path: '/check-email',
      query: { email: event.data.email }
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

    <UAuthForm
      :fields="fields"
      :schema="schema"
      title="Create an account"
      :submit="{ label: 'Create account' }"
      @submit="(onSubmit as (event: FormSubmitEvent<Schema>) => Promise<void>)"
    >
      <template #description>
        Already have an account? <ULink
          to="/login"
          class="text-primary font-medium"
        >Login</ULink>.
      </template>

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
  </div>
</template>
