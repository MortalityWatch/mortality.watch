<template>
  <div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
    <FiltersFilterRow label="Sort By">
      <USelectMenu
        :model-value="selectedSortOption"
        :items="sortOptions"
        size="sm"
        class="flex-1"
        @update:model-value="handleSortChange"
      />
    </FiltersFilterRow>

    <FiltersFilterRow label="Chart Type">
      <USelectMenu
        :model-value="selectedTypeOption"
        :items="typeOptions"
        size="sm"
        class="flex-1"
        @update:model-value="handleTypeChange"
      />
    </FiltersFilterRow>

    <FiltersFilterRow label="Featured">
      <USelectMenu
        :model-value="selectedFeaturedOption"
        :items="featuredOptions"
        size="sm"
        class="flex-1"
        @update:model-value="handleFeaturedChange"
      />
    </FiltersFilterRow>
  </div>
</template>

<script setup lang="ts">
import { CHART_FILTERS } from '@/lib/config/constants'

interface FilterOption {
  label: string
  value: string | null
}

const props = defineProps<{
  sortBy: string
  filterType: string | null
  filterFeatured: string | null
}>()

const emit = defineEmits<{
  'update:sortBy': [value: string]
  'update:filterType': [value: string | null]
  'update:filterFeatured': [value: string | null]
}>()

// Use filter options from constants (cast from readonly to mutable)
const sortOptions: FilterOption[] = [...CHART_FILTERS.SORT_OPTIONS] as FilterOption[]
const typeOptions: FilterOption[] = [...CHART_FILTERS.TYPE_OPTIONS] as FilterOption[]
const featuredOptions: FilterOption[] = [...CHART_FILTERS.FEATURED_OPTIONS] as FilterOption[]

// Convert primitive values to option objects for USelectMenu
const selectedSortOption = computed(() =>
  sortOptions.find(opt => opt.value === props.sortBy) || sortOptions[0]
)

const selectedTypeOption = computed(() =>
  typeOptions.find(opt => opt.value === props.filterType) || typeOptions[0]
)

const selectedFeaturedOption = computed(() =>
  featuredOptions.find(opt => opt.value === props.filterFeatured) || featuredOptions[0]
)

/**
 * Runtime type guard for FilterOption
 * Validates that the value is an object with the correct shape
 */
function isFilterOption(value: unknown): value is FilterOption {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Record<string, unknown>
  return (
    'label' in obj
    && 'value' in obj
    && typeof obj.label === 'string'
    && (typeof obj.value === 'string' || obj.value === null)
  )
}

function handleSortChange(value: unknown) {
  if (isFilterOption(value) && typeof value.value === 'string') {
    emit('update:sortBy', value.value)
  }
}

function handleTypeChange(value: unknown) {
  if (isFilterOption(value)) {
    emit('update:filterType', value.value)
  }
}

function handleFeaturedChange(value: unknown) {
  if (isFilterOption(value)) {
    emit('update:filterFeatured', value.value)
  }
}
</script>
