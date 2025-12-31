<template>
  <div
    class="overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800 relative"
    style="aspect-ratio: 16/9"
  >
    <ClientOnly>
      <template v-if="!locked">
        <img
          :src="src"
          :alt="alt"
          class="w-full h-full object-cover object-top hover:scale-105 transition-transform"
          loading="lazy"
        >
      </template>
      <template v-else>
        <!-- Load fallback thumbnail and blur it for locked features -->
        <img
          :src="lockedSrc"
          :alt="`${alt} - Pro feature`"
          class="w-full h-full object-cover object-top blur-lg grayscale"
          loading="lazy"
        >
      </template>
      <template #fallback>
        <div class="w-full h-full animate-pulse bg-gray-200 dark:bg-gray-700" />
      </template>
    </ClientOnly>
    <!-- Lock overlay for non-Pro users -->
    <div
      v-if="locked"
      class="absolute inset-0 flex items-center justify-center bg-gray-900/20 dark:bg-gray-900/40"
    >
      <UIcon
        name="i-heroicons-lock-closed"
        class="text-white size-8 drop-shadow-lg"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  src: string
  lockedSrc: string
  alt: string
  locked: boolean
}

defineProps<Props>()
</script>
