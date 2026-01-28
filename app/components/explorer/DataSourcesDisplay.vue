<script setup lang="ts">
import type { CountrySourceInfo } from '@/composables/useExplorerDataOrchestration'
import type { Country } from '@/model'

const props = defineProps<{
  /** Map of country ISO3C code to source info */
  sourceInfo: Map<string, CountrySourceInfo>
  /** All countries for looking up names */
  allCountries: Record<string, Country>
  /** Whether the current metric uses age stratification (ASD, ASMR, LE) */
  showAgeGroups?: boolean
}>()

/**
 * Format source name for display (capitalize, replace underscores)
 */
const formatSourceName = (source: string): string => {
  const sourceNames: Record<string, string> = {
    un: 'UN Population Division',
    eurostat: 'Eurostat',
    mortality_org: 'Human Mortality Database',
    world_mortality: 'World Mortality Dataset',
    cdc: 'CDC Wonder',
    statcan: 'Statistics Canada',
    destatis: 'Destatis',
    hmd: 'Human Mortality Database',
    who: 'WHO'
  }
  return sourceNames[source] || source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Get country name from ISO code
 */
const getCountryName = (iso3c: string): string => {
  return props.allCountries[iso3c]?.jurisdiction || iso3c
}

/**
 * Format age groups for display
 */
const formatAgeGroups = (ageGroups: string[]): string => {
  if (!ageGroups || ageGroups.length === 0) return ''
  // Sort numerically by first number in range
  const sorted = [...ageGroups].sort((a, b) => {
    const numA = parseInt(a.split('-')[0] || a.replace('+', '')) || 0
    const numB = parseInt(b.split('-')[0] || b.replace('+', '')) || 0
    return numA - numB
  })
  return sorted.join(', ')
}

/**
 * Group countries by source for cleaner display
 */
const groupedBySource = computed(() => {
  const groups = new Map<string, { source: string, countries: string[], ageGroups?: string[] }>()

  for (const [iso3c, info] of props.sourceInfo) {
    const key = info.source + (info.ageGroups ? `|${info.ageGroups.join(',')}` : '')
    const existing = groups.get(key)
    if (existing) {
      existing.countries.push(iso3c)
    } else {
      groups.set(key, { source: info.source, countries: [iso3c], ageGroups: info.ageGroups })
    }
  }

  return groups
})

/**
 * Check if all countries use the same source (and same age groups)
 */
const isSingleSource = computed(() => {
  return groupedBySource.value.size === 1
})

/**
 * Get the first source info for single-source display
 */
const firstSourceInfo = computed(() => {
  const values = [...props.sourceInfo.values()]
  return values[0]
})
</script>

<template>
  <div
    v-if="sourceInfo.size > 0"
    class="mt-2"
  >
    <div class="text-xs text-gray-500 dark:text-gray-400">
      <!-- Header -->
      <div class="font-medium text-gray-600 dark:text-gray-300 mb-1">
        Data Sources
      </div>

      <!-- Source info -->
      <template v-if="isSingleSource && firstSourceInfo">
        <!-- Single source for all countries -->
        <div>
          {{ formatSourceName(firstSourceInfo.source) }}
        </div>
        <div
          v-if="showAgeGroups && firstSourceInfo.ageGroups && firstSourceInfo.ageGroups.length > 0"
          class="mt-0.5"
        >
          <span class="text-gray-400 dark:text-gray-500">Age stratification:</span>
          {{ formatAgeGroups(firstSourceInfo.ageGroups) }}
        </div>
      </template>

      <template v-else>
        <!-- Multiple sources - list by source -->
        <div class="space-y-1">
          <div
            v-for="[key, group] in groupedBySource"
            :key="key"
          >
            <div>
              <span class="font-medium">{{ formatSourceName(group.source) }}</span>:
              {{ group.countries.map(getCountryName).join(', ') }}
            </div>
            <div
              v-if="showAgeGroups && group.ageGroups && group.ageGroups.length > 0"
              class="ml-2 text-gray-400 dark:text-gray-500"
            >
              Age stratification: {{ formatAgeGroups(group.ageGroups) }}
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
