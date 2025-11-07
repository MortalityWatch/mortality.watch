<script setup lang="ts">
/**
 * Ranking Page
 *
 * Displays excess mortality rankings with sorting and filtering.
 *
 * Composables:
 * - useRankingState: Centralized state management
 * - useRankingData: Data fetching and processing
 * - useRankingTableSort: Table sorting logic
 *
 * Components:
 * - RankingHeader: Page title and description
 * - RankingActions: Action buttons (Explorer link, Save ranking)
 * - RankingSaveModal: Save ranking modal dialog
 */

import { computed, ref, onMounted } from 'vue'
import { loadCountryMetadata } from '@/lib/data'
import { useBrowserNavigation } from '@/composables/useBrowserNavigation'
import type { Country } from '@/model'
import type { ChartType } from '@/model/period'
import {
  standardPopulationItems,
  baselineMethodItems,
  decimalPrecisionItems,
  chartTypes,
  jurisdictionTypes
} from '@/model'
import { isMobile } from '@/utils'
import { greenColor } from '@/colors'
import { blDescription } from '@/lib/chart'
import { useRankingState } from '@/composables/useRankingState'
import { useRankingData } from '@/composables/useRankingData'
import { useRankingTableSort } from '@/composables/useRankingTableSort'
import { useCountryFilter } from '@/composables/useCountryFilter'
import { useSaveChart } from '@/composables/useSaveChart'
import { generateRankingTitle } from '@/lib/utils/chartTitles'
import RankingHeader from '@/components/ranking/RankingHeader.vue'
import RankingDataSelection from '@/components/ranking/RankingDataSelection.vue'
import SaveModal from '@/components/SaveModal.vue'
import ExplorerChartActions from '@/components/explorer/ExplorerChartActions.vue'

definePageMeta({
  ssr: false
})

// Auth state for conditional features
const { isAuthenticated } = useAuth()

// Tutorial for first-time users
const { autoStartTutorial } = useTutorial()

// Set page title
useSeoMeta({
  title: 'Excess Mortality Ranking - Mortality Watch',
  description: 'Compare excess mortality rates across countries and regions. Interactive ranking table with customizable time periods and metrics.'
})

// ============================================================================
// STATE MANAGEMENT - useRankingState composable
// ============================================================================

const state = useRankingState()

// Extract raw state properties from composable
const {
  periodOfTime,
  jurisdictionType,
  showASMR,
  showTotals,
  showTotalsOnly,
  showRelative,
  showPI,
  cumulative,
  hideIncomplete,
  standardPopulation,
  baselineMethod,
  decimalPrecision
} = state

// Create computed wrappers for template compatibility
const selectedPeriodOfTime = computed({
  get: () => {
    const items = periodOfTimeItems
    return items.find(x => x.value === periodOfTime.value) || items[0]!
  },
  set: (val: { label: string, name: string, value: string }) => {
    periodOfTime.value = val.value
  }
})

const selectedJurisdictionType = computed({
  get: () => {
    const items = jurisdictionTypeItems
    return items.find(x => x.value === jurisdictionType.value) || items[0]!
  },
  set: (val: { label: string, name: string, value: string }) => {
    jurisdictionType.value = val.value
  }
})

const selectedStandardPopulation = computed({
  get: () => {
    return standardPopulationItems.find(x => x.value === standardPopulation.value) || standardPopulationItems[0]!
  },
  set: (val) => {
    standardPopulation.value = val.value
  }
})

const selectedBaselineMethod = computed({
  get: () => {
    return baselineMethodItems.find(x => x.value === baselineMethod.value) || baselineMethodItems[2]!
  },
  set: (val) => {
    baselineMethod.value = val.value
  }
})

const selectedDecimalPrecision = computed({
  get: () => {
    return decimalPrecisionItems.find(x => x.value === decimalPrecision.value) || decimalPrecisionItems[1]!
  },
  set: (val) => {
    decimalPrecision.value = val.value
  }
})

// Items for select menus
const periodOfTimeItems = chartTypes
  .filter(x => ['yearly', 'fluseason', 'midyear', 'quarterly'].includes(x.value))
  .map(x => ({ label: x.name, name: x.name, value: x.value }))

const jurisdictionTypeItems = jurisdictionTypes.map(x => ({
  label: x.name,
  name: x.name,
  value: x.value
}))

// ============================================================================
// METADATA - Load country metadata
// ============================================================================

// Load all metadata on server, filter on client
const allMetaData = await loadCountryMetadata()

// Reactive filtering - only applies on client side
const metaData = computed(() => {
  const { filterCountries } = useCountryFilter()
  if (filterCountries.length === 0) return allMetaData

  const filtered: Record<string, Country> = {}
  for (const [iso, country] of Object.entries(allMetaData)) {
    if (filterCountries.includes(iso)) {
      filtered[iso] = country
    }
  }
  return filtered
})

// ============================================================================
// DATA ORCHESTRATION - useRankingData composable
// ============================================================================

// Additional state refs for compatibility
const hasLoaded = ref(false)
const sliderStart = ref('2020')

const {
  allLabels,
  visibleLabels,
  result,
  labels,
  allYearlyChartLabelsUnique,
  baselineRange,
  isUpdating,
  updateProgress,
  initialLoadDone,
  loadData,
  explorerLink,
  sliderChanged,
  baselineSliderChanged,
  periodOfTimeChanged
} = useRankingData(state, metaData, sliderStart)

// Computed: date picker labels (renamed from sliderValues for consistency with Explorer)
const datePickerLabels = computed(() => {
  return visibleLabels.value || []
})

const sliderValue = computed({
  get: () => [state.dateFrom.value, state.dateTo.value],
  set: (val: string[]) => sliderChanged(val)
})

// Use user-set baseline dates from URL if available, otherwise use computed defaults
const baselineSliderValue = computed({
  get: () => {
    const fromUrl = state.baselineDateFrom.value
    const toUrl = state.baselineDateTo.value

    // If both are set in URL, use them
    if (fromUrl && toUrl) {
      return [fromUrl, toUrl]
    }

    // Otherwise use computed baseline range (won't pollute URL)
    if (baselineRange.value) {
      return [baselineRange.value.from, baselineRange.value.to]
    }

    // Fallback to empty array if no baseline available yet
    return []
  },
  set: (val: string[]) => baselineSliderChanged(val)
})

const baselineSliderValues = () => {
  return allLabels.value
}

// ============================================================================
// TABLE SORTING - useRankingTableSort composable
// ============================================================================

const {
  sortField,
  sortOrder,
  currentPage,
  itemsPerPage,
  itemsPerPageOptions,
  toggleSort,
  getSortedResult,
  getPaginatedResult,
  getTotalPages
} = useRankingTableSort()

// Memoized sorting and pagination
const sortedResult = computed(() => getSortedResult(result.value))
const paginatedResult = computed(() => getPaginatedResult(sortedResult.value))
const totalPages = computed(() => getTotalPages(sortedResult.value))

// ============================================================================
// HELPER FUNCTIONS - Memoized
// ============================================================================

// Memoized title computation for performance
const title = computed(() => {
  let titleResult = 'Excess '

  if (showASMR.value)
    titleResult = isMobile()
      ? `${titleResult}ASMR`
      : `${titleResult}Age-Standardized Mortality Rate`
  else titleResult = isMobile() ? `${titleResult}CMR` : `${titleResult}Crude Mortality Rate`

  if (selectedJurisdictionType.value.value !== 'countries') {
    titleResult = `${titleResult} [${selectedJurisdictionType.value.name}]`
  }

  return cumulative.value ? `Cumulative ${titleResult}` : titleResult
})

const subtitle = computed(() => {
  return blDescription(
    selectedBaselineMethod.value?.value || 'mean',
    baselineSliderValue.value[0] || '',
    baselineSliderValue.value[1] || ''
  )
})

const displaySettings = computed(() => ({
  showTotals: showTotals.value,
  showRelative: showRelative.value,
  showPI: showPI.value,
  totalRowKey: 'TOTAL',
  selectedBaselineMethod: selectedBaselineMethod.value?.value || 'mean',
  decimalPrecision: selectedDecimalPrecision.value?.value || '1',
  subtitle: subtitle.value
}))

// ============================================================================
// LIFECYCLE
// ============================================================================

// Only load data on client-side after mount
onMounted(() => {
  hasLoaded.value = true
  // Auto-start tutorial for first-time users
  autoStartTutorial('ranking')
})

// Handle browser back/forward navigation
// Watches date/baseline query params and reloads data when they change
useBrowserNavigation({
  queryParams: ['df', 'dt', 'bf', 'bt'],
  onNavigate: loadData,
  isReady: initialLoadDone,
  isUpdating: isUpdating
})

// Save Ranking functionality using composable
const {
  showSaveModal,
  savingChart: savingRanking,
  saveChartName: saveRankingName,
  saveChartDescription: saveRankingDescription,
  saveChartPublic: saveRankingPublic,
  saveError,
  saveSuccess,
  saveToDB: saveToDBComposable
} = useSaveChart({
  chartType: 'ranking',
  generateDefaultTitle: () => generateRankingTitle({
    jurisdictionType: selectedJurisdictionType.value.value,
    dateFrom: sliderValue.value[0],
    dateTo: sliderValue.value[1],
    showASMR: showASMR.value,
    showTotalsOnly: showTotalsOnly.value
  })
})

// Memoized ranking state serialization
const rankingStateData = computed(() => ({
  // Main type selection
  a: showASMR.value,
  p: selectedPeriodOfTime.value.value,
  j: selectedJurisdictionType.value.value,

  // Date range
  df: sliderValue.value[0],
  dt: sliderValue.value[1],

  // Baseline settings
  bm: selectedBaselineMethod.value.value,
  bf: baselineSliderValue.value[0],
  bt: baselineSliderValue.value[1],

  // Display options
  sp: selectedStandardPopulation.value.value,
  dp: selectedDecimalPrecision.value.value,
  t: showTotals.value,
  to: showTotalsOnly.value,
  r: showRelative.value,
  pi: showPI.value,
  c: cumulative.value,
  i: !hideIncomplete.value,

  // Sort settings
  sortField: sortField.value,
  sortOrder: sortOrder.value,
  currentPage: currentPage.value,
  itemsPerPage: itemsPerPage.value
}))

// Wrapper function to serialize state and call composable
const saveToDB = async () => {
  await saveToDBComposable(rankingStateData.value)
}

// Chart actions for ranking
const copyRankingLink = () => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        const toast = useToast()
        toast.add({
          title: 'Link copied to clipboard',
          color: 'success'
        })
      })
      .catch(err => console.error('Failed to copy:', err))
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <RankingHeader />

    <div class="flex flex-col gap-6 mx-auto">
      <LoadingSpinner
        v-if="!hasLoaded"
        text="Loading ranking data..."
        height="h-64"
        size="xl"
      />

      <div
        v-if="hasLoaded"
        class="flex flex-col lg:flex-row gap-4"
      >
        <!-- Data Selection - First on mobile -->
        <div class="order-1 lg:order-2 lg:hidden">
          <RankingDataSelection
            v-model:selected-jurisdiction-type="selectedJurisdictionType"
            v-model:slider-start="sliderStart"
            :selected-period-of-time="selectedPeriodOfTime"
            :period-of-time-items="periodOfTimeItems"
            :jurisdiction-type-items="jurisdictionTypeItems"
            :all-yearly-chart-labels-unique="allYearlyChartLabelsUnique"
            :all-labels="allLabels"
            :slider-value="sliderValue"
            :labels="datePickerLabels"
            :is-updating="isUpdating"
            :selected-baseline-method="selectedBaselineMethod"
            data-tour="ranking-data-selection-mobile"
            @period-of-time-changed="periodOfTimeChanged"
            @slider-changed="sliderChanged"
          />
        </div>

        <!-- Ranking Table - Second on mobile, first on large screens -->
        <div class="order-2 lg:order-1 flex-1">
          <UCard data-tour="ranking-table">
            <template #header>
              <h2 class="text-xl font-semibold">
                {{ title }}
              </h2>
            </template>

            <RankingTable
              :data="{
                labels: labels || [],
                paginatedResult: paginatedResult || [],
                sortedResult: sortedResult || []
              }"
              :display="displaySettings"
              :sort="{ field: sortField, order: sortOrder }"
              :pagination="{
                currentPage,
                itemsPerPage,
                options: itemsPerPageOptions,
                totalPages
              }"
              :loading="{ isUpdating, hasLoaded, progress: updateProgress, initialLoadDone }"
              @toggle-sort="toggleSort"
              @update:current-page="(val) => currentPage = val"
              @update:items-per-page="(val) => itemsPerPage = val"
            />
          </UCard>
        </div>

        <!-- Right Sidebar (Desktop only) - contains Data Selection + Settings -->
        <div class="hidden lg:flex lg:flex-col lg:gap-4 lg:order-2 lg:w-[420px] shrink-0">
          <RankingDataSelection
            v-model:selected-jurisdiction-type="selectedJurisdictionType"
            v-model:slider-start="sliderStart"
            :selected-period-of-time="selectedPeriodOfTime"
            :period-of-time-items="periodOfTimeItems"
            :jurisdiction-type-items="jurisdictionTypeItems"
            :all-yearly-chart-labels-unique="allYearlyChartLabelsUnique"
            :all-labels="allLabels"
            :slider-value="sliderValue"
            :labels="datePickerLabels"
            :is-updating="isUpdating"
            :selected-baseline-method="selectedBaselineMethod"
            data-tour="ranking-data-selection"
            @period-of-time-changed="periodOfTimeChanged"
            @slider-changed="sliderChanged"
          />

          <RankingSettings
            v-model:show-a-s-m-r="showASMR"
            v-model:selected-standard-population="selectedStandardPopulation"
            v-model:show-totals="showTotals"
            v-model:show-totals-only="showTotalsOnly"
            v-model:hide-incomplete="hideIncomplete"
            v-model:show-relative="showRelative"
            v-model:cumulative="cumulative"
            v-model:show-p-i="showPI"
            v-model:selected-baseline-method="selectedBaselineMethod"
            v-model:selected-decimal-precision="selectedDecimalPrecision"
            :is-updating="isUpdating"
            :all-labels="allLabels"
            :baseline-slider-value="baselineSliderValue"
            :baseline-slider-values="baselineSliderValues"
            :green-color="greenColor"
            :chart-type="(selectedPeriodOfTime?.value || 'yearly') as ChartType"
            @baseline-slider-changed="baselineSliderChanged"
          />

          <!-- Ranking Actions Card -->
          <ExplorerChartActions
            class="mt-4"
            :show-save-button="!isAuthenticated"
            :show-download-chart="false"
            :show-screenshot="false"
            :explorer-link="explorerLink()"
            data-tour="ranking-actions"
            @copy-link="copyRankingLink"
            @save-chart="navigateTo('/signup')"
          >
            <template #title>
              Ranking Actions
            </template>
            <template
              v-if="isAuthenticated"
              #save-button
            >
              <SaveModal
                v-model="showSaveModal"
                v-model:name="saveRankingName"
                v-model:description="saveRankingDescription"
                v-model:is-public="saveRankingPublic"
                :saving="savingRanking"
                :error="saveError"
                :success="saveSuccess"
                type="ranking"
                :generate-default-title="() => generateRankingTitle({
                  jurisdictionType: selectedJurisdictionType.value.value,
                  dateFrom: sliderValue.value[0],
                  dateTo: sliderValue.value[1],
                  showASMR: showASMR.value,
                  showTotalsOnly: showTotalsOnly.value
                })"
                data-tour="ranking-save-button"
                @save="saveToDB"
              />
            </template>
          </ExplorerChartActions>
        </div>

        <!-- Settings - Third on mobile only -->
        <div class="order-3 lg:hidden">
          <RankingSettings
            v-model:show-a-s-m-r="showASMR"
            v-model:selected-standard-population="selectedStandardPopulation"
            v-model:show-totals="showTotals"
            v-model:show-totals-only="showTotalsOnly"
            v-model:hide-incomplete="hideIncomplete"
            v-model:show-relative="showRelative"
            v-model:cumulative="cumulative"
            v-model:show-p-i="showPI"
            v-model:selected-baseline-method="selectedBaselineMethod"
            v-model:selected-decimal-precision="selectedDecimalPrecision"
            :is-updating="isUpdating"
            :all-labels="allLabels"
            :baseline-slider-value="baselineSliderValue"
            :baseline-slider-values="baselineSliderValues"
            :green-color="greenColor"
            :chart-type="(selectedPeriodOfTime?.value || 'yearly') as ChartType"
            @baseline-slider-changed="baselineSliderChanged"
          />

          <!-- Ranking Actions Card - Mobile -->
          <ExplorerChartActions
            class="mt-4"
            :show-save-button="!isAuthenticated"
            :show-download-chart="false"
            :show-screenshot="false"
            :explorer-link="explorerLink()"
            @copy-link="copyRankingLink"
            @save-chart="navigateTo('/signup')"
          >
            <template #title>
              Ranking Actions
            </template>
            <template
              v-if="isAuthenticated"
              #save-button
            >
              <SaveModal
                v-model="showSaveModal"
                v-model:name="saveRankingName"
                v-model:description="saveRankingDescription"
                v-model:is-public="saveRankingPublic"
                :saving="savingRanking"
                :error="saveError"
                :success="saveSuccess"
                type="ranking"
                :generate-default-title="() => generateRankingTitle({
                  jurisdictionType: selectedJurisdictionType.value.value,
                  dateFrom: sliderValue.value[0],
                  dateTo: sliderValue.value[1],
                  showASMR: showASMR.value,
                  showTotalsOnly: showTotalsOnly.value
                })"
                data-tour="ranking-save-button"
                @save="saveToDB"
              />
            </template>
          </ExplorerChartActions>
        </div>
      </div>
    </div>
  </div>
</template>
