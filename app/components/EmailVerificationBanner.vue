<script setup lang="ts">
import { handleError } from '@/lib/errors/errorHandler'

const { user, isAuthenticated } = useAuth()
const toast = useToast()
const sending = ref(false)
const dismissed = ref(false)

const showBanner = computed(() => {
  return isAuthenticated.value && user.value && !user.value.emailVerified && !dismissed.value
})

async function resendVerification() {
  sending.value = true
  try {
    await $fetch('/api/auth/resend-verification', {
      method: 'POST'
    })
    toast.add({
      title: 'Verification email sent',
      description: 'Please check your inbox for the verification link',
      color: 'success'
    })
  } catch (error: unknown) {
    handleError(error, 'Failed to send verification email', 'resendVerification')
  } finally {
    sending.value = false
  }
}

function dismiss() {
  dismissed.value = true
}
</script>

<template>
  <div
    v-if="showBanner"
    class="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800"
  >
    <div class="container mx-auto px-4 py-3">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 flex-1">
          <UIcon
            name="i-lucide-mail"
            class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0"
          />
          <p class="text-sm text-blue-900 dark:text-blue-100">
            Please verify your email address to access all features.
          </p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UButton
            size="xs"
            variant="soft"
            :loading="sending"
            :disabled="sending"
            @click="resendVerification"
          >
            Resend Email
          </UButton>
          <UButton
            size="xs"
            variant="ghost"
            icon="i-lucide-x"
            @click="dismiss"
          />
        </div>
      </div>
    </div>
  </div>
</template>
