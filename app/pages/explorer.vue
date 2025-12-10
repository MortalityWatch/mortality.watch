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
import { useUpdateQueue } from '@/composables/useUpdateQueue'
import type {
  Country
} from '@/model'
import type { ChartType } from '@/model/period'
import type { ViewType } from '@/lib/state'
import {
  loadCountryMetadata
} from '@/lib/data'
import ExplorerDataSelection from '@/components/explorer/ExplorerDataSelection.vue'
import ExplorerChartContainer from '@/components/explorer/ExplorerChartContainer.vue'
import ExplorerSettings from '@/components/explorer/ExplorerSettings.vue'
import ChartActions from '@/components/charts/ChartActions.vue'
import SaveModal from '@/components/SaveModal.vue'
import { generateExplorerTitle, generateExplorerDescription } from '@/lib/utils/chartTitles'

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
  state.chartType,
  state.isZScore
)

// Adapter: Convert separate date refs to array format for DateSlider component
// Uses default range (~10 years of recent data) when dates are undefined
const sliderValue = computed((): string[] => {
  const defaultRange = dataOrchestration.defaultRange.value

  // If user has set dates, use them; otherwise use defaults (if available)
  // Fallback to empty strings if no dates available yet
  const from = state.dateFrom.value ?? defaultRange.from ?? ''
  const to = state.dateTo.value ?? defaultRange.to ?? ''

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
  updateData,
  saveOriginalQueryParams
} = dataOrchestration

// Date range slider - batch update both dateFrom and dateTo
const dateSliderChanged = (val: string[]) => handleStateChange([
  { field: 'dateFrom', value: val[0] },
  { field: 'dateTo', value: val[1] }
], 'dateRange')

// Baseline period slider - batch update both baselineDateFrom and baselineDateTo
const baselineSliderChanged = (val: string[]) => handleStateChange([
  { field: 'baselineDateFrom', value: val[0] },
  { field: 'baselineDateTo', value: val[1] }
], '_baselineMethod')

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

// Update queue - prevents concurrent updates and handles field-based update strategy
const {
  queueUpdate: update,
  isUpdating: isCurrentlyUpdating,
  startInternalUrlUpdate,
  endInternalUrlUpdate,
  shouldSkipUpdate: isInternalUrlUpdate
} = useUpdateQueue({
  onUpdate: async (shouldDownload, shouldUpdate) => {
    if (state.countries.value.length) {
      await updateData(shouldDownload, shouldUpdate)
    }
  },
  getCurrentState: () => state.getCurrentStateValues()
})

// Special handler for chart preset (local state, not URL)
const handleChartPresetChanged = (v: string) => {
  state.chartPreset.value = v
  applyPresetSize(v)
}

// Generic StateResolver handler for any state change
// Handles cascading constraints and single-tick state application
// Supports both single field and batch changes (for sliders with from/to)
const handleStateChange = async (
  changes: { field: string, value: unknown } | { field: string, value: unknown }[],
  refreshKey: string
) => {
  const { StateResolver } = await import('@/lib/state/resolver/StateResolver')
  const router = useRouter()
  const route = useRoute()

  // Normalize to array
  const changeList = Array.isArray(changes) ? changes : [changes]

  // Guard: nothing to do if empty
  if (changeList.length === 0) return

  // 1. Track all as user overrides
  changeList.forEach(c => state.addUserOverride(c.field))

  // 2. Chain resolve through all changes
  const firstChange = changeList[0]!
  let resolved = StateResolver.resolveChange(
    { field: firstChange.field, value: firstChange.value, source: 'user' },
    state.getCurrentStateValues(),
    state.getUserOverrides()
  )

  for (let i = 1; i < changeList.length; i++) {
    const change = changeList[i]!
    resolved = StateResolver.resolveChange(
      { field: change.field, value: change.value, source: 'user' },
      resolved.state,
      state.getUserOverrides()
    )
  }

  // 3. Apply directly to refs (single tick, no reactive cascade)
  state.applyResolvedState(resolved)

  // 4. Sync URL for persistence/sharing
  // Set flag to prevent useBrowserNavigation from triggering duplicate update
  startInternalUrlUpdate()
  await StateResolver.applyResolvedState(resolved, route, router)
  await nextTick()
  endInternalUrlUpdate()

  // 5. Trigger chart refresh
  await update(refreshKey)
}

// Handler for UI-only state changes (no data refresh needed)
// Used for display options that only affect chart rendering, not data
const handleUIStateChange = async (
  changes: { field: string, value: unknown } | { field: string, value: unknown }[]
) => {
  const { StateResolver } = await import('@/lib/state/resolver/StateResolver')
  const router = useRouter()
  const route = useRoute()

  // Normalize to array
  const changeList = Array.isArray(changes) ? changes : [changes]

  // Guard: nothing to do if empty
  if (changeList.length === 0) return

  // 1. Track all as user overrides
  changeList.forEach(c => state.addUserOverride(c.field))

  // 2. Chain resolve through all changes
  const firstChange = changeList[0]!
  let resolved = StateResolver.resolveChange(
    { field: firstChange.field, value: firstChange.value, source: 'user' },
    state.getCurrentStateValues(),
    state.getUserOverrides()
  )

  for (let i = 1; i < changeList.length; i++) {
    const change = changeList[i]!
    resolved = StateResolver.resolveChange(
      { field: change.field, value: change.value, source: 'user' },
      resolved.state,
      state.getUserOverrides()
    )
  }

  // 3. Apply directly to refs (single tick, no reactive cascade)
  state.applyResolvedState(resolved)

  // 4. Sync URL for persistence/sharing
  // Set flag to prevent useBrowserNavigation from triggering duplicate update
  startInternalUrlUpdate()
  await StateResolver.applyResolvedState(resolved, route, router)
  await nextTick()
  endInternalUrlUpdate()

  // No update() call - UI-only change
}

// Specific handlers for different controls
// Core chart configuration
// Special handler for view changes - uses StateResolver for proper view transitions
const handleViewChanged = async (newView: ViewType) => {
  const router = useRouter()
  const route = useRoute()

  // 1. Clear user overrides - when switching views, user wants the new view's defaults
  state.clearUserOverrides()

  // 2. Resolve view change through StateResolver
  // This applies view defaults, constraints, and computes UI state
  const { StateResolver } = await import('@/lib/state/resolver/StateResolver')
  const resolved = StateResolver.resolveViewChange(
    newView,
    state.getCurrentStateValues(),
    new Set() // Pass empty set since we cleared overrides
  )

  // 3. Create a state snapshot from the resolved state BEFORE applying to refs
  // This ensures chart data is generated with consistent state values
  const snapshot = await createSnapshotFromResolved(resolved.state)

  // 4. Generate new chart data using the snapshot (before refs update)
  // This is the key fix: chart data is computed with the new state values
  // before Vue's reactivity system can cause intermediate renders
  await updateData(false, false, snapshot)

  // 5. NOW apply to refs (chart already has correct data, so no flash)
  state.applyResolvedState(resolved)

  // 6. Sync URL for persistence/sharing
  // Set flag to prevent useBrowserNavigation from triggering duplicate update
  startInternalUrlUpdate()
  await StateResolver.applyResolvedState(resolved, route, router)
  endInternalUrlUpdate()
}

/**
 * Create a ChartStateSnapshot from a resolved state object.
 * Delegates to StateResolver.createSnapshot for centralized logic.
 */
const createSnapshotFromResolved = async (resolvedState: Record<string, unknown>) => {
  const { StateResolver } = await import('@/lib/state/resolver/StateResolver')
  return StateResolver.createSnapshot(resolvedState, state.getCurrentStateValues())
}

const handleBaselineChanged = (v: boolean) => handleStateChange({ field: 'showBaseline', value: v }, '_showBaseline')
const handlePredictionIntervalChanged = (v: boolean) => handleStateChange({ field: 'showPredictionInterval', value: v }, '_showPredictionInterval')
const handleTypeChanged = (v: string) => handleStateChange({ field: 'type', value: v }, '_type')
const handleChartTypeChanged = (v: string) => handleStateChange({ field: 'chartType', value: v }, '_chartType')
const handleChartStyleChanged = (v: string) => handleStateChange({ field: 'chartStyle', value: v }, '_chartStyle')

// Data selection
const handleCountriesChanged = (v: string[]) => handleStateChange({ field: 'countries', value: v }, '_countries')
const handleAgeGroupsChanged = (v: string[]) => handleStateChange({ field: 'ageGroups', value: v }, '_ageGroups')
const handleStandardPopulationChanged = (v: string) => handleStateChange({ field: 'standardPopulation', value: v }, '_standardPopulation')

// Baseline configuration
const handleBaselineMethodChanged = (v: string) => handleStateChange({ field: 'baselineMethod', value: v }, '_baselineMethod')

// Display options - these update UI only, no data reload needed
// Some require direct chartData update since they affect rendering without data reload
const handleShowLabelsChanged = async (v: boolean) => {
  await handleUIStateChange({ field: 'showLabels', value: v })
  // Update chart display directly (no data reload)
  if (dataOrchestration.chartData.value) {
    dataOrchestration.chartData.value.showLabels = v
  }
}
const handleMaximizeChanged = async (v: boolean) => {
  await handleUIStateChange({ field: 'maximize', value: v })
  // Update chart display directly (no data reload)
  if (dataOrchestration.chartData.value) {
    dataOrchestration.chartData.value.isMaximized = v
  }
}
const handleShowLogarithmicChanged = (v: boolean) => handleUIStateChange({ field: 'showLogarithmic', value: v })

// Excess mode options
const handleShowPercentageChanged = (v: boolean) => handleStateChange({ field: 'showPercentage', value: v }, '_showPercentage')
const handleCumulativeChanged = (v: boolean) => handleStateChange({ field: 'cumulative', value: v }, '_cumulative')
const handleShowTotalChanged = (v: boolean) => handleStateChange({ field: 'showTotal', value: v }, '_showTotal')

// Colors
const handleUserColorsChanged = (v: string[] | undefined) => handleStateChange({ field: 'userColors', value: v }, '_userColors')

// Slider start
const handleSliderStartChanged = (v: string | undefined) => handleStateChange({ field: 'sliderStart', value: v }, '_sliderStart')

// Chart appearance (no data refresh needed, just URL sync)
const handleShowLogoChanged = (v: boolean) => handleUIStateChange({ field: 'showLogo', value: v })
const handleShowQrCodeChanged = (v: boolean) => handleUIStateChange({ field: 'showQrCode', value: v })
const handleShowCaptionChanged = (v: boolean) => handleUIStateChange({ field: 'showCaption', value: v })
const handleShowTitleChanged = (v: boolean) => handleUIStateChange({ field: 'showTitle', value: v })
const handleDecimalsChanged = (v: string) => handleUIStateChange({ field: 'decimals', value: v })

// Handle browser back/forward navigation
// Watches all chart-affecting query params and triggers update when they change
// Skip if we initiated the URL change ourselves (isInternalUrlUpdate flag)
useBrowserNavigation({
  queryParams: [
    'c', 't', 'ct', 'e', 'cs', 'df', 'dt', 'ss', 'bf', 'bt',
    'sp', 'ag', 'sb', 'bm', 'ce', 'st', 'pi', 'p', 'lg'
  ],
  onNavigate: async () => {
    if (isInternalUrlUpdate.value) {
      return
    }
    // Re-read state from URL and apply to refs before updating data
    const { StateResolver } = await import('@/lib/state/resolver/StateResolver')
    const route = useRoute()
    const resolved = StateResolver.resolveInitial(route)
    state.applyResolvedState(resolved)
    state.setUserOverrides(resolved.userOverrides)
    // Wait for Vue reactivity to propagate before updating chart
    await nextTick()
    // Now update data with correct state
    update('_countries')
  },
  isReady: isDataLoaded,
  isUpdating: isCurrentlyUpdating
})

onMounted(async () => {
  // 0. Save original query params BEFORE any URL modification
  // This ensures short URL computation matches SSR (which uses original request params)
  const route = useRoute()
  saveOriginalQueryParams(route.query as Record<string, string | string[] | undefined>)

  // 1. FIRST: Resolve initial state from URL + apply constraints
  const { StateResolver } = await import('@/lib/state/resolver/StateResolver')
  const router = useRouter()

  const resolved = StateResolver.resolveInitial(route)

  // 2. Apply resolved state directly to refs (single tick, no reactive cascade)
  // This is the key change - refs get values BEFORE any URL update
  state.applyResolvedState(resolved)

  // 3. Set user overrides from URL params (so we know which fields user explicitly set)
  state.setUserOverrides(resolved.userOverrides)

  // 4. Sync URL if constraints changed anything (for persistence/sharing only)
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
// Reset duplicate state when modal opens
const showSaveModal = computed({
  get: () => _showSaveModal.value,
  set: (val) => {
    if (val) {
      // Reset duplicate state when opening modal
      isDuplicate.value = false
      existingChart.value = null
      saveError.value = ''
    }
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
    dateTo: state.dateTo.value,
    view: state.view.value
  })
}

// Generate default description for explorer charts
const getDefaultExplorerDescription = () => {
  return generateExplorerDescription({
    countries: state.countries.value,
    allCountries: allCountries.value,
    type: state.type.value,
    isExcess: state.isExcess.value,
    ageGroups: state.ageGroups.value,
    dateFrom: state.dateFrom.value,
    dateTo: state.dateTo.value,
    view: state.view.value,
    chartType: state.chartType.value,
    showBaseline: state.showBaseline.value,
    baselineMethod: state.baselineMethod.value,
    baselineDateFrom: state.baselineDateFrom.value,
    baselineDateTo: state.baselineDateTo.value,
    cumulative: state.cumulative.value,
    showPercentage: state.showPercentage.value,
    standardPopulation: state.standardPopulation.value
  })
}

// Watch for state changes to mark chart as modified
// Uses getCurrentStateValues() for simpler maintenance - no need to update list when adding fields
watch(
  () => state.getCurrentStateValues(),
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
            :show-title="state.showTitle.value"
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
            :show-maximize-option-disabled="dataOrchestration.chartOptions.showMaximizeOptionDisabled"
            :show-total-option-disabled="dataOrchestration.chartOptions.showTotalOptionDisabled"
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
            @show-title-changed="handleShowTitleChanged"
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
                :generate-default-description="getDefaultExplorerDescription"
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
