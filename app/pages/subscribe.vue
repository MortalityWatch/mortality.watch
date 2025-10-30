<script setup lang="ts">
const { isAuthenticated } = useAuth()

// Use onMounted to ensure client-side execution with proper auth state
onMounted(() => {
  if (!isAuthenticated.value) {
    // Not logged in -> redirect to signup
    navigateTo('/signup')
  } else {
    // Logged in -> redirect to profile (where SubscriptionCard handles subscription)
    navigateTo('/profile')
  }
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <Icon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin mx-auto mb-4 text-primary"
      />
      <p class="text-gray-600 dark:text-gray-400">
        Redirecting...
      </p>
    </div>
  </div>
</template>
