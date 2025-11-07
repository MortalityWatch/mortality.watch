<template>
  <div class="mb-6 flex flex-col sm:flex-row gap-4">
    <USelectMenu
      :model-value="sortBy"
      :options="sortOptions"
      placeholder="Sort by"
      class="w-full sm:w-48"
      @update:model-value="handleSortChange"
    />
    <USelectMenu
      :model-value="filterType"
      :options="typeOptions"
      placeholder="Chart type"
      class="w-full sm:w-48"
      @update:model-value="handleTypeChange"
    />
    <USelectMenu
      :model-value="filterFeatured"
      :options="featuredOptions"
      placeholder="All charts"
      class="w-full sm:w-48"
      @update:model-value="handleFeaturedChange"
    />
  </div>
</template>

<script setup lang="ts">
interface FilterOption {
  label: string
  value: string | null
}

defineProps<{
  sortBy: string
  filterType: string | null
  filterFeatured: string | null
}>()

const emit = defineEmits<{
  'update:sortBy': [value: string]
  'update:filterType': [value: string | null]
  'update:filterFeatured': [value: string | null]
}>()

function handleSortChange(value: unknown) {
  if (typeof value === 'object' && value !== null && 'value' in value) {
    emit('update:sortBy', (value as FilterOption).value as string)
  }
}

function handleTypeChange(value: unknown) {
  if (typeof value === 'object' && value !== null && 'value' in value) {
    emit('update:filterType', (value as FilterOption).value)
  }
}

function handleFeaturedChange(value: unknown) {
  if (typeof value === 'object' && value !== null && 'value' in value) {
    emit('update:filterFeatured', (value as FilterOption).value)
  }
}

const sortOptions: FilterOption[] = [
  { label: 'Featured First', value: 'featured' },
  { label: 'Most Viewed', value: 'views' },
  { label: 'Newest', value: 'newest' }
]

const typeOptions: FilterOption[] = [
  { label: 'All Types', value: null },
  { label: 'Explorer', value: 'explorer' },
  { label: 'Ranking', value: 'ranking' }
]

const featuredOptions: FilterOption[] = [
  { label: 'All Charts', value: null },
  { label: 'Featured Only', value: 'true' },
  { label: 'Not Featured', value: 'false' }
]
</script>
