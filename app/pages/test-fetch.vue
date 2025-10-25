<!--
  DEV-ONLY TEST PAGE: Data Fetching Test
  Interactive test page for metadata and data fetching functionality.
  Not included in production build (see nuxt.config.ts routeRules).
  Access in dev: http://localhost:3000/test-fetch
-->
<template>
  <div class="p-8">
    <h1 class="text-2xl mb-4">
      Test Data Fetching
    </h1>

    <div class="mb-4">
      <button
        class="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        @click="testMetadata"
      >
        Test Metadata
      </button>
      <button
        class="bg-green-500 text-white px-4 py-2 rounded"
        @click="testDataFetch"
      >
        Test Data Fetch
      </button>
    </div>

    <div
      v-if="loading"
      class="text-gray-600"
    >
      Loading...
    </div>

    <div
      v-if="result"
      class="mt-4"
    >
      <h2 class="text-xl mb-2">
        Result:
      </h2>
      <pre class="bg-gray-100 p-4 rounded overflow-auto">{{ result }}</pre>
    </div>

    <div
      v-if="error"
      class="mt-4 text-red-600"
    >
      <h2 class="text-xl mb-2">
        Error:
      </h2>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { loadCountryMetadata, updateDataset } from '../data'

const loading = ref(false)
const result = ref(null)
const error = ref(null)

const testMetadata = async () => {
  loading.value = true
  result.value = null
  error.value = null

  try {
    console.log('Testing metadata fetch...')
    const data = await loadCountryMetadata()
    result.value = {
      countries: Object.keys(data).length,
      sample: Object.keys(data).slice(0, 10)
    }
  } catch (e) {
    console.error('Metadata fetch error:', e)
    error.value = e.toString()
  } finally {
    loading.value = false
  }
}

const testDataFetch = async () => {
  loading.value = true
  result.value = null
  error.value = null

  try {
    console.log('Testing data fetch...')
    const data = await updateDataset('yearly', ['USA'], ['all'])
    result.value = {
      keys: Object.keys(data),
      dataLength: JSON.stringify(data).length,
      sample: data
    }
  } catch (e) {
    console.error('Data fetch error:', e)
    error.value = e.toString()
  } finally {
    loading.value = false
  }
}
</script>
