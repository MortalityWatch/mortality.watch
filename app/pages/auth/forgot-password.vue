<script setup lang="ts">
definePageMeta({
  layout: false
})

const { forgotPassword } = useAuth()
const toast = useToast()

const state = reactive({
  email: ''
})

const loading = ref(false)
const submitted = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    await forgotPassword(state.email)
    submitted.value = true
    toast.add({
      title: 'Check your email',
      description: 'If an account exists, you will receive a password reset link',
      color: 'success'
    })
  } catch (error: unknown) {
    toast.add({
      title: 'Request failed',
      description: (error instanceof Error ? error.message : (error as { data?: { message?: string } })?.data?.message) || 'An error occurred',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">
            Forgot Password
          </h1>
          <UButton
            to="/auth/signin"
            variant="ghost"
            color="neutral"
            icon="i-lucide-x"
            size="sm"
          />
        </div>
      </template>

      <div v-if="!submitted">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form
          class="space-y-4"
          @submit.prevent="onSubmit"
        >
          <UFormGroup
            label="Email"
            name="email"
            required
          >
            <UInput
              v-model="state.email"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
              required
            />
          </UFormGroup>

          <UButton
            type="submit"
            block
            :loading="loading"
            :disabled="loading"
          >
            Send Reset Link
          </UButton>
        </form>
      </div>

      <div
        v-else
        class="text-center py-4"
      >
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
          <UIcon
            name="i-lucide-mail"
            class="w-6 h-6 text-green-600 dark:text-green-400"
          />
        </div>
        <h3 class="text-lg font-semibold mb-2">
          Check Your Email
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          If an account exists for {{ state.email }}, you will receive a password reset link.
        </p>
        <UButton
          to="/auth/signin"
          variant="soft"
        >
          Back to Sign In
        </UButton>
      </div>

      <template #footer>
        <div class="text-center text-sm text-gray-600 dark:text-gray-400">
          Remember your password?
          <UButton
            to="/auth/signin"
            variant="link"
            :padded="false"
          >
            Sign in
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
