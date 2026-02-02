<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Forgot Password',
  description: 'Reset your Mortality Watch account password. Enter your email to receive a password reset link.'
})

const { forgotPassword } = useAuth()
const toast = useToast()
const { formError, handleAuthError, clearError } = useAuthError()
const { withRetry } = useErrorRecovery()

const submitted = ref(false)
const email = ref('')

const fields = [{
  name: 'email',
  type: 'text' as const,
  label: 'Email',
  placeholder: 'Enter your email',
  required: true
}]

const schema = z.object({
  email: z.preprocess(
    val => val || '',
    z.string().min(1, 'Email is required').email('Invalid email')
  )
})

type Schema = z.output<typeof schema>

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  clearError()

  try {
    email.value = event.data.email
    await withRetry(() => forgotPassword(event.data.email), {
      maxRetries: 3,
      exponentialBackoff: true,
      context: 'forgotPassword'
    })
    submitted.value = true
    toast.add({
      title: 'Check your email',
      description: 'If an account exists, you will receive a password reset link',
      color: 'success'
    })
  } catch (error: unknown) {
    handleAuthError(error, 'forgotPassword')
  }
}
</script>

<template>
  <div v-if="!submitted">
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
      title="Forgot Password"
      description="Enter your email address and we'll send you a link to reset your password."
      icon="i-lucide-mail"
      :submit="{ label: 'Send Reset Link' }"
      @submit="(onSubmit as (event: FormSubmitEvent<Schema>) => Promise<void>)"
    >
      <template #footer>
        Remember your password? <ULink
          to="/login"
          class="text-primary font-medium"
        >Login</ULink>.
      </template>
    </UAuthForm>
  </div>
  <div
    v-else
    class="text-center space-y-4"
  >
    <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success-100 dark:bg-success-900 mb-4">
      <UIcon
        name="i-lucide-mail"
        class="w-6 h-6 text-success-600 dark:text-success-400"
      />
    </div>
    <h3 class="text-lg font-semibold">
      Check Your Email
    </h3>
    <p class="text-sm text-gray-600 dark:text-gray-400">
      If an account exists for {{ email }}, you will receive a password reset link.
    </p>
    <UButton
      to="/login"
      variant="soft"
      block
    >
      Back to Login
    </UButton>
  </div>
</template>
