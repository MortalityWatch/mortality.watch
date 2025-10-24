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
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  text?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  text: 'Loading...',
  size: 'lg',
  height: 'h-64'
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
