<script setup lang="ts">
const router = useRouter()

function goBack() {
  router.back()
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Back Button -->
    <UButton
      icon="i-lucide-chevron-left"
      size="xl"
      color="neutral"
      variant="subtle"
      class="absolute left-8 top-8 rounded-full z-10"
      @click="goBack"
    />

    <!-- Logo -->
    <div class="flex justify-center pt-12 pb-8">
      <NuxtLink to="/">
        <AppLogo class="w-auto h-10" />
      </NuxtLink>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex items-center justify-center px-4 pb-12">
      <UPageCard
        variant="subtle"
        class="max-w-sm w-full"
      >
        <slot />
      </UPageCard>
    </div>

    <!-- Footer -->
    <AppFooter />
  </div>
</template>
