<script setup lang="ts">
import { handleError } from '@/lib/errors/errorHandler'

definePageMeta({
  layout: 'auth'
})

const route = useRoute()
const router = useRouter()
const { refreshSession } = useAuth()

const token = computed(() => route.params.token as string)
const verifying = ref(true)
const success = ref(false)
const error = ref('')
const alreadyVerified = ref(false)

// Verify email on mount
onMounted(async () => {
  try {
    const response = await $fetch<{
      success: boolean
      message: string
      alreadyVerified?: boolean
    }>(`/api/auth/verify-email/${token.value}`)

    success.value = response.success
    alreadyVerified.value = response.alreadyVerified || false

    // Refresh session to update emailVerified status
    await refreshSession()

    // Redirect to home after 3 seconds
    setTimeout(() => {
      router.push('/')
    }, 3000)
  } catch (err: unknown) {
    success.value = false
    error.value = handleError(err, 'Email verification failed', 'verifyEmail')
  } finally {
    verifying.value = false
  }
})
</script>

<template>
  <UPageCard variant="subtle">
    <template #title>
      Email Verification
    </template>

    <div class="text-center py-8">
      <!-- Loading -->
      <div v-if="verifying">
        <UIcon
          name="i-lucide-loader-circle"
          class="w-12 h-12 mx-auto mb-4 animate-spin text-primary"
        />
        <p class="text-gray-600 dark:text-gray-400">
          Verifying your email address...
        </p>
      </div>

      <!-- Success -->
      <div v-else-if="success">
        <UIcon
          name="i-lucide-circle-check"
          class="w-12 h-12 mx-auto mb-4 text-green-600"
        />
        <h2 class="text-xl font-semibold mb-2">
          {{ alreadyVerified ? 'Already Verified' : 'Email Verified!' }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ alreadyVerified ? 'Your email was already verified.' : 'Your email has been successfully verified.' }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-500">
          Redirecting to homepage...
        </p>
      </div>

      <!-- Error -->
      <div v-else>
        <UIcon
          name="i-lucide-circle-x"
          class="w-12 h-12 mx-auto mb-4 text-red-600"
        />
        <h2 class="text-xl font-semibold mb-2">
          Verification Failed
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ error }}
        </p>
        <UButton
          to="/"
          variant="soft"
        >
          Go to Homepage
        </UButton>
      </div>
    </div>
  </UPageCard>
</template>
