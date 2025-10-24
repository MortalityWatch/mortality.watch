<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Track whether to show the button
const showButton = ref(false)

// Handle scroll event
const handleScroll = () => {
  // Show button when scrolled down more than 300px
  showButton.value = window.scrollY > 300
}

// Scroll to top smoothly
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// Add scroll listener on mount
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

// Clean up on unmount
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="showButton"
      class="fixed bottom-8 right-8 z-50"
    >
      <UButton
        icon="i-heroicons-arrow-up"
        size="lg"
        color="primary"
        variant="solid"
        class="rounded-full"
        aria-label="Scroll to top"
        @click="scrollToTop"
      />
    </div>
  </Transition>
</template>
