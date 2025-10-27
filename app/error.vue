<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps({
  error: {
    type: Object as PropType<NuxtError>,
    required: true
  }
})

useHead({ htmlAttrs: { lang: 'en' } })

useSeoMeta({
  title: 'Page not found',
  description: 'We are sorry but this page could not be found.'
})
</script>

<template>
  <div>
    <AppHeader />

    <UMain>
      <UContainer>
        <UPage>
          <div class="flex items-center justify-center min-h-[600px]">
            <UError :error="error" />
          </div>
        </UPage>
      </UContainer>
    </UMain>

    <AppFooter />

    <UToaster />
  </div>
</template>
