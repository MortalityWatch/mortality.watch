<script setup lang="ts">
defineProps<{
  showSaveButton?: boolean
  showDownloadChart?: boolean
  showScreenshot?: boolean
  explorerLink?: string
}>()

const emit = defineEmits<{
  copyLink: []
  downloadChart: []
  screenshot: []
  saveChart: []
}>()
</script>

<template>
  <UCard :ui="{ body: 'p-0' }">
    <template #header>
      <h2 class="text-xl font-semibold">
        Chart Actions
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
          <div class="flex-1 text-left">
            <div class="text-sm font-medium">
              Copy Link
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Share this chart via URL
            </div>
          </div>
          <UIcon
            name="i-lucide-chevron-right"
            class="w-3 h-3 text-gray-400"
          />
        </button>

        <template v-if="showDownloadChart !== false">
          <div class="border-t border-gray-200 dark:border-gray-700" />

          <button
            class="chart-option-button"
            @click="emit('downloadChart')"
          >
            <UIcon
              name="i-lucide-image"
              class="w-4 h-4 flex-shrink-0"
            />
            <div class="flex-1 text-left">
              <div class="text-sm font-medium">
                Download Chart
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Optimized PNG for social media
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="w-3 h-3 text-gray-400"
            />
          </button>
        </template>

        <template v-if="showScreenshot !== false">
          <div class="border-t border-gray-200 dark:border-gray-700" />

          <button
            class="chart-option-button"
            @click="emit('screenshot')"
          >
            <UIcon
              name="i-lucide-download"
              class="w-4 h-4 flex-shrink-0"
            />
            <div class="flex-1 text-left">
              <div class="text-sm font-medium">
                Download Screenshot
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Save current view as image
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="w-3 h-3 text-gray-400"
            />
          </button>
        </template>

        <template v-if="explorerLink">
          <div class="border-t border-gray-200 dark:border-gray-700" />

          <NuxtLink
            :to="explorerLink"
            class="chart-option-button"
          >
            <UIcon
              name="i-lucide-bar-chart-3"
              class="w-4 h-4 flex-shrink-0"
            />
            <div class="flex-1 text-left">
              <div class="text-sm font-medium">Show in Explorer</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">View as interactive chart</div>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="w-3 h-3 text-gray-400"
            />
          </NuxtLink>
        </template>

        <div class="border-t border-gray-200 dark:border-gray-700" />

        <slot name="save-button">
          <button
            v-if="showSaveButton"
            class="chart-option-button"
            @click="emit('saveChart')"
          >
            <UIcon
              name="i-lucide-save"
              class="w-4 h-4 flex-shrink-0"
            />
            <div class="flex-1 text-left">
              <div class="text-sm font-medium">
                Save Chart
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Bookmark for later access
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="w-3 h-3 text-gray-400"
            />
          </button>
        </slot>
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
