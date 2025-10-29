<template>
  <div
    class="flex justify-center items-center"
    :class="containerClass"
  >
    <div class="text-center">
      <UIcon
        name="i-lucide-loader-2"
        :class="['animate-spin', sizeClass, 'mb-2']"
      />
      <p
        v-if="text"
        class="text-gray-600 dark:text-gray-400"
      >
        {{ text }}
      </p>
      <p
        v-if="progress !== undefined && progress > 0"
        class="text-sm text-gray-500 dark:text-gray-500 mt-2"
      >
        {{ asPercentage(progress, 0, '', '') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { asPercentage } from '@/lib/utils/formatting'

interface Props {
  text?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  height?: string
  progress?: number
}

const props = withDefaults(defineProps<Props>(), {
  text: 'Loading...',
  size: 'lg',
  height: 'h-64',
  progress: undefined
})

const sizeClass = computed(() => {
  const sizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  }
  return sizes[props.size] || sizes.lg
})

const containerClass = computed(() => {
  return props.height
})
</script>
