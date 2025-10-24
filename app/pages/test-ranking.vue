<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { loadCountryMetadata } from '../data'

const isLoading = ref(true)
const error = ref<string | null>(null)
const metaData = ref<Record<string, unknown>>({})
const testMessage = ref('Starting...')

onMounted(async () => {
  try {
    testMessage.value = 'Loading metadata...'
    console.log('Starting to load metadata')
    metaData.value = await loadCountryMetadata()
    console.log('Metadata loaded:', Object.keys(metaData.value).length, 'countries')
    testMessage.value = `Loaded ${Object.keys(metaData.value).length} countries`
  } catch (e) {
    console.error('Error loading metadata:', e)
    error.value = e instanceof Error ? e.message : String(e)
    testMessage.value = 'Error: ' + error.value
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-4">
      Test Ranking Page
    </h1>

    <div
      v-if="isLoading"
      class="p-4 bg-blue-100 rounded"
    >
      Loading... {{ testMessage }}
    </div>

    <div
      v-else-if="error"
      class="p-4 bg-red-100 rounded"
    >
      Error: {{ error }}
    </div>

    <div
      v-else
      class="p-4 bg-green-100 rounded"
    >
      <p>{{ testMessage }}</p>
      <p>Data loaded successfully!</p>
      <p>Countries: {{ Object.keys(metaData).slice(0, 5).join(', ') }}...</p>
    </div>
  </div>
</template>
