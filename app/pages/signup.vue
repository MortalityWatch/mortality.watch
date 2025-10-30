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
const toast = useToast()
const formError = ref<string | null>(null)

const fields = [{
  name: 'firstName',
  type: 'text' as const,
  label: 'First Name',
  placeholder: 'Enter your first name',
  required: true
}, {
  name: 'lastName',
  type: 'text' as const,
  label: 'Last Name',
  placeholder: 'Enter your last name',
  required: true
}, {
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
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

async function onSubmit(event: FormSubmitEvent<Schema>) {
  // Clear any previous errors
  formError.value = null

  try {
    await signUp(event.data.email, event.data.password, event.data.firstName, event.data.lastName)
    toast.add({
      title: 'Welcome to Mortality Watch!',
      description: `Your account has been created, ${event.data.firstName}. You're now signed in.`,
      color: 'success'
    })
    // Small delay to let user see they're signed in
    await new Promise(resolve => setTimeout(resolve, 500))
    await router.push('/')
  } catch (error: unknown) {
    // Extract the error message but don't show toast (we'll show inline alert instead)
    const errorObj = error && typeof error === 'object' ? error : { message: String(error) }

    // Extract API error message
    let errorMessage = 'An error occurred'
    if ('data' in errorObj && errorObj.data && typeof errorObj.data === 'object' && 'message' in errorObj.data) {
      errorMessage = String((errorObj.data as Record<string, unknown>).message)
    } else if ('statusMessage' in errorObj && errorObj.statusMessage) {
      errorMessage = String(errorObj.statusMessage)
    } else if ('message' in errorObj) {
      errorMessage = String(errorObj.message)
    }

    // Show inline error only, skip toast
    formError.value = errorMessage
    console.error('[signup]', errorMessage)
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
      @close="formError = null"
    />

    <UAuthForm
      :fields="fields"
      :schema="schema"
      title="Create an account"
      :submit="{ label: 'Create account' }"
      @submit="onSubmit"
    >
      <template #description>
        Already have an account? <ULink
          to="/login"
          class="text-primary font-medium"
        >Login</ULink>.
      </template>
    </UAuthForm>
  </div>
</template>
