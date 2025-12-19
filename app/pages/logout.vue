<template>
  <div class="container mx-auto px-4 py-16 text-center">
    <div
      v-if="loading"
      class="space-y-4"
    >
      <Icon
        name="i-lucide-loader-2"
        class="w-12 h-12 animate-spin mx-auto text-primary"
      />
      <p class="text-lg text-gray-600 dark:text-gray-400">
        Signing out...
      </p>
    </div>
    <div
      v-else-if="error"
      class="space-y-4"
    >
      <Icon
        name="i-lucide-alert-circle"
        class="w-12 h-12 mx-auto text-error"
      />
      <h1 class="text-2xl font-bold">
        Sign Out Failed
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        {{ error }}
      </p>
      <UButton
        to="/"
        color="primary"
      >
        Go to Home
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const { signOut } = useAuth()
const loading = ref(true)
const error = ref<string | null>(null)

// Perform signout on mount
onMounted(async () => {
  try {
    await signOut()
    // signOut already handles redirect to home
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to sign out'
    loading.value = false
  }
})

// Page meta
definePageMeta({
  title: 'Sign Out'
})

useSeoMeta({
  title: 'Sign Out - Mortality Watch',
  robots: 'noindex, nofollow'
})
</script>
