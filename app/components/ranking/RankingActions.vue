<script setup lang="ts">
/**
 * RankingActions Component
 *
 * Displays action buttons for the ranking page (Explorer link, Save ranking).
 */

interface Props {
  explorerLink: string
}

interface Emits {
  (e: 'save'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleSave = () => {
  emit('save')
}
</script>

<template>
  <div class="flex gap-2 mt-4">
    <UButton
      :to="explorerLink"
      variant="outline"
      size="lg"
      class="flex-1"
    >
      Show in Explorer
    </UButton>
    <UButton
      icon="i-lucide-save"
      size="lg"
      @click="handleSave"
    >
      Save Ranking
    </UButton>
  </div>
</template>
