<script setup lang="ts">
// Feature access for data export
const { can } = useFeatureAccess()
const canExportData = computed(() => can('EXPORT_DATA'))

const props = withDefaults(defineProps<{
  showSaveButton?: boolean
  showDownloadChart?: boolean
  showScreenshot?: boolean
  showExportData?: boolean
  explorerLink?: string
}>(), {
  showDownloadChart: true,
  showScreenshot: true,
  showExportData: true
})

const emit = defineEmits<{
  copyLink: []
  copyShortLink: []
  downloadChart: []
  screenshot: []
  saveChart: []
  exportCSV: []
  exportJSON: []
}>()
</script>

<template>
  <UCard
    :ui="{ body: 'p-0' }"
    data-tour="share-button"
  >
    <template #header>
      <h2 class="text-xl font-semibold">
        Chart Actions
      </h2>
    </template>
    <ClientOnly>
      <div class="flex flex-col">
        <!-- Save Chart - Primary Action (moved to top) -->
        <template v-if="$slots['save-button'] || props.showSaveButton">
          <slot name="save-button">
            <button
              v-if="props.showSaveButton"
              class="chart-option-button opacity-60"
              data-tour="save-button"
              @click="emit('saveChart')"
            >
              <UIcon
                name="i-lucide-book-heart"
                class="w-4 h-4 shrink-0"
              />
              <div class="flex-1 text-left">
                <div class="text-sm font-medium">
                  Save Chart
                  <FeatureBadge
                    feature="SAVE_CHART"
                    class="ml-2"
                  />
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Sign up free to save charts
                </div>
              </div>
              <UIcon
                name="i-lucide-chevron-right"
                class="w-3 h-3 text-gray-400"
              />
            </button>
          </slot>

          <div class="border-t border-gray-200 dark:border-gray-700" />
        </template>

        <button
          class="chart-option-button"
          @click="emit('copyLink')"
        >
          <UIcon
            name="i-lucide-link"
            class="w-4 h-4 shrink-0"
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

        <div class="border-t border-gray-200 dark:border-gray-700" />

        <button
          class="chart-option-button"
          @click="emit('copyShortLink')"
        >
          <UIcon
            name="i-lucide-qr-code"
            class="w-4 h-4 shrink-0"
          />
          <div class="flex-1 text-left">
            <div class="text-sm font-medium">
              Copy Short Link
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Compact URL for QR codes
            </div>
          </div>
          <UIcon
            name="i-lucide-chevron-right"
            class="w-3 h-3 text-gray-400"
          />
        </button>

        <template v-if="props.showDownloadChart">
          <div class="border-t border-gray-200 dark:border-gray-700" />

          <button
            class="chart-option-button"
            @click="emit('downloadChart')"
          >
            <UIcon
              name="i-lucide-image-down"
              class="w-4 h-4 shrink-0"
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

        <template v-if="props.showScreenshot">
          <div class="border-t border-gray-200 dark:border-gray-700" />

          <button
            class="chart-option-button"
            @click="emit('screenshot')"
          >
            <UIcon
              name="i-lucide-camera"
              class="w-4 h-4 shrink-0"
            />
            <div class="flex-1 text-left">
              <div class="text-sm font-medium">
                Screenshot
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Capture current view as image
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="w-3 h-3 text-gray-400"
            />
          </button>
        </template>

        <!-- Export Data Section -->
        <template v-if="props.showExportData">
          <div class="border-t border-gray-200 dark:border-gray-700" />

          <!-- CSV Export -->
          <button
            :class="canExportData ? 'chart-option-button' : 'chart-option-button opacity-60'"
            @click="canExportData ? emit('exportCSV') : navigateTo('/signup')"
          >
            <UIcon
              name="i-lucide-file-spreadsheet"
              class="w-4 h-4 shrink-0"
            />
            <div class="flex-1 text-left">
              <div class="text-sm font-medium">
                Export as CSV
                <FeatureBadge
                  feature="EXPORT_DATA"
                  class="ml-2"
                />
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Download data as spreadsheet
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="w-3 h-3 text-gray-400"
            />
          </button>

          <div class="border-t border-gray-200 dark:border-gray-700" />

          <!-- JSON Export -->
          <button
            :class="canExportData ? 'chart-option-button' : 'chart-option-button opacity-60'"
            @click="canExportData ? emit('exportJSON') : navigateTo('/signup')"
          >
            <UIcon
              name="i-lucide-braces"
              class="w-4 h-4 shrink-0"
            />
            <div class="flex-1 text-left">
              <div class="text-sm font-medium">
                Export as JSON
                <FeatureBadge
                  feature="EXPORT_DATA"
                  class="ml-2"
                />
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Download data as structured file
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="w-3 h-3 text-gray-400"
            />
          </button>
        </template>

        <template v-if="props.explorerLink">
          <div class="border-t border-gray-200 dark:border-gray-700" />

          <NuxtLink
            :to="props.explorerLink"
            class="chart-option-button"
          >
            <UIcon
              name="i-lucide-bar-chart-3"
              class="w-4 h-4 shrink-0"
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
