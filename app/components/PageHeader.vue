<template>
  <div
    class="mb-8"
    :class="{ 'text-center': centered, 'max-w-4xl mx-auto': maxWidth === 'md', 'max-w-6xl mx-auto': maxWidth === 'lg', 'max-w-7xl mx-auto': maxWidth === 'xl' }"
  >
    <h1
      class="font-bold mb-4"
      :class="size === 'xl' ? 'text-5xl' : 'text-4xl'"
    >
      {{ title }}
    </h1>

    <div
      v-if="$slots.default || description"
      class="space-y-4 text-lg leading-relaxed"
    >
      <slot>
        <p v-if="description">
          {{ description }}
        </p>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
  centered?: boolean
  size?: 'default' | 'xl'
  maxWidth?: 'none' | 'md' | 'lg' | 'xl'
}

withDefaults(defineProps<Props>(), {
  centered: true,
  size: 'default',
  maxWidth: 'lg'
})
</script>
