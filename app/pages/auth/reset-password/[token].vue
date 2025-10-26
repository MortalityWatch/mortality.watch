<script setup lang="ts">
definePageMeta({
  layout: false
})

const { resetPassword } = useAuth()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const token = computed(() => route.params.token as string)

const state = reactive({
  password: '',
  confirmPassword: ''
})

const loading = ref(false)

async function onSubmit() {
  if (state.password !== state.confirmPassword) {
    toast.add({
      title: 'Passwords do not match',
      description: 'Please make sure both passwords are identical',
      color: 'red'
    })
    return
  }

  loading.value = true
  try {
    await resetPassword(token.value, state.password)
    toast.add({
      title: 'Password reset successful',
      description: 'You have been signed in with your new password',
      color: 'green'
    })
    await router.push('/')
  } catch (error: unknown) {
    toast.add({
      title: 'Password reset failed',
      description: error.data?.message || 'Invalid or expired reset token',
      color: 'red'
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
            Reset Password
          </h1>
          <UButton
            to="/"
            variant="ghost"
            color="gray"
            icon="i-lucide-x"
            size="sm"
          />
        </div>
      </template>

      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Enter your new password below.
      </p>

      <form
        class="space-y-4"
        @submit.prevent="onSubmit"
      >
        <UFormGroup
          label="New Password"
          name="password"
          required
        >
          <UInput
            v-model="state.password"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
            required
          />
          <template #hint>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum 8 characters
            </p>
          </template>
        </UFormGroup>

        <UFormGroup
          label="Confirm Password"
          name="confirmPassword"
          required
        >
          <UInput
            v-model="state.confirmPassword"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
            required
          />
        </UFormGroup>

        <UButton
          type="submit"
          block
          :loading="loading"
          :disabled="loading"
        >
          Reset Password
        </UButton>
      </form>

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
