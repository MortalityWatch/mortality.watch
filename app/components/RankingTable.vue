<script setup lang="ts">
import { computed } from 'vue'
import { abbrev, asPercentage, getColor, isMobile, roundToStr } from '@/utils'
import type {
  TableData,
  TableDisplay,
  TableSort,
  TablePagination,
  TableLoading
} from '@/lib/ranking/types'

interface Props {
  data: TableData
  display: TableDisplay
  sort: TableSort
  pagination: TablePagination
  loading: TableLoading
}

interface Emits {
  (e: 'toggle-sort', field: string): void
  (e: 'update:currentPage' | 'update:itemsPerPage', value: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Computed decimal precision value
const decimalPlaces = computed(() => {
  const parsed = parseInt(props.display.decimalPrecision)
  return isNaN(parsed) ? 1 : parsed
})

const maybeReplaceShortYear = (label: string): string => {
  if (label.match(/^\d{4}$/)) {
    return `'${label.slice(2)}`
  }
  return label
}

const handleToggleSort = (field: string) => {
  emit('toggle-sort', field)
}

const handlePageChange = (page: number) => {
  emit('update:currentPage', page)
}

const handleItemsPerPageChange = (val: { value: number } | number) => {
  const newValue = typeof val === 'number' ? val : val.value
  emit('update:itemsPerPage', newValue)
  emit('update:currentPage', 1)
}

// Computed for stable select menu options
const itemsPerPageOptions = computed(() =>
  props.pagination.options.map(x => ({ label: String(x), value: x }))
)

const selectedItemsPerPage = computed(() =>
  itemsPerPageOptions.value.find(x => x.value === props.pagination.itemsPerPage) || itemsPerPageOptions.value[0]
)
</script>

<template>
  <div>
    <!-- Loading state for initial data load -->
    <LoadingSpinner
      v-if="!loading.initialLoadDone"
      text="Loading ranking data..."
      height="py-16"
      :progress="loading.progress"
    />

    <div
      v-else-if="data.labels.length"
      class="overflow-x-auto relative"
    >
      <!-- Glass overlay for calculating -->
      <GlassOverlay
        v-if="loading.isUpdating && loading.hasLoaded"
        title="Calculating..."
        :progress="loading.progress"
        show-progress
      />
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              #
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Country
            </th>
            <th
              v-for="label in data.labels?.slice(0, data.labels.length - (display.showTotals ? 1 : 0))"
              :key="label"
              class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="handleToggleSort(label)"
            >
              {{ maybeReplaceShortYear(label) }}
              <UIcon
                v-if="sort.field === label"
                :name="sort.order === 'asc' ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="inline-block ml-1"
              />
            </th>
            <th
              v-if="display.showTotals"
              class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="handleToggleSort('TOTAL')"
            >
              TOTAL
              <UIcon
                v-if="sort.field === 'TOTAL'"
                :name="sort.order === 'asc' ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="inline-block ml-1"
              />
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="(row, index) in data.paginatedResult"
            :key="index"
            class="hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
              {{ (pagination.currentPage - 1) * pagination.itemsPerPage + index + 1 }}
            </td>
            <td class="px-4 py-3 text-sm">
              <div class="flex items-center">
                <img
                  v-if="row.iso2c"
                  :src="`https://flagcdn.com/16x12/${row.iso2c}.png`"
                  :srcset="`https://flagcdn.com/32x24/${row.iso2c}.png 2x, https://flagcdn.com/48x36/${row.iso2c}.png 3x`"
                  width="16"
                  height="12"
                  :alt="`Flag of ${row.country}`"
                  class="mr-2"
                >
                <a
                  :href="(row.href as string)"
                  class="text-primary hover:underline"
                >
                  {{ isMobile() ? abbrev(row.country as string) : row.country }}
                </a>
              </div>
            </td>
            <td
              v-for="label in data.labels?.slice(0, data.labels.length - (display.showTotals ? 1 : 0))"
              :key="label"
              class="px-4 py-3 text-center text-sm"
              :class="
                getColor(
                  row[label] as number
                    / (row[label] === Number.MIN_SAFE_INTEGER
                      ? 1
                      : display.showRelative
                        ? 1
                        : label === 'TOTAL'
                          ? 1000
                          : 500)
                )
              "
            >
              <span v-if="row[label] !== Number.MIN_SAFE_INTEGER">
                {{
                  display.showRelative
                    ? asPercentage(row[label] as number, decimalPlaces, '')
                    : roundToStr(row[label] as number, decimalPlaces)
                }}
                <span
                  v-if="
                    (display.showPI && label !== display.totalRowKey)
                      || (display.showPI && display.selectedBaselineMethod !== 'auto')
                  "
                  class="text-xs opacity-75"
                >
                  {{
                    row[`${label}_l`] === Number.MIN_SAFE_INTEGER
                      ? ''
                      : display.showRelative
                        ? `[${asPercentage(row[`${label}_l`] as number, decimalPlaces, '')}, ${asPercentage(row[`${label}_u`] as number, decimalPlaces, '')}]`
                        : `[${roundToStr(row[`${label}_l`] as number, decimalPlaces)}, ${roundToStr(row[`${label}_u`] as number, decimalPlaces)}]`
                  }}
                </span>
              </span>
            </td>
            <td
              v-if="display.showTotals"
              class="px-4 py-3 text-center text-sm font-medium"
              :class="
                getColor(
                  row['TOTAL'] as number
                    / (row['TOTAL'] === Number.MIN_SAFE_INTEGER
                      ? 1
                      : display.showRelative
                        ? 1
                        : 1000)
                )
              "
            >
              <span v-if="row['TOTAL'] !== Number.MIN_SAFE_INTEGER">
                {{
                  display.showRelative
                    ? asPercentage(row['TOTAL'] as number, decimalPlaces, '')
                    : roundToStr(row['TOTAL'] as number, decimalPlaces)
                }}
                <span
                  v-if="display.showPI && display.selectedBaselineMethod !== 'auto'"
                  class="text-xs opacity-75"
                >
                  {{
                    row[`TOTAL_l`] === Number.MIN_SAFE_INTEGER
                      ? ''
                      : display.showRelative
                        ? `[${asPercentage(row[`TOTAL_l`] as number, decimalPlaces, '')}, ${asPercentage(row[`TOTAL_u`] as number, decimalPlaces, '')}]`
                        : `[${roundToStr(row[`TOTAL_l`] as number, decimalPlaces)}, ${roundToStr(row[`TOTAL_u`] as number, decimalPlaces)}]`
                  }}
                </span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination controls -->
    <div
      v-if="data.sortedResult?.length"
      class="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div class="flex items-center gap-4">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Showing {{ (pagination.currentPage - 1) * pagination.itemsPerPage + 1 }} to
          {{ Math.min(pagination.currentPage * pagination.itemsPerPage, data.sortedResult?.length || 0) }} of
          {{ data.sortedResult?.length || 0 }} countries
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">Per page:</label>
          <USelectMenu
            :model-value="selectedItemsPerPage"
            :items="itemsPerPageOptions"
            size="xs"
            class="w-20"
            @update:model-value="handleItemsPerPageChange"
          />
        </div>
      </div>
      <UPagination
        v-if="pagination.totalPages > 1"
        :page="pagination.currentPage"
        :total="data.sortedResult?.length || 0"
        :items-per-page="pagination.itemsPerPage"
        :sibling-count="2"
        show-edges
        @update:page="handlePageChange"
      />
    </div>

    <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
      {{ display.showRelative ? '' : 'per 100,000 population · ' }}{{ display.subtitle }}
    </div>
  </div>
</template>
