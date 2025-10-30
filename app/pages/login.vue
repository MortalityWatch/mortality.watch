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
const { formError, handleAuthError, clearError } = useAuthError()

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
  email: z.preprocess(
    val => val || '',
    z.string().min(1, 'Email is required').email('Invalid email')
  ),
  password: z.preprocess(
    val => val || '',
    z.string().min(1, 'Password is required').min(8, 'Must be at least 8 characters')
  ),
  remember: z.boolean().optional().default(false)
})

type Schema = z.output<typeof schema>

async function onSubmit(event: FormSubmitEvent<Schema>) {
  clearError()

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
    handleAuthError(error, 'login')
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
      title="Welcome back"
      icon="i-lucide-lock"
      @submit="onSubmit as any"
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
