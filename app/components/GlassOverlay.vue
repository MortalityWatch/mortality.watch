<template>
  <div
    class="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-10 rounded-lg"
  >
    <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-lg p-6 shadow-xl">
      <div class="flex items-center space-x-3">
        <UIcon
          name="i-lucide-loader-2"
          class="w-8 h-8 animate-spin text-primary"
        />
        <div>
          <p class="text-lg font-semibold">
            {{ title }}
          </p>
          <p
            v-if="showProgress && progress !== undefined"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            {{ progress }}% complete
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  progress?: number
  showProgress?: boolean
}

withDefaults(defineProps<Props>(), {
  title: 'Loading...',
  showProgress: false
})
</script>
