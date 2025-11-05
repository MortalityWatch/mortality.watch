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
const { formError, handleAuthError, clearError } = useAuthError()
const { withRetry } = useErrorRecovery()
const tosAccepted = ref(false)

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
    await withRetry(() => signUp(event.data.email, event.data.password, '', '', tosAccepted.value), {
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
