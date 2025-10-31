<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Verify Email',
  description: 'Check your email to verify your account'
})

const route = useRoute()
const email = route.query.email as string || ''
const toast = useToast()
const isResending = ref(false)

async function resendVerification() {
  if (!email) {
    toast.add({
      title: 'Error',
      description: 'Email address is required',
      color: 'error'
    })
    return
  }

  isResending.value = true

  try {
    await $fetch('/api/auth/resend-verification-email', {
      method: 'POST',
      body: { email }
    })

    toast.add({
      title: 'Email sent',
      description: 'Verification email has been resent. Please check your inbox.',
      color: 'success'
    })
  } catch (error: unknown) {
    const errorMessage = (error as { data?: { message?: string } })?.data?.message || 'Failed to resend verification email'
    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'error'
    })
  } finally {
    isResending.value = false
  }
}
</script>

<template>
  <div class="text-center">
    <div class="mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
        <UIcon
          name="i-lucide-mail"
          class="w-8 h-8 text-primary"
        />
      </div>

      <h1 class="text-3xl font-bold mb-2">
        Check Your Email
      </h1>

      <p class="text-muted text-lg">
        We've sent a verification link to
      </p>

      <p class="text-default font-semibold text-lg mt-2">
        {{ email }}
      </p>
    </div>

    <div class="max-w-md mx-auto space-y-6">
      <UCard>
        <div class="space-y-4 text-sm">
          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-circle-check"
              class="w-5 h-5 text-primary mt-0.5 shrink-0"
            />
            <div class="text-left">
              <p class="font-medium">
                Click the verification link
              </p>
              <p class="text-muted">
                Open the email and click the link to verify your account
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-clock"
              class="w-5 h-5 text-primary mt-0.5 shrink-0"
            />
            <div class="text-left">
              <p class="font-medium">
                Link expires in 24 hours
              </p>
              <p class="text-muted">
                Request a new verification email if it expires
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <UIcon
              name="i-lucide-inbox"
              class="w-5 h-5 text-primary mt-0.5 shrink-0"
            />
            <div class="text-left">
              <p class="font-medium">
                Check your spam folder
              </p>
              <p class="text-muted">
                The email might have been filtered as spam
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <div class="pt-4">
        <p class="text-sm text-muted mb-4">
          Didn't receive the email?
        </p>
        <UButton
          variant="soft"
          :loading="isResending"
          :disabled="isResending"
          @click="resendVerification"
        >
          Resend Verification Email
        </UButton>
      </div>

      <div class="pt-4 border-t border-default">
        <ULink
          to="/login"
          class="text-sm text-primary hover:underline"
        >
          Back to Login
        </ULink>
      </div>
    </div>
  </div>
</template>
