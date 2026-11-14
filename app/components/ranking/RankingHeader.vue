<script setup lang="ts">
/**
 * RankingHeader Component
 *
 * Displays the page title and description for the ranking page.
 */
import { computed } from 'vue'
import { getJurisdictionNoun } from '@/lib/utils/jurisdictionLabels'

interface Props {
  displayMode?: 'absolute' | 'relative'
  jurisdictionType?: string
}

const props = withDefaults(defineProps<Props>(), {
  displayMode: 'relative',
  jurisdictionType: 'countries'
})

const isAbsolute = computed(() => props.displayMode === 'absolute')
const rowNounSingular = computed(() => getJurisdictionNoun(props.jurisdictionType))

const pageTitle = computed(() =>
  isAbsolute.value ? 'Mortality Ranking' : 'Excess Mortality Ranking'
)

const description = computed(() =>
  isAbsolute.value
    ? 'Compare mortality rates and life expectancy across all available countries and regions.'
    : 'Compare excess mortality across all available countries and regions. Countries are ranked by total excess mortality for the selected period.'
)
</script>

<template>
  <PageHeader
    :title="pageTitle"
    max-width="lg"
  >
    <p>{{ description }}</p>
    <p>
      Click on a {{ rowNounSingular }} name to jump directly to the
      <NuxtLink
        to="/explorer"
        class="text-primary hover:underline"
      >
        Explorer
      </NuxtLink>
      for detailed time-series analysis and visualization.
    </p>
  </PageHeader>
</template>
