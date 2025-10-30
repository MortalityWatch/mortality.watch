<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Login',
  description: 'Login to your account to continue'
})

const { signIn } = useAuth()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const formError = ref<string | null>(null)

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
}, {
  name: 'remember',
  label: 'Remember me',
  type: 'checkbox' as const
}]

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email').default(''),
  password: z.string().min(1, 'Password is required').min(8, 'Must be at least 8 characters').default(''),
  remember: z.boolean().optional().default(false)
})

type Schema = z.output<typeof schema>

async function onSubmit(event: FormSubmitEvent<Schema>) {
  // Clear any previous errors
  formError.value = null

  try {
    await signIn(event.data.email, event.data.password, event.data.remember || false)
    toast.add({
      title: 'Welcome back!',
      description: 'Signed in successfully',
      color: 'success'
    })
    // Redirect to where they came from or home
    const redirect = route.query.redirect as string || '/'
    await router.push(redirect)
  } catch (error: unknown) {
    // Only handle API/network errors here, not validation errors
    // Validation errors should be handled by the form component
    console.error('[login] Error caught:', error)

    const errorObj = error && typeof error === 'object' ? error : { message: String(error) }

    // Check if this is an API error (has statusCode or data with statusCode)
    // Skip validation errors which don't have these properties
    const isApiError = ('statusCode' in errorObj)
      || ('data' in errorObj && errorObj.data && typeof errorObj.data === 'object')

    if (!isApiError) {
      // This is likely a validation or other non-API error
      // Don't show in our custom alert - let the form handle it
      console.warn('[login] Non-API error detected, not displaying in alert')
      return
    }

    // Extract API error message
    let errorMessage = 'An error occurred'
    if ('data' in errorObj && errorObj.data && typeof errorObj.data === 'object' && 'message' in errorObj.data) {
      errorMessage = String((errorObj.data as Record<string, unknown>).message)
    } else if ('statusMessage' in errorObj && errorObj.statusMessage) {
      errorMessage = String(errorObj.statusMessage)
    } else if ('message' in errorObj) {
      errorMessage = String(errorObj.message)
    }

    // Show inline error only for API errors
    formError.value = errorMessage
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
      :validate-on="['submit']"
      title="Welcome back"
      icon="i-lucide-lock"
      @submit="onSubmit"
    >
      <template #description>
        Don't have an account? <ULink
          to="/signup"
          class="text-primary font-medium"
        >Sign up</ULink>.
      </template>

      <template #password-hint>
        <ULink
          to="/forgot-password"
          class="text-primary font-medium"
          tabindex="-1"
        >Forgot password?</ULink>
      </template>
    </UAuthForm>
  </div>
</template>
