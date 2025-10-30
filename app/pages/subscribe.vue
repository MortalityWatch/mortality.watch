<script setup lang="ts">
const { isAuthenticated } = useAuth()

// Smart redirect based on auth state
if (!isAuthenticated.value) {
  // Not logged in -> redirect to signup
  navigateTo('/signup', { redirectCode: 302 })
} else {
  // Logged in -> redirect to profile (where SubscriptionCard handles subscription)
  navigateTo('/profile', { redirectCode: 302 })
}
</script>

<template>
  <div />
</template>
