<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { loadCountryMetadata, updateDataset, getAllChartLabels } from '../data'

const status = ref('Starting...')
const error = ref<Error | null>(null)
const results = ref<Array<{ test: string, result: string, data?: unknown }>>([])

onMounted(async () => {
  try {
    // Test 1: Load metadata
    status.value = 'Test 1: Loading metadata...'
    console.log('Loading metadata...')
    const metadata = await loadCountryMetadata()
    const metadataKeys = Object.keys(metadata)
    results.value.push({ test: 'Metadata', result: `✅ Metadata loaded: ${metadataKeys.length} countries` })
    console.log('Metadata keys:', metadataKeys.slice(0, 5))

    // Test 2: Get a few country codes
    status.value = 'Test 2: Filtering countries...'
    const testCountries = metadataKeys.slice(0, 3)
    results.value.push({ test: 'Countries', result: `✅ Test countries: ${testCountries.join(', ')}` })
    console.log('Test countries:', testCountries)

    // Test 3: Try to fetch data for one country
    status.value = 'Test 3: Fetching data for one country...'
    console.log('Calling updateDataset...')
    const firstCountry = testCountries[0]
    if (!firstCountry) throw new Error('No test countries available')
    const data = await updateDataset('yearly', [firstCountry], ['all'])
    console.log('Data received:', data)
    results.value.push({ test: 'Data fetch', result: `✅ Data fetched: ${JSON.stringify(data).substring(0, 100)}...` })

    // Test 4: Get labels
    status.value = 'Test 4: Getting labels...'
    const labels = getAllChartLabels(data, false)
    results.value.push({ test: 'Labels', result: `✅ Labels: ${labels.length} items` })
    console.log('Labels:', labels.slice(0, 5))

    status.value = '✅ All tests passed!'
  } catch (e) {
    console.error('Test failed:', e)
    error.value = e as Error
    status.value = '❌ Test failed'
  }
})
</script>

<template>
  <div class="container mx-auto p-8">
    <h1 class="text-2xl font-bold mb-4">
      Data Loading Test
    </h1>

    <div class="mb-4 p-4 bg-blue-100 dark:bg-blue-900 rounded">
      <p class="font-semibold">
        Status: {{ status }}
      </p>
    </div>

    <div
      v-if="error"
      class="mb-4 p-4 bg-red-100 dark:bg-red-900 rounded"
    >
      <p class="font-semibold">
        Error:
      </p>
      <pre class="text-sm">{{ error }}</pre>
    </div>

    <div
      v-if="results.length > 0"
      class="mb-4 p-4 bg-green-100 dark:bg-green-900 rounded"
    >
      <p class="font-semibold">
        Results:
      </p>
      <ul class="list-disc list-inside">
        <li
          v-for="(result, idx) in results"
          :key="idx"
        >
          {{ result }}
        </li>
      </ul>
    </div>

    <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
      Check the browser console (F12) for detailed logs
    </div>
  </div>
</template>
