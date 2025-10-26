<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Forgot Password',
  description: 'Reset your password'
})

const { forgotPassword } = useAuth()
const toast = useToast()

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
  email: z.string().email('Invalid email')
})

type Schema = z.output<typeof schema>

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    email.value = event.data.email
    await forgotPassword(event.data.email)
    submitted.value = true
    toast.add({
      title: 'Check your email',
      description: 'If an account exists, you will receive a password reset link',
      color: 'success'
    })
  } catch (error: unknown) {
    toast.add({
      title: 'Request failed',
      description: getErrorMessage(error),
      color: 'error'
    })
  }
}
</script>

<template>
  <div v-if="!submitted">
    <UAuthForm
      :fields="fields"
      :schema="schema"
      title="Forgot Password"
      description="Enter your email address and we'll send you a link to reset your password."
      icon="i-lucide-mail"
      :submit="{ label: 'Send Reset Link' }"
      @submit="onSubmit"
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
