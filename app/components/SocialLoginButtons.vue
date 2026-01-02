<script setup lang="ts">
const { signInWithGoogle, signInWithTwitter } = useAuth()
const route = useRoute()

// Check for OAuth errors in query params
const oauthError = computed(() => {
  const error = route.query.error as string | undefined
  if (error === 'google_oauth_failed') {
    return 'Google sign in failed. Please try again.'
  }
  if (error === 'twitter_oauth_failed') {
    return 'X sign in failed. Please try again.'
  }
  return null
})
</script>

<template>
  <div class="space-y-4">
    <UAlert
      v-if="oauthError"
      color="error"
      variant="soft"
      :title="oauthError"
      icon="i-lucide-alert-circle"
      class="mb-4"
    />

    <div class="flex flex-col gap-3">
      <UButton
        color="neutral"
        variant="outline"
        block
        size="lg"
        icon="i-simple-icons-google"
        @click="signInWithGoogle"
      >
        Continue with Google
      </UButton>

      <UButton
        color="neutral"
        variant="outline"
        block
        size="lg"
        icon="i-simple-icons-x"
        @click="signInWithTwitter"
      >
        Continue with X
      </UButton>
    </div>

    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-200 dark:border-gray-700" />
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
          or continue with email
        </span>
      </div>
    </div>
  </div>
</template>
