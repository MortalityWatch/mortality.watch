<script setup lang="ts">
// Props for invite code (optional, used on signup page)
const props = defineProps<{
  inviteCode?: string
}>()

const { signInWithGoogle, signInWithTwitter } = useAuth()
const route = useRoute()

// Fetch which OAuth providers are enabled
const { data: providers } = await useFetch('/api/auth/oauth-providers')

// Check if any provider is enabled
const hasAnyProvider = computed(() =>
  providers.value?.google || providers.value?.twitter
)

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

// Handlers that pass the invite code
function handleGoogleLogin() {
  signInWithGoogle(props.inviteCode)
}

function handleTwitterLogin() {
  signInWithTwitter(props.inviteCode)
}
</script>

<template>
  <div
    v-if="hasAnyProvider"
    class="space-y-4"
  >
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
        v-if="providers?.twitter"
        color="neutral"
        variant="outline"
        block
        size="lg"
        icon="i-simple-icons-x"
        @click="handleTwitterLogin"
      >
        Continue with X
      </UButton>

      <UButton
        v-if="providers?.google"
        color="neutral"
        variant="outline"
        block
        size="lg"
        icon="i-simple-icons-google"
        @click="handleGoogleLogin"
      >
        Continue with Google
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
