<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Reset Password',
  description: 'Set your new password'
})

const { resetPassword } = useAuth()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const token = computed(() => route.params.token as string)

const fields = [{
  name: 'password',
  label: 'New Password',
  type: 'password' as const,
  placeholder: 'Enter your new password',
  required: true
}, {
  name: 'confirmPassword',
  label: 'Confirm Password',
  type: 'password' as const,
  placeholder: 'Confirm your new password',
  required: true
}]

const schema = z.object({
  password: z.string().min(8, 'Must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Must be at least 8 characters')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

type Schema = z.output<typeof schema>

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    await resetPassword(token.value, event.data.password)
    toast.add({
      title: 'Password reset successful',
      description: 'You have been signed in with your new password',
      color: 'success'
    })
    await router.push('/')
  } catch (error: unknown) {
    toast.add({
      title: 'Password reset failed',
      description: getErrorMessage(error),
      color: 'error'
    })
  }
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    title="Reset Password"
    description="Enter your new password below."
    icon="i-lucide-key"
    :submit="{ label: 'Reset Password' }"
    @submit="onSubmit"
  >
    <template #footer>
      Remember your password? <ULink
        to="/login"
        class="text-primary font-medium"
      >Login</ULink>.
    </template>
  </UAuthForm>
</template>
