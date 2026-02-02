<script setup lang="ts">
import { handleError } from '@/lib/errors/errorHandler'

definePageMeta({
  layout: 'auth',
  title: 'Verify Email Change'
})

useSeoMeta({
  title: 'Verify Email Change',
  robots: 'noindex, nofollow'
})

const route = useRoute()
const router = useRouter()
const { refreshSession } = useAuth()

const token = computed(() => route.params.token as string)
const verifying = ref(true)
const success = ref(false)
const error = ref('')

// Verify email change on mount
onMounted(async () => {
  try {
    const response = await $fetch<{
      success: boolean
      message: string
    }>(`/api/auth/verify-email-change/${token.value}`)

    success.value = response.success

    // Refresh session to update email
    await refreshSession()

    // Redirect to profile after 3 seconds
    setTimeout(() => {
      router.push('/profile')
    }, 3000)
  } catch (err: unknown) {
    success.value = false
    error.value = handleError(err, 'Email change verification failed', 'verifyEmailChange')
  } finally {
    verifying.value = false
  }
})
</script>

<template>
  <UPageCard variant="subtle">
    <template #title>
      Email Change Verification
    </template>

    <div class="text-center py-8">
      <!-- Loading -->
      <div v-if="verifying">
        <UIcon
          name="i-lucide-loader-circle"
          class="w-12 h-12 mx-auto mb-4 animate-spin text-primary"
        />
        <p class="text-gray-600 dark:text-gray-400">
          Verifying your new email address...
        </p>
      </div>

      <!-- Success -->
      <div v-else-if="success">
        <UIcon
          name="i-lucide-circle-check"
          class="w-12 h-12 mx-auto mb-4 text-green-600"
        />
        <h2 class="text-xl font-semibold mb-2">
          Email Updated!
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Your email address has been successfully updated.
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-500">
          Redirecting you to your profile...
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
          to="/profile"
          variant="soft"
        >
          Go to Profile
        </UButton>
      </div>
    </div>
  </UPageCard>
</template>
