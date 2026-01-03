<template>
  <div
    ref="containerRef"
    class="overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800 relative"
    style="aspect-ratio: 16/9"
  >
    <ClientOnly>
      <template v-if="!locked">
        <img
          :src="optimizedSrc"
          :alt="alt"
          class="w-full h-full object-cover object-top hover:scale-105 transition-transform"
          loading="lazy"
          @error="handleImageError"
        >
      </template>
      <template v-else>
        <!-- Load fallback thumbnail and blur it for locked features -->
        <img
          :src="optimizedLockedSrc"
          :alt="`${alt} - Pro feature`"
          class="w-full h-full object-cover object-top blur-lg grayscale"
          loading="lazy"
          @error="handleImageError"
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
import { useElementSize } from '@vueuse/core'

interface Props {
  src: string
  lockedSrc: string
  alt: string
  locked: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  error: []
}>()

// Handle image load errors (e.g., chart.png returns 500 for empty charts)
function handleImageError() {
  if (import.meta.dev) {
    console.warn(`[DiscoverThumbnail] Failed to load: ${props.src}`)
  }
  emit('error')
}

// Measure container size
const containerRef = ref<HTMLElement | null>(null)
const { width } = useElementSize(containerRef)

// Calculate height from width (16:9 aspect ratio)
const height = computed(() => Math.round(width.value * 9 / 16))

// Generate optimized src with size parameters
const optimizedSrc = computed(() => {
  if (!width.value || width.value < 50) return props.src
  return appendSizeParams(props.src, width.value, height.value)
})

const optimizedLockedSrc = computed(() => {
  if (!width.value || width.value < 50) return props.lockedSrc
  return appendSizeParams(props.lockedSrc, width.value, height.value)
})

// Append or replace width/height params in URL
function appendSizeParams(url: string, w: number, h: number): string {
  try {
    const urlObj = new URL(url, window.location.origin)
    // Round to nearest 50px to allow some caching benefit
    const roundedWidth = Math.ceil(w / 50) * 50
    const roundedHeight = Math.ceil(h / 50) * 50
    urlObj.searchParams.set('width', roundedWidth.toString())
    urlObj.searchParams.set('height', roundedHeight.toString())
    return urlObj.pathname + urlObj.search
  } catch {
    return url
  }
}
</script>
