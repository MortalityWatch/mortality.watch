<script setup lang="ts">
import type { Country } from '@/model'
import type { CountrySourceInfo, SourceSegment } from '@/lib/explorer/sourceInfo'

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

const formatAgeGroups = (ageGroups: string[]): string => {
  return [...ageGroups].sort((a, b) => {
    const numA = parseInt(a.split('-')[0] || a.replace('+', '')) || 0
    const numB = parseInt(b.split('-')[0] || b.replace('+', '')) || 0
    return numA - numB
  }).join(', ')
}

const formatSegmentDateRange = (segment: SourceSegment): string => {
  if (segment.from === segment.to) return segment.from
  return `${segment.from}-${segment.to}`
}

const formatSegment = (segment: SourceSegment): string => {
  const parts = [`${formatSourceName(segment.source)} (${formatSegmentDateRange(segment)}`]

  if (showAgeGroupsInline.value && segment.ageGroups && segment.ageGroups.length > 0) {
    parts.push(formatAgeGroups(segment.ageGroups).replace(/, /g, '/'))
  }

  return `${parts.join(', ')})`
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

const hasSegmentedSources = computed(() => {
  return [...props.sourceInfo.values()].some(info => info.segments.length > 1)
})

const showAgeGroupsInline = computed(() => {
  return !!props.showAgeGroups
})

/**
 * Get the first source info for single-source display
 */
const firstSourceInfo = computed(() => {
  const values = [...props.sourceInfo.values()]
  return values[0]
})

const countryEntries = computed(() => {
  return [...props.sourceInfo.entries()]
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
      <template v-if="!hasSegmentedSources && isSingleSource && firstSourceInfo">
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

      <template v-else-if="!hasSegmentedSources">
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

      <template v-else>
        <div class="space-y-1">
          <div
            v-for="[iso3c, info] in countryEntries"
            :key="iso3c"
          >
            <div>
              <span class="font-medium">{{ getCountryName(iso3c) }}:</span>
              {{ info.segments.map(formatSegment).join('; ') }}
            </div>
            <div
              v-for="warning in info.breakpointWarnings"
              :key="warning"
              class="ml-2 text-amber-700 dark:text-amber-400"
            >
              {{ warning }}
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
