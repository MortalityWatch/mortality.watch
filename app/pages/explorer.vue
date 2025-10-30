<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  ref
} from 'vue'
import { useChartResize } from '@/composables/useChartResize'
import { useExplorerHelpers } from '@/composables/useExplorerHelpers'
import { useExplorerState } from '@/composables/useExplorerState'
import { useDataAvailability } from '@/composables/useDataAvailability'
import { useExplorerDataOrchestration } from '@/composables/useExplorerDataOrchestration'
import { useExplorerColors } from '@/composables/useExplorerColors'
import { useExplorerChartActions } from '@/composables/useExplorerChartActions'
import type {
  Country
} from '@/model'
import type { ChartType } from '@/model/period'
import {
  loadCountryMetadata
} from '@/lib/data'
import ExplorerDataSelection from '@/components/explorer/ExplorerDataSelection.vue'
import ExplorerChartContainer from '@/components/explorer/ExplorerChartContainer.vue'
import ExplorerSettings from '@/components/explorer/ExplorerSettings.vue'
import ExplorerChartActions from '@/components/explorer/ExplorerChartActions.vue'
import ExplorerSaveChartModal from '@/components/explorer/ExplorerSaveChartModal.vue'

// Feature access for tier-based features (currently unused but may be needed in the future)
// const { can, getFeatureUpgradeUrl } = useFeatureAccess()

// Auth state for conditional features
const { isAuthenticated } = useAuth()

// Phase 9.2: Centralized state management with validation
const state = useExplorerState()

// Phase 9.4: Data availability checks with auto-correction
const _availability = useDataAvailability(state)

// Dynamic OG images based on current chart state
const chartState = computed(() => ({
  countries: state.countries.value,
  type: state.type.value,
  chartType: state.chartType.value,
  isExcess: state.isExcess.value,
  ageGroups: state.ageGroups.value,
  chartStyle: state.chartStyle.value
}))

const { ogImageUrl, ogTitle, ogDescription } = useChartOgImage(chartState)

useSeoMeta({
  title: ogTitle,
  description: ogDescription,
  ogImage: ogImageUrl,
  twitterCard: 'summary_large_image'
})

// Helper Functions - use composable
const {
  isAsmrType,
  isPopulationType,
  isLifeExpectancyType,
  isDeathsType,
  isErrorBarType,
  hasBaseline,
  isLineChartStyle,
  isBarChartStyle,
  isMatrixChartStyle,
  getMaxCountriesAllowed,
  isYearlyChartType: _isYearlyChartType,
  showCumPi,
  getBaseKeysForType,
  showPredictionIntervalDisabled
} = useExplorerHelpers(
  state.type,
  state.chartStyle,
  state.isExcess,
  state.standardPopulation,
  state.countries,
  state.cumulative,
  state.baselineMethod,
  state.showBaseline,
  state.chartType
)

// Computed
const sliderValue = computed(() => [state.dateFrom.value, state.dateTo.value])

// Get color mode for theme reactivity
const colorMode = useColorMode()

// Phase 5a: Colors management extracted to composable
const { displayColors } = useExplorerColors(
  state.countries,
  state.userColors,
  colorMode
)

// Load Data - must be declared before data orchestration composable
const allCountries = ref<Record<string, Country>>({})
const isDataLoaded = ref(false)
const allAgeGroups = computed(() => {
  const result = new Set<string>()
  state.countries.value.forEach((countryCode: string) => {
    const country = allCountries.value[countryCode]
    if (country) {
      country.age_groups().forEach((ag: string) => result.add(ag))
    }
  })
  return Array.from(result)
})

// Phase 9.2: Data orchestration composable
const dataOrchestration = useExplorerDataOrchestration(
  state,
  {
    isAsmrType,
    isPopulationType,
    isLifeExpectancyType,
    isDeathsType,
    isErrorBarType,
    hasBaseline,
    isLineChartStyle,
    isBarChartStyle,
    isMatrixChartStyle,
    getMaxCountriesAllowed,
    isYearlyChartType: _isYearlyChartType,
    showCumPi,
    getBaseKeysForType,
    showPredictionIntervalDisabled
  },
  allCountries,
  displayColors
)

// Destructure data orchestration (prefix unused with _ to satisfy linter)
const {
  allChartLabels: _allChartLabels,
  allYearlyChartLabels: _allYearlyChartLabels,
  allYearlyChartLabelsUnique: _allYearlyChartLabelsUnique,
  allChartData: _allChartData,
  chartData: _chartData,
  isUpdating: _isUpdating,
  showLoadingOverlay: _showLoadingOverlay,
  chartOptions: _chartOptions,
  updateData
} = dataOrchestration

const dateSliderChanged = async (val: string[]) => {
  // Update URL state - useUrlState now handles optimistic updates internally
  state.dateFrom.value = val[0]!
  state.dateTo.value = val[1]!

  update('dateRange')
}

const labels = computed(() => dataOrchestration.allChartData?.labels || dataOrchestration.allChartLabels.value || [])

// Make Chart resizeable - use composable
const {
  chartContainer,
  showSizeLabel,
  hasBeenResized,
  chartWidth: _chartWidth,
  chartHeight: _chartHeight,
  chartPreset: _chartPreset,
  containerSize,
  isAutoMode: _isAutoMode,
  isCustomMode,
  applyPresetSize,
  setupResizeObserver
} = useChartResize()

const handleUpdate = async (key: string) => {
  if (state.countries.value.length) {
    const shouldDownloadDataset = ['_countries', '_type', '_chartType', '_ageGroups'].includes(key)
    const shouldUpdateDataset = [
      '_baselineMethod',
      '_standardPopulation',
      '_baselineDateFrom',
      '_baselineDateTo',
      '_sliderStart'
    ].includes(key)
    || (state.baselineMethod.value !== 'auto' && key === '_cumulative')

    // Options that affect chart rendering but don't need data redownload
    const needsFilterUpdate = [
      'dateRange', // Date range is just a filter, not a data download
      '_chartStyle',
      '_isExcess',
      '_showBaseline',
      '_cumulative',
      '_showPredictionInterval',
      '_showPercentage',
      '_showTotal',
      '_isLogarithmic',
      '_maximize',
      '_showLabels',
      '_userColors'
    ].includes(key)

    // Always call updateData if any trigger is true OR if it's a filter update
    if (shouldDownloadDataset || shouldUpdateDataset || needsFilterUpdate) {
      await updateData(shouldDownloadDataset, shouldUpdateDataset)
    }
  }

  if (dataOrchestration.chartData.value) {
    if (key === '_maximize') dataOrchestration.chartData.value.isMaximized = state.maximize.value
    if (key === '_showLabels') dataOrchestration.chartData.value.showLabels = state.showLabels.value
  }
}

// Prevent concurrent updates
let isCurrentlyUpdating = false
let pendingUpdateKey: string | null = null

const update = async (key: string) => {
  // If already updating, queue this update
  if (isCurrentlyUpdating) {
    pendingUpdateKey = key
    return
  }

  isCurrentlyUpdating = true
  try {
    await handleUpdate(key)

    // Process any pending update
    if (pendingUpdateKey) {
      const nextKey = pendingUpdateKey
      pendingUpdateKey = null
      await handleUpdate(nextKey)
    }
  } finally {
    isCurrentlyUpdating = false
  }
}

// Phase 9.2: Event handlers replaced with direct state updates
// Helper function for state updates with nextTick
const updateStateAndRefresh = async (updateFn: () => void, key: string) => {
  updateFn()
  await nextTick()
  update(key)
}

// Special handler for chart preset (local state, not URL)
const handleChartPresetChanged = (v: string) => {
  state.chartPreset.value = v
  applyPresetSize(v)
}

onMounted(async () => {
  // Initialize data - load all, client-side filtering happens via useCountryFilter
  const allMetadata = await loadCountryMetadata()

  // Apply client-side filtering
  const { filterCountries } = useCountryFilter()
  if (filterCountries.length > 0) {
    const filtered: Record<string, Country> = {}
    for (const [iso, country] of Object.entries(allMetadata)) {
      if (filterCountries.includes(iso)) {
        filtered[iso] = country
      }
    }
    allCountries.value = filtered
  } else {
    allCountries.value = allMetadata
  }

  // Only update data if we have countries selected
  if (state.countries.value && state.countries.value.length > 0) {
    await updateData(true, true)
  }

  isDataLoaded.value = true
  await update('dateFrom')

  // Chart dimensions are session-only now (not restored from URL)
  // They'll be set if user resizes during the session

  // Setup resize observer for drag resizing (only if not in Auto mode)
  setupResizeObserver()
})

// Phase 5a: Chart actions extracted to composable
const {
  copyChartLink,
  screenshotChart,
  saveToDB,
  showSaveModal,
  savingChart,
  saveChartName,
  saveChartDescription,
  saveChartPublic,
  saveError,
  saveSuccess
} = useExplorerChartActions(state)

// Download chart as PNG (for social media/OG image)
const downloadChart = () => {
  const url = window.location.href.replaceAll('/?', '/chart.png?').replaceAll('/explorer?', '/chart.png?')
  window.open(url, '_blank')
}
</script>

<template>
  <div class="w-full px-4 pt-8 pb-4">
    <!-- Show loading state while data is being loaded -->
    <LoadingSpinner
      v-if="!isDataLoaded"
      text="Loading explorer data..."
      height="min-h-[600px]"
    />

    <!-- Main content once data is loaded -->
    <div
      v-else
      class="flex flex-col gap-3"
    >
      <ExplorerDataSelection
        :all-countries="allCountries"
        :all-age-groups="allAgeGroups"
        :countries="state.countries.value"
        :age-groups="state.ageGroups.value"
        :is-asmr-type="isAsmrType()"
        :is-life-expectancy-type="isLifeExpectancyType()"
        :is-updating="false"
        :max-countries-allowed="getMaxCountriesAllowed()"
        :slider-value="sliderValue"
        :labels="labels"
        :slider-start="state.sliderStart.value"
        :all-yearly-chart-labels-unique="dataOrchestration.allYearlyChartLabelsUnique.value"
        :chart-type="state.chartType.value as ChartType"
        @countries-changed="(v) => updateStateAndRefresh(() => state.countries.value = v, '_countries')"
        @age-groups-changed="(v) => updateStateAndRefresh(() => state.ageGroups.value = v, '_ageGroups')"
        @slider-start-changed="(v) => updateStateAndRefresh(() => state.sliderStart.value = v, '_sliderStart')"
        @date-slider-changed="dateSliderChanged"
      />

      <!-- Main content area with responsive layout -->
      <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:gap-4">
        <!-- Chart section - takes up available space on large screens -->
        <div class="flex-1 min-w-0 flex-shrink-0">
          <ExplorerChartContainer
            ref="chartContainer"
            :countries="state.countries.value"
            :chart-data="dataOrchestration.chartData.value"
            :chart-style="state.chartStyle.value"
            :is-excess="state.isExcess.value"
            :is-life-expectancy-type="isLifeExpectancyType()"
            :show-prediction-interval="state.showPredictionInterval.value"
            :show-percentage="state.showPercentage.value"
            :show-labels="state.showLabels.value"
            :is-deaths-type="isDeathsType()"
            :is-population-type="isPopulationType()"
            :show-logo="state.showLogo.value"
            :show-qr-code="state.showQrCode.value"
            :decimals="state.decimals.value"
            :show-loading-overlay="dataOrchestration.showLoadingOverlay.value"
            :show-size-label="showSizeLabel"
            :container-size="containerSize"
            :has-been-resized="hasBeenResized"
            :is-custom-mode="isCustomMode"
          />
        </div>

        <!-- Settings section - fixed width on large screens -->
        <div class="w-full xl:w-[420px] flex-shrink-0">
          <ExplorerSettings
            :state="state"
            :labels="labels"
            :all-yearly-chart-labels-unique="dataOrchestration.allYearlyChartLabelsUnique.value || []"
            :colors="displayColors"
            :show-prediction-interval-disabled="showPredictionIntervalDisabled"
            :show-total-option="dataOrchestration.chartOptions.showTotalOption"
            @type-changed="(v) => updateStateAndRefresh(() => state.type.value = v, '_type')"
            @chart-type-changed="(v) => updateStateAndRefresh(() => state.chartType.value = v, '_chartType')"
            @chart-style-changed="(v) => updateStateAndRefresh(() => state.chartStyle.value = v, '_chartStyle')"
            @standard-population-changed="(v) => updateStateAndRefresh(() => state.standardPopulation.value = v, '_standardPopulation')"
            @is-excess-changed="(v) => updateStateAndRefresh(() => state.isExcess.value = v, '_isExcess')"
            @show-baseline-changed="(v) => updateStateAndRefresh(() => state.showBaseline.value = v, '_showBaseline')"
            @baseline-method-changed="(v) => updateStateAndRefresh(() => state.baselineMethod.value = v, '_baselineMethod')"
            @baseline-slider-value-changed="(v) => updateStateAndRefresh(() => { state.baselineDateFrom.value = v[0]!; state.baselineDateTo.value = v[1]! }, '_baselineDateFrom')"
            @show-prediction-interval-changed="(v) => updateStateAndRefresh(() => state.showPredictionInterval.value = v, '_showPredictionInterval')"
            @show-labels-changed="(v) => updateStateAndRefresh(() => state.showLabels.value = v, '_showLabels')"
            @maximize-changed="(v) => updateStateAndRefresh(() => state.maximize.value = v, '_maximize')"
            @is-logarithmic-changed="(v) => updateStateAndRefresh(() => state.isLogarithmic.value = v, '_isLogarithmic')"
            @show-percentage-changed="(v) => updateStateAndRefresh(() => state.showPercentage.value = v, '_showPercentage')"
            @cumulative-changed="(v) => updateStateAndRefresh(() => state.cumulative.value = v, '_cumulative')"
            @show-total-changed="(v) => updateStateAndRefresh(() => state.showTotal.value = v, '_showTotal')"
            @slider-start-changed="(v) => updateStateAndRefresh(() => state.sliderStart.value = v, '_sliderStart')"
            @user-colors-changed="(v) => updateStateAndRefresh(() => state.userColors.value = v, '_userColors')"
            @chart-preset-changed="handleChartPresetChanged"
            @show-logo-changed="(v) => { state.showLogo.value = v; nextTick() }"
            @show-qr-code-changed="(v) => { state.showQrCode.value = v; nextTick() }"
            @decimals-changed="(v) => { state.decimals.value = v; nextTick() }"
          />

          <ExplorerChartActions
            class="mt-3"
            :show-save-button="!isAuthenticated"
            @copy-link="copyChartLink"
            @download-chart="downloadChart"
            @screenshot="screenshotChart"
            @save-chart="navigateTo('/signup')"
          >
            <template
              v-if="isAuthenticated"
              #save-button
            >
              <ExplorerSaveChartModal
                v-model="showSaveModal"
                v-model:chart-name="saveChartName"
                v-model:chart-description="saveChartDescription"
                v-model:chart-public="saveChartPublic"
                :saving-chart="savingChart"
                :save-error="saveError"
                :save-success="saveSuccess"
                @save="saveToDB"
                @cancel="showSaveModal = false"
              />
            </template>
          </ExplorerChartActions>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Override UMain min-height for explorer page on desktop only */
@media (min-width: 1280px) {
  main {
    min-height: 0 !important;
  }
}
</style>
