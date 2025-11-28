<script setup lang="ts">
import {
  computed,
  onMounted,
  ref,
  watch
} from 'vue'
import { useChartResize } from '@/composables/useChartResize'
import { useExplorerHelpers } from '@/composables/useExplorerHelpers'
import { useExplorerState } from '@/composables/useExplorerState'
import { useDataAvailability } from '@/composables/useDataAvailability'
import { useExplorerDataOrchestration } from '@/composables/useExplorerDataOrchestration'
import { useExplorerColors } from '@/composables/useExplorerColors'
import { useExplorerChartActions } from '@/composables/useExplorerChartActions'
import { useTutorial } from '@/composables/useTutorial'
import { useBrowserNavigation } from '@/composables/useBrowserNavigation'
import type {
  Country
} from '@/model'
import type { ChartType } from '@/model/period'
import type { ViewType } from '@/lib/state/viewTypes'
import {
  loadCountryMetadata
} from '@/lib/data'
import ExplorerDataSelection from '@/components/explorer/ExplorerDataSelection.vue'
import ExplorerChartContainer from '@/components/explorer/ExplorerChartContainer.vue'
import ExplorerSettings from '@/components/explorer/ExplorerSettings.vue'
import ChartActions from '@/components/charts/ChartActions.vue'
import SaveModal from '@/components/SaveModal.vue'
import { generateExplorerTitle } from '@/lib/utils/chartTitles'

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
  getBaseKeysForFetch,
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
// Uses default range (~10 years of recent data) when dates are undefined
const sliderValue = computed(() => {
  const defaultRange = dataOrchestration.defaultRange.value

  // If user has set dates, use them; otherwise use defaults (if available)
  // Convert empty strings to undefined so DateSlider handles initial state correctly
  const from = state.dateFrom.value ?? (defaultRange.from || undefined)
  const to = state.dateTo.value ?? (defaultRange.to || undefined)

  return [from, to]
})

// Get color mode for theme reactivity
const colorMode = useColorMode()

// Colors management
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

// Data orchestration composable
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
    getBaseKeysForFetch,
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
  // The browser navigation watcher will handle the data update when the URL changes
  const route = useRoute()
  const router = useRouter()
  const newQuery = { ...route.query }
  newQuery.bf = val[0]!
  newQuery.bt = val[1]!

  await router.push({ query: newQuery })
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
      '_view', // View changes affect chart rendering (e.g., z-score transform)
      '_showBaseline',
      '_cumulative',
      '_showPredictionInterval',
      '_showPercentage',
      '_showTotal',
      '_userColors'
    ].includes(key)

    // Always call updateData if any trigger is true OR if it's a filter update
    if (shouldDownloadDataset || shouldUpdateDataset || needsFilterUpdate) {
      await updateData(shouldDownloadDataset, shouldUpdateDataset)
    }
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

// Special handler for chart preset (local state, not URL)
const handleChartPresetChanged = (v: string) => {
  state.chartPreset.value = v
  applyPresetSize(v)
}

// Generic StateResolver handler for any state change
// Handles cascading constraints and single-tick state application
const handleStateChange = async (field: string, value: unknown, refreshKey: string) => {
  const { StateResolver } = await import('@/lib/state/StateResolver')
  const router = useRouter()
  const route = useRoute()

  // 1. Resolve state with constraints
  const resolved = StateResolver.resolveChange(
    { field, value, source: 'user' },
    state.getCurrentStateValues(),
    state.getUserOverrides()
  )

  // 2. Apply directly to refs (single tick, no reactive cascade)
  state.applyResolvedState(resolved)

  // 3. Sync URL for persistence/sharing
  await StateResolver.applyResolvedState(resolved, route, router)

  // 4. Trigger chart refresh
  await update(refreshKey)
}

// Specific handlers for different controls
// Core chart configuration
// Special handler for view changes - uses StateResolver for proper view transitions
const handleViewChanged = async (newView: ViewType) => {
  const router = useRouter()
  const route = useRoute()

  // 1. Resolve view change through StateResolver
  // This applies view defaults, constraints, and computes UI state
  const { StateResolver } = await import('@/lib/state/StateResolver')
  const resolved = StateResolver.resolveViewChange(
    newView,
    state.getCurrentStateValues(),
    state.getUserOverrides()
  )

  // 2. Apply directly to refs (single tick, no reactive cascade)
  state.applyResolvedState(resolved)

  // 3. Sync URL for persistence/sharing
  await StateResolver.applyResolvedState(resolved, route, router)

  // 4. Trigger chart refresh (view ref already updated in step 2)
  await update('_view')
}

const handleBaselineChanged = (v: boolean) => handleStateChange('showBaseline', v, '_showBaseline')
const handlePredictionIntervalChanged = (v: boolean) => handleStateChange('showPredictionInterval', v, '_showPredictionInterval')
const handleTypeChanged = (v: string) => handleStateChange('type', v, '_type')
const handleChartTypeChanged = (v: string) => handleStateChange('chartType', v, '_chartType')
const handleChartStyleChanged = (v: string) => handleStateChange('chartStyle', v, '_chartStyle')

// Data selection
const handleCountriesChanged = (v: string[]) => handleStateChange('countries', v, '_countries')
const handleAgeGroupsChanged = (v: string[]) => handleStateChange('ageGroups', v, '_ageGroups')
const handleStandardPopulationChanged = (v: string) => handleStateChange('standardPopulation', v, '_standardPopulation')

// Baseline configuration
const handleBaselineMethodChanged = (v: string) => handleStateChange('baselineMethod', v, '_baselineMethod')

// Display options - these update UI only, no data reload needed
const handleShowLabelsChanged = async (v: boolean) => {
  const { StateResolver } = await import('@/lib/state/StateResolver')
  const router = useRouter()
  const route = useRoute()

  // Update URL state
  const resolved = StateResolver.resolveChange(
    { field: 'showLabels', value: v, source: 'user' },
    state.getCurrentStateValues(),
    state.getUserOverrides()
  )
  await StateResolver.applyResolvedState(resolved, route, router)

  // Update chart display directly (no data reload)
  if (dataOrchestration.chartData.value) {
    dataOrchestration.chartData.value.showLabels = v
  }
}

const handleMaximizeChanged = async (v: boolean) => {
  const { StateResolver } = await import('@/lib/state/StateResolver')
  const router = useRouter()
  const route = useRoute()

  // Update URL state
  const resolved = StateResolver.resolveChange(
    { field: 'maximize', value: v, source: 'user' },
    state.getCurrentStateValues(),
    state.getUserOverrides()
  )
  await StateResolver.applyResolvedState(resolved, route, router)

  // Update chart display directly (no data reload)
  if (dataOrchestration.chartData.value) {
    dataOrchestration.chartData.value.isMaximized = v
  }
}

const handleShowLogarithmicChanged = async (v: boolean) => {
  const { StateResolver } = await import('@/lib/state/StateResolver')
  const router = useRouter()
  const route = useRoute()

  // Update URL state
  const resolved = StateResolver.resolveChange(
    { field: 'showLogarithmic', value: v, source: 'user' },
    state.getCurrentStateValues(),
    state.getUserOverrides()
  )
  await StateResolver.applyResolvedState(resolved, route, router)

  // Logarithmic scale is handled automatically by chartData reactivity
  // No manual update needed - the chartOptions will react to state.showLogarithmic.value
}

// Excess mode options
const handleShowPercentageChanged = (v: boolean) => handleStateChange('showPercentage', v, '_showPercentage')
const handleCumulativeChanged = (v: boolean) => handleStateChange('cumulative', v, '_cumulative')
const handleShowTotalChanged = (v: boolean) => handleStateChange('showTotal', v, '_showTotal')

// Colors
const handleUserColorsChanged = (v: string[] | undefined) => handleStateChange('userColors', v, '_userColors')

// Slider start
const handleSliderStartChanged = (v: string | undefined) => handleStateChange('sliderStart', v, '_sliderStart')

// Chart appearance (no data refresh needed, just URL sync)
const handleShowLogoChanged = async (v: boolean) => {
  const { StateResolver } = await import('@/lib/state/StateResolver')
  const router = useRouter()
  const route = useRoute()

  const resolved = StateResolver.resolveChange(
    { field: 'showLogo', value: v, source: 'user' },
    state.getCurrentStateValues(),
    state.getUserOverrides()
  )

  await StateResolver.applyResolvedState(resolved, route, router)
}

const handleShowQrCodeChanged = async (v: boolean) => {
  const { StateResolver } = await import('@/lib/state/StateResolver')
  const router = useRouter()
  const route = useRoute()

  const resolved = StateResolver.resolveChange(
    { field: 'showQrCode', value: v, source: 'user' },
    state.getCurrentStateValues(),
    state.getUserOverrides()
  )

  await StateResolver.applyResolvedState(resolved, route, router)
}

const handleShowCaptionChanged = async (v: boolean) => {
  const { StateResolver } = await import('@/lib/state/StateResolver')
  const router = useRouter()
  const route = useRoute()

  const resolved = StateResolver.resolveChange(
    { field: 'showCaption', value: v, source: 'user' },
    state.getCurrentStateValues(),
    state.getUserOverrides()
  )

  await StateResolver.applyResolvedState(resolved, route, router)
}

const handleDecimalsChanged = async (v: string) => {
  const { StateResolver } = await import('@/lib/state/StateResolver')
  const router = useRouter()
  const route = useRoute()

  const resolved = StateResolver.resolveChange(
    { field: 'decimals', value: v, source: 'user' },
    state.getCurrentStateValues(),
    state.getUserOverrides()
  )

  await StateResolver.applyResolvedState(resolved, route, router)
}

// Watch for date range changes from URL/slider and trigger chart update
watch([() => state.dateFrom.value, () => state.dateTo.value], () => {
  if (isDataLoaded.value) {
    update('dateRange')
  }
})

// Handle browser back/forward navigation
// Watches all chart-affecting query params and triggers update when they change
useBrowserNavigation({
  queryParams: [
    'c', 't', 'ct', 'e', 'cs', 'df', 'dt', 'ss', 'bf', 'bt',
    'sp', 'ag', 'sb', 'bm', 'ce', 'st', 'pi', 'p', 'lg'
  ],
  onNavigate: () => update('_countries'),
  isReady: isDataLoaded,
  isUpdating: computed(() => isCurrentlyUpdating)
})

onMounted(async () => {
  // 1. FIRST: Resolve initial state from URL + apply constraints
  const { StateResolver } = await import('@/lib/state/StateResolver')
  const route = useRoute()
  const router = useRouter()

  const resolved = StateResolver.resolveInitial(route)

  // 2. Apply resolved state directly to refs (single tick, no reactive cascade)
  // This is the key change - refs get values BEFORE any URL update
  state.applyResolvedState(resolved)

  // 3. Sync URL if constraints changed anything (for persistence/sharing only)
  // Use replaceHistory to avoid creating new history entry (preserves back/forward)
  if (resolved.changedFields.length > 0) {
    await StateResolver.applyResolvedState(resolved, route, router, { replaceHistory: true })
  }

  // 4. Load country metadata - load all, client-side filtering happens via useCountryFilter
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

  // Auto-start tutorial for first-time users (skip if skipTutorial query param is present)
  if (!route.query.skipTutorial) {
    autoStartTutorial()
  }
})

// Note: Using 'any' type to avoid excessive type recursion with State proxy
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chartActions: any = useExplorerChartActions(state as any, dataOrchestration.chartData as any, allCountries)
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
  saveSuccess,
  isSaved,
  isModified,
  savedChartSlug,
  savedChartId: _savedChartId,
  buttonLabel,
  isButtonDisabled,
  markAsModified,
  resetSavedState: _resetSavedState,
  isDuplicate,
  existingChart
} = chartActions

// Wrap showSaveModal in computed for proper v-model binding
const showSaveModal = computed({
  get: () => _showSaveModal.value,
  set: (val) => {
    _showSaveModal.value = val
  }
})

// Generate default title for explorer charts
const getDefaultExplorerTitle = () => {
  return generateExplorerTitle({
    countries: state.countries.value,
    allCountries: allCountries.value,
    type: state.type.value,
    isExcess: state.isExcess.value,
    ageGroups: state.ageGroups.value,
    dateFrom: state.dateFrom.value,
    dateTo: state.dateTo.value
  })
}

// Watch for state changes to mark chart as modified
watch(
  [
    () => state.countries.value,
    () => state.type.value,
    () => state.chartType.value,
    () => state.ageGroups.value,
    () => state.chartStyle.value,
    () => state.isExcess.value,
    () => state.showBaseline.value,
    () => state.baselineMethod.value,
    () => state.baselineDateFrom.value,
    () => state.baselineDateTo.value,
    () => state.cumulative.value,
    () => state.showPercentage.value,
    () => state.showPredictionInterval.value,
    () => state.showTotal.value,
    () => state.dateFrom.value,
    () => state.dateTo.value,
    () => state.standardPopulation.value,
    () => state.showLogarithmic.value,
    () => state.maximize.value,
    () => state.showLabels.value
  ],
  () => {
    markAsModified()
  },
  { deep: true }
)
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
        @countries-changed="handleCountriesChanged"
        @age-groups-changed="handleAgeGroupsChanged"
        @slider-start-changed="handleSliderStartChanged"
        @date-slider-changed="dateSliderChanged"
      />

      <!-- Main content area with responsive layout -->
      <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:gap-4">
        <!-- Chart section - takes up available space on large screens -->
        <div class="flex-1 min-w-0 shrink-0">
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
            :show-logarithmic="state.showLogarithmic.value"
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
        <div class="w-full xl:w-[420px] shrink-0">
          <ExplorerSettings
            :state="state"
            :labels="labels"
            :all-yearly-chart-labels-unique="dataOrchestration.allYearlyChartLabelsUnique.value || []"
            :colors="displayColors"
            :show-prediction-interval-disabled="showPredictionIntervalDisabled"
            :baseline-range="dataOrchestration.baselineRange.value"
            @type-changed="handleTypeChanged"
            @chart-type-changed="handleChartTypeChanged"
            @chart-style-changed="handleChartStyleChanged"
            @standard-population-changed="handleStandardPopulationChanged"
            @view-changed="handleViewChanged"
            @show-baseline-changed="handleBaselineChanged"
            @baseline-method-changed="handleBaselineMethodChanged"
            @baseline-slider-value-changed="baselineSliderChanged"
            @show-prediction-interval-changed="handlePredictionIntervalChanged"
            @show-labels-changed="handleShowLabelsChanged"
            @maximize-changed="handleMaximizeChanged"
            @show-logarithmic-changed="handleShowLogarithmicChanged"
            @show-percentage-changed="handleShowPercentageChanged"
            @cumulative-changed="handleCumulativeChanged"
            @show-total-changed="handleShowTotalChanged"
            @slider-start-changed="handleSliderStartChanged"
            @user-colors-changed="handleUserColorsChanged"
            @chart-preset-changed="handleChartPresetChanged"
            @show-logo-changed="handleShowLogoChanged"
            @show-qr-code-changed="handleShowQrCodeChanged"
            @show-caption-changed="handleShowCaptionChanged"
            @decimals-changed="handleDecimalsChanged"
          />

          <ChartActions
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
                :is-saved="isSaved"
                :is-modified="isModified"
                :saved-chart-slug="savedChartSlug"
                :is-button-disabled="isButtonDisabled"
                :button-label="buttonLabel"
                :is-duplicate="isDuplicate"
                :existing-chart="existingChart"
                type="chart"
                :generate-default-title="getDefaultExplorerTitle"
                data-tour="save-button"
                @save="saveToDB"
              />
            </template>
          </ChartActions>
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
