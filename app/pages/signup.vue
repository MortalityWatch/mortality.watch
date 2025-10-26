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

const fields = [{
  name: 'name',
  type: 'text' as const,
  label: 'Name',
  placeholder: 'Enter your name',
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
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await signUp(event.data.email, event.data.password, event.data.name)
    toast.add({
      title: 'Welcome to Mortality Watch!',
      description: `Your account has been created, ${event.data.name}. You're now signed in.`,
      color: 'success'
    })
    // Small delay to let user see they're signed in
    await new Promise(resolve => setTimeout(resolve, 500))
    await router.push('/')
  } catch (error: unknown) {
    toast.add({
      title: 'Registration failed',
      description: (error instanceof Error ? error.message : (error as { data?: { message?: string } })?.data?.message) || 'An error occurred',
      color: 'error'
    })
  }
}
</script>

<template>
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
</template>
