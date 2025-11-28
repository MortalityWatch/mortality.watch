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

import { computed, ref, onMounted, watch } from 'vue'
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
import ChartActions from '@/components/charts/ChartActions.vue'
import Papa from 'papaparse'

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
  showPercentage,
  showPI,
  cumulative,
  hideIncomplete,
  standardPopulation,
  baselineMethod,
  decimalPrecision
} = state

// Alias state values directly for template - child components now use primitive v-model
const selectedPeriodOfTime = periodOfTime
const selectedJurisdictionType = jurisdictionType
const selectedStandardPopulation = standardPopulation
const selectedBaselineMethod = baselineMethod
const selectedDecimalPrecision = decimalPrecision

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
const sliderStart = ref('2010')

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
  periodOfTimeChanged
} = useRankingData(state, metaData, sliderStart)

// Computed: date picker labels (renamed from sliderValues for consistency with Explorer)
const datePickerLabels = computed(() => {
  return visibleLabels.value || []
})

// Handle date slider changes - matches explorer.vue pattern
const dateSliderChanged = async (val: string[]) => {
  // IMPORTANT: Batch both updates into a single router.push to avoid race condition
  // where the second update overwrites the first with stale route data
  const route = useRoute()
  const router = useRouter()
  const newQuery = { ...route.query }
  newQuery.df = val[0]!
  newQuery.dt = val[1]!

  await router.push({ query: newQuery })
}

// Handle baseline slider changes - matches explorer.vue pattern
const baselineSliderChangedWrapper = async (val: string[]) => {
  // IMPORTANT: Batch both updates into a single router.push to avoid race condition
  const route = useRoute()
  const router = useRouter()
  const newQuery = { ...route.query }
  newQuery.bf = val[0]!
  newQuery.bt = val[1]!

  await router.push({ query: newQuery })
}

// Adapter: Convert separate date refs to array format for DateSlider component
// Uses default range (2019/20 to latest) when dates are undefined
const sliderValue = computed((): string[] => {
  const labels = visibleLabels.value

  // Calculate default range: from 2019/20 (or earliest available) to latest
  let defaultFrom: string | undefined
  let defaultTo: string | undefined

  if (labels.length > 0) {
    // Find the index for 2019/20 (or closest match)
    const chartType = state.periodOfTime.value || 'fluseason'
    const targetStart = chartType === 'yearly' ? '2019' : '2019/20'

    // Find index of target start date or closest available
    const startIndex = labels.findIndex(label => label >= targetStart)
    const actualStartIndex = startIndex >= 0 ? startIndex : 0

    defaultFrom = labels[actualStartIndex]
    defaultTo = labels[labels.length - 1]
  }

  // If user has set dates, use them; otherwise use defaults (if available)
  const from = state.dateFrom.value ?? (defaultFrom || undefined)
  const to = state.dateTo.value ?? (defaultTo || undefined)

  // Filter out undefined values
  return [from, to].filter((d): d is string => d !== undefined)
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
  set: (val: string[]) => baselineSliderChangedWrapper(val)
})

// Baseline slider respects the sliderStart filter (uses visibleLabels, not allLabels)
// User can select any baseline range they want - no automatic constraints
const baselineSliderValues = () => {
  // Use visibleLabels (filtered by sliderStart) instead of allLabels
  // This ensures baseline slider respects the "From" year dropdown filter
  return visibleLabels.value
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

  if (selectedJurisdictionType.value !== 'countries') {
    // Look up the display name from the items array
    const jurisdictionItem = jurisdictionTypeItems.find(x => x.value === selectedJurisdictionType.value)
    titleResult = `${titleResult} [${jurisdictionItem?.name || selectedJurisdictionType.value}]`
  }

  return cumulative.value ? `Cumulative ${titleResult}` : titleResult
})

const subtitle = computed(() => {
  return blDescription(
    selectedBaselineMethod.value || 'mean',
    baselineSliderValue.value[0] || '',
    baselineSliderValue.value[1] || ''
  )
})

const displaySettings = computed(() => ({
  showTotals: showTotals.value,
  showPercentage: showPercentage.value,
  showPI: showPI.value,
  totalRowKey: 'TOTAL',
  selectedBaselineMethod: selectedBaselineMethod.value || 'mean',
  decimalPrecision: selectedDecimalPrecision.value || '1',
  subtitle: subtitle.value
}))

// ============================================================================
// LIFECYCLE
// ============================================================================

// Only load data on client-side after mount
onMounted(() => {
  hasLoaded.value = true
  // Auto-start tutorial for first-time users (skip if skipTutorial query param is present)
  const route = useRoute()
  if (!route.query.skipTutorial) {
    autoStartTutorial('ranking')
  }
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
  isSaved,
  isModified,
  savedChartSlug,
  savedChartId: _savedChartId,
  buttonLabel,
  isButtonDisabled,
  markAsModified,
  resetSavedState: _resetSavedState,
  saveToDB: saveToDBComposable,
  isDuplicate,
  existingChart
} = useSaveChart({
  chartType: 'ranking',
  generateDefaultTitle: () => generateRankingTitle({
    jurisdictionType: selectedJurisdictionType.value,
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
  p: selectedPeriodOfTime.value,
  j: selectedJurisdictionType.value,

  // Date range
  df: sliderValue.value[0],
  dt: sliderValue.value[1],

  // Baseline settings
  bm: selectedBaselineMethod.value,
  bf: baselineSliderValue.value[0],
  bt: baselineSliderValue.value[1],

  // Display options
  sp: selectedStandardPopulation.value,
  dp: selectedDecimalPrecision.value,
  t: showTotals.value,
  to: showTotalsOnly.value,
  r: showPercentage.value,
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

// Generate default title for ranking charts
const getDefaultRankingTitle = () => {
  return generateRankingTitle({
    jurisdictionType: selectedJurisdictionType.value,
    dateFrom: sliderValue.value[0],
    dateTo: sliderValue.value[1],
    showASMR: showASMR.value,
    showTotalsOnly: showTotalsOnly.value
  })
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

// Export ranking data as CSV
const exportCSV = () => {
  try {
    if (!sortedResult.value || sortedResult.value.length === 0 || !labels.value || labels.value.length === 0) {
      const toast = useToast()
      toast.add({ title: 'No data to export', color: 'error' })
      return
    }

    // Prepare data rows - map each row with country and all period columns
    const rows = sortedResult.value.map((row) => {
      const rowData: Record<string, string | number | undefined> = {
        'Country': row.country,
        'ISO Code': row.iso2c
      }

      // Add all period columns
      if (labels.value) {
        labels.value.forEach((label) => {
          rowData[label] = row[label]
        })
      }

      return rowData
    })

    // Generate CSV
    const csv = Papa.unparse(rows)

    // Download file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `ranking-${Date.now()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    const toast = useToast()
    toast.add({ title: 'CSV exported successfully!', color: 'success' })
  } catch (error) {
    console.error('Failed to export CSV:', error)
    const toast = useToast()
    toast.add({ title: 'Failed to export CSV', color: 'error' })
  }
}

// Export ranking data as JSON
const exportJSON = () => {
  try {
    if (!sortedResult.value || sortedResult.value.length === 0 || !labels.value || labels.value.length === 0) {
      const toast = useToast()
      toast.add({ title: 'No data to export', color: 'error' })
      return
    }

    // Prepare export data
    const exportData = {
      metadata: {
        title: title.value,
        subtitle: subtitle.value,
        periods: labels.value,
        exportedAt: new Date().toISOString(),
        url: window.location.href
      },
      data: sortedResult.value.map((row) => {
        const rowData: Record<string, string | number | undefined> = {
          country: row.country,
          isoCode: row.iso2c
        }

        // Add all period columns
        if (labels.value) {
          labels.value.forEach((label) => {
            rowData[label] = row[label]
          })
        }

        return rowData
      })
    }

    // Generate JSON string
    const json = JSON.stringify(exportData, null, 2)

    // Download file
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `ranking-${Date.now()}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    const toast = useToast()
    toast.add({ title: 'JSON exported successfully!', color: 'success' })
  } catch (error) {
    console.error('Failed to export JSON:', error)
    const toast = useToast()
    toast.add({ title: 'Failed to export JSON', color: 'error' })
  }
}

// Watch for state changes to mark ranking as modified
watch(
  [
    showASMR,
    selectedPeriodOfTime,
    selectedJurisdictionType,
    sliderValue,
    selectedBaselineMethod,
    baselineSliderValue,
    selectedStandardPopulation,
    selectedDecimalPrecision,
    showTotals,
    showTotalsOnly,
    showPercentage,
    showPI,
    cumulative,
    hideIncomplete,
    sortField,
    sortOrder
  ],
  () => {
    markAsModified()
  },
  { deep: true }
)
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
            @slider-changed="dateSliderChanged"
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
            @slider-changed="dateSliderChanged"
          />

          <RankingSettings
            v-model:show-a-s-m-r="showASMR"
            v-model:selected-standard-population="selectedStandardPopulation"
            v-model:show-totals="showTotals"
            v-model:show-totals-only="showTotalsOnly"
            v-model:hide-incomplete="hideIncomplete"
            v-model:show-percentage="showPercentage"
            v-model:cumulative="cumulative"
            v-model:show-p-i="showPI"
            v-model:selected-baseline-method="selectedBaselineMethod"
            v-model:selected-decimal-precision="selectedDecimalPrecision"
            :is-updating="isUpdating"
            :all-labels="allLabels"
            :baseline-slider-value="baselineSliderValue"
            :baseline-slider-values="baselineSliderValues"
            :green-color="greenColor"
            :chart-type="(selectedPeriodOfTime || 'yearly') as ChartType"
            @baseline-slider-changed="baselineSliderChangedWrapper"
          />

          <!-- Ranking Actions Card -->
          <ChartActions
            class="mt-4"
            :show-save-button="!isAuthenticated"
            :show-download-chart="false"
            :show-screenshot="false"
            :explorer-link="explorerLink()"
            data-tour="ranking-actions"
            @copy-link="copyRankingLink"
            @save-chart="navigateTo('/signup')"
            @export-c-s-v="exportCSV"
            @export-j-s-o-n="exportJSON"
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
                :is-saved="isSaved"
                :is-modified="isModified"
                :saved-chart-slug="savedChartSlug"
                :is-button-disabled="isButtonDisabled"
                :button-label="buttonLabel"
                :is-duplicate="isDuplicate"
                :existing-chart="existingChart"
                type="ranking"
                :generate-default-title="getDefaultRankingTitle"
                data-tour="ranking-save-button"
                @save="saveToDB"
              />
            </template>
          </ChartActions>
        </div>

        <!-- Settings - Third on mobile only -->
        <div class="order-3 lg:hidden">
          <RankingSettings
            v-model:show-a-s-m-r="showASMR"
            v-model:selected-standard-population="selectedStandardPopulation"
            v-model:show-totals="showTotals"
            v-model:show-totals-only="showTotalsOnly"
            v-model:hide-incomplete="hideIncomplete"
            v-model:show-percentage="showPercentage"
            v-model:cumulative="cumulative"
            v-model:show-p-i="showPI"
            v-model:selected-baseline-method="selectedBaselineMethod"
            v-model:selected-decimal-precision="selectedDecimalPrecision"
            :is-updating="isUpdating"
            :all-labels="allLabels"
            :baseline-slider-value="baselineSliderValue"
            :baseline-slider-values="baselineSliderValues"
            :green-color="greenColor"
            :chart-type="(selectedPeriodOfTime || 'yearly') as ChartType"
            @baseline-slider-changed="baselineSliderChangedWrapper"
          />

          <!-- Ranking Actions Card - Mobile -->
          <ChartActions
            class="mt-4"
            :show-save-button="!isAuthenticated"
            :show-download-chart="false"
            :show-screenshot="false"
            :explorer-link="explorerLink()"
            @copy-link="copyRankingLink"
            @save-chart="navigateTo('/signup')"
            @export-c-s-v="exportCSV"
            @export-j-s-o-n="exportJSON"
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
                :is-saved="isSaved"
                :is-modified="isModified"
                :saved-chart-slug="savedChartSlug"
                :is-button-disabled="isButtonDisabled"
                :button-label="buttonLabel"
                :is-duplicate="isDuplicate"
                :existing-chart="existingChart"
                type="ranking"
                :generate-default-title="getDefaultRankingTitle"
                data-tour="ranking-save-button"
                @save="saveToDB"
              />
            </template>
          </ChartActions>
        </div>
      </div>
    </div>
  </div>
</template>
