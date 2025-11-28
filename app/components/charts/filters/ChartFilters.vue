<template>
  <div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
    <FiltersFilterRow label="Sort By">
      <USelect
        v-model="sortByModel"
        :items="sortOptions"
        value-key="value"
        size="sm"
        class="flex-1"
      />
    </FiltersFilterRow>

    <FiltersFilterRow label="Chart Type">
      <USelect
        v-model="filterTypeModel"
        :items="typeOptions"
        value-key="value"
        size="sm"
        class="flex-1"
      />
    </FiltersFilterRow>

    <FiltersFilterRow label="Featured">
      <USelect
        v-model="filterFeaturedModel"
        :items="featuredOptions"
        value-key="value"
        size="sm"
        class="flex-1"
      />
    </FiltersFilterRow>
  </div>
</template>

<script setup lang="ts">
import { CHART_FILTERS } from '@/lib/config/constants'

type SortByValue = typeof CHART_FILTERS.SORT_OPTIONS[number]['value']
type FilterTypeValue = typeof CHART_FILTERS.TYPE_OPTIONS[number]['value']
type FilterFeaturedValue = typeof CHART_FILTERS.FEATURED_OPTIONS[number]['value']

const props = defineProps<{
  sortBy: SortByValue
  filterType: FilterTypeValue
  filterFeatured: FilterFeaturedValue
}>()

const emit = defineEmits<{
  'update:sortBy': [value: SortByValue]
  'update:filterType': [value: FilterTypeValue]
  'update:filterFeatured': [value: FilterFeaturedValue]
}>()

// Use filter options from constants
const sortOptions = [...CHART_FILTERS.SORT_OPTIONS]
const typeOptions = [...CHART_FILTERS.TYPE_OPTIONS]
const featuredOptions = [...CHART_FILTERS.FEATURED_OPTIONS]

// Computed v-models using primitive values
const sortByModel = computed({
  get: () => props.sortBy,
  set: (v: SortByValue) => emit('update:sortBy', v)
})

const filterTypeModel = computed({
  get: () => props.filterType,
  set: (v: FilterTypeValue) => emit('update:filterType', v)
})

const filterFeaturedModel = computed({
  get: () => props.filterFeatured,
  set: (v: FilterFeaturedValue) => emit('update:filterFeatured', v)
})
</script>
