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
import { useTutorial } from '@/composables/useTutorial'
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
import SaveModal from '@/components/SaveModal.vue'

// Auth state for conditional features
const { isAuthenticated } = useAuth()

// Tutorial for first-time users
const { autoStartTutorial } = useTutorial()

// Centralized state management with validation
const state = useExplorerState()

// Data availability checks with auto-correction
// Composable runs watchers for auto-correction (side effects)
useDataAvailability(state)

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

// Type predicates and computed helpers based on state
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

// Adapter: Convert separate date refs to array format for DateSlider component
const sliderValue = computed(() => [state.dateFrom.value, state.dateTo.value])

// Get color mode for theme reactivity
const colorMode = useColorMode()

// Phase 5a: Colors management extracted to composable
const { displayColors } = useExplorerColors(
  state.countries,
  state.userColors,
  colorMode
)

// Bootstrap data - loaded here and passed to data orchestration composable
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

// Destructure data orchestration (some values accessed via dataOrchestration.*)
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
  // IMPORTANT: Batch both updates into a single router.push to avoid race condition
  // where the second update overwrites the first with stale route data
  const route = useRoute()
  const router = useRouter()
  const newQuery = { ...route.query }
  newQuery.df = val[0]!
  newQuery.dt = val[1]!

  await router.push({ query: newQuery })

  update('dateRange')
}

const baselineSliderChanged = async (val: string[]) => {
  // IMPORTANT: Batch both updates into a single router.push to avoid race condition
  const route = useRoute()
  const router = useRouter()
  const newQuery = { ...route.query }
  newQuery.bf = val[0]!
  newQuery.bt = val[1]!

  await router.push({ query: newQuery })

  update('_baselineDateFrom')
}

// Labels for the date range slider - full range from sliderStart to end
// The sliderValue (dateFrom/dateTo) determines which portion is selected
const labels = computed(() => dataOrchestration.visibleLabels.value || [])

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

// Prevent concurrent updates using queue pattern
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

// Helper: Update state, wait for DOM update, then trigger data refresh
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

  // Auto-start tutorial for first-time users
  autoStartTutorial()
})

// Note: Using 'any' type to avoid excessive type recursion with State proxy
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chartActions: any = useExplorerChartActions(state as any, dataOrchestration.chartData as any)
const {
  copyChartLink,
  screenshotChart,
  downloadChart,
  saveToDB,
  exportCSV,
  exportJSON,
  showSaveModal: _showSaveModal,
  savingChart,
  saveChartName,
  saveChartDescription,
  saveChartPublic,
  saveError,
  saveSuccess
} = chartActions

// Wrap showSaveModal in computed for proper v-model binding
const showSaveModal = computed({
  get: () => _showSaveModal.value,
  set: (val) => {
    _showSaveModal.value = val
  }
})
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
      <PageHeader
        title="Data Explorer"
        description="Visualize and analyze mortality data across countries, time periods, and demographics with interactive charts and customizable baselines."
        max-width="xl"
      />
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
            :show-caption="state.showCaption.value"
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
            @baseline-slider-value-changed="baselineSliderChanged"
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
            @show-caption-changed="(v: boolean) => { state.showCaption.value = v; nextTick() }"
            @decimals-changed="(v) => { state.decimals.value = v; nextTick() }"
          />

          <ExplorerChartActions
            class="mt-3"
            :show-save-button="!isAuthenticated"
            @copy-link="copyChartLink"
            @download-chart="downloadChart"
            @screenshot="screenshotChart"
            @save-chart="navigateTo('/signup')"
            @export-c-s-v="exportCSV"
            @export-j-s-o-n="exportJSON"
          >
            <template
              v-if="isAuthenticated"
              #save-button
            >
              <SaveModal
                v-model="showSaveModal"
                v-model:name="saveChartName"
                v-model:description="saveChartDescription"
                v-model:is-public="saveChartPublic"
                :saving="savingChart"
                :error="saveError"
                :success="saveSuccess"
                type="chart"
                data-tour="save-button"
                @save="saveToDB"
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
