<script setup lang="ts">
// No props needed for now, actions are self-contained

const emit = defineEmits<{
  copyLink: []
  screenshot: []
  save: []
}>()
</script>

<template>
  <UCard :ui="{ body: 'p-0' }">
    <template #header>
      <h2 class="text-xl font-semibold">
        Chart Options
      </h2>
    </template>
    <ClientOnly>
      <div class="flex flex-col">
        <button
          class="chart-option-button"
          @click="emit('copyLink')"
        >
          <UIcon
            name="i-lucide-link"
            class="w-4 h-4 flex-shrink-0"
          />
          <div class="flex-1 text-left text-sm">
            Copy Link
          </div>
          <UIcon
            name="i-lucide-chevron-right"
            class="w-3 h-3 text-gray-400"
          />
        </button>

        <div class="border-t border-gray-200 dark:border-gray-700" />

        <button
          class="chart-option-button"
          @click="emit('screenshot')"
        >
          <UIcon
            name="i-lucide-camera"
            class="w-4 h-4 flex-shrink-0"
          />
          <div class="flex-1 text-left text-sm">
            Download Screenshot
          </div>
          <UIcon
            name="i-lucide-chevron-right"
            class="w-3 h-3 text-gray-400"
          />
        </button>

        <div class="border-t border-gray-200 dark:border-gray-700" />

        <button
          class="chart-option-button"
          @click="emit('save')"
        >
          <UIcon
            name="i-lucide-save"
            class="w-4 h-4 flex-shrink-0"
          />
          <div class="flex-1 text-left text-sm">
            Save Chart
          </div>
          <UIcon
            name="i-lucide-chevron-right"
            class="w-3 h-3 text-gray-400"
          />
        </button>
      </div>
    </ClientOnly>
  </UCard>
</template>

<style scoped>
.chart-option-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;
  color: inherit;
}

.chart-option-button:hover {
  background-color: rgb(243 244 246);
}

.dark .chart-option-button:hover {
  background-color: rgb(31 41 55);
}

.chart-option-button:active {
  background-color: rgb(229 231 235);
}

.dark .chart-option-button:active {
  background-color: rgb(17 24 39);
}
</style>
