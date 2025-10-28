<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  reactive,
  ref
} from 'vue'
import { useDateRangeValidation } from '@/composables/useDateRangeValidation'
import { useChartResize } from '@/composables/useChartResize'
import { useExplorerHelpers } from '@/composables/useExplorerHelpers'
import { useExplorerState } from '@/composables/useExplorerState'
import type {
  AllChartData,
  Country,
  DatasetRaw
} from '@/model'
import { getKeyForType } from '@/model'
import { ChartPeriod, type ChartType } from '@/model/period'
import {
  getAllChartData,
  getAllChartLabels,
  getStartIndex,
  loadCountryMetadata,
  updateDataset
} from '@/lib/data'
import ExplorerDataSelection from '@/components/explorer/ExplorerDataSelection.vue'
import ExplorerChartContainer from '@/components/explorer/ExplorerChartContainer.vue'
import ExplorerSettings from '@/components/explorer/ExplorerSettings.vue'
import ExplorerChartActions from '@/components/explorer/ExplorerChartActions.vue'
import { getChartColors } from '@/colors'
import { getColorScale } from '@/lib/chart/chartColors'
import type { MortalityChartData } from '@/lib/chart/chartTypes'
import { useRoute, useRouter } from 'vue-router'
import { getSeasonString } from '@/model/baseline'
import { getFilteredChartData } from '@/lib/chart'
import {
  arrayBufferToBase64,
  compress
} from '@/lib/compression/compress.browser'
import { DEFAULT_BASELINE_YEAR, CHART_RESIZE } from '@/lib/constants'
import { showToast } from '@/toast'

// Feature access for tier-based features (currently unused but may be needed in the future)
// const { can, getFeatureUpgradeUrl } = useFeatureAccess()

// Phase 9.2: Centralized state management with validation
const state = useExplorerState()

// Router
const _router = useRouter()
const _route = useRoute()

// Validation
const MIN_BASELINE_SPAN = 3
const { getValidatedRange } = useDateRangeValidation()

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

// Transitory
const chartOptions = reactive({
  showMaximizeOption: true,
  showMaximizeOptionDisabled: false,
  showBaselineOption: false,
  showPredictionIntervalOption: false,
  showPredictionIntervalOptionDisabled: false,
  showCumulativeOption: false,
  showTotalOption: false,
  showTotalOptionDisabled: false,
  showPercentageOption: false,
  showLogarithmicOption: true
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
const baselineSliderValue = computed(() => [state.baselineDateFrom.value, state.baselineDateTo.value])

// Get color mode for theme reactivity
const colorMode = useColorMode()

// Color picker should only show colors for selected jurisdictions
const displayColors = computed(() => {
  // Add colorMode.value as dependency to make this reactive to theme changes
  const _theme = colorMode.value

  const numCountries = state.countries.value.length
  if (numCountries === 0) return []

  // If user has custom colors, use them (extending if needed)
  if (state.userColors.value) {
    if (state.userColors.value.length >= numCountries) {
      return state.userColors.value.slice(0, numCountries)
    }
    // If user colors are fewer than countries, extend using color scale
    return getColorScale(state.userColors.value, numCountries)
  }

  // Use default colors (theme-aware)
  const themeColors = getChartColors()
  if (themeColors.length >= numCountries) {
    // We have enough colors, just slice
    return themeColors.slice(0, numCountries)
  }

  // Need more colors than we have, use chroma to generate
  return getColorScale(themeColors, numCountries)
})

// Data
const isUpdating = ref<boolean>(false)
const showLoadingOverlay = ref<boolean>(false)
let loadingTimeout: ReturnType<typeof setTimeout> | null = null

const dateSliderChanged = async (val: string[]) => {
  // Update URL state - useUrlState now handles optimistic updates internally
  state.dateFrom.value = val[0]!
  state.dateTo.value = val[1]!

  update('dateRange')
}

const labels = computed(() => allChartData?.labels || allChartLabels.value || [])

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

const updateData = async (
  shouldDownloadDataset: boolean,
  shouldUpdateDataset: boolean
) => {
  isUpdating.value = true

  // Only show loading overlay if update takes longer than 500ms
  loadingTimeout = setTimeout(() => {
    showLoadingOverlay.value = true
  }, 500)

  if (shouldDownloadDataset) {
    dataset = await updateDataset(
      state.chartType.value,
      state.countries.value,
      isAsmrType() ? ['all'] : state.ageGroups.value
    )

    // All Labels
    allChartLabels.value = getAllChartLabels(
      dataset,
      isAsmrType(),
      state.ageGroups.value,
      state.countries.value,
      state.chartType.value
    )

    if (state.chartType.value === 'yearly') {
      allYearlyChartLabels.value = allChartLabels.value
      allYearlyChartLabelsUnique.value = allChartLabels.value.filter(
        x => parseInt(x) <= DEFAULT_BASELINE_YEAR
      )
    } else {
      allYearlyChartLabels.value = Array.from(
        allChartLabels.value.map(v => v.substring(0, 4))
      )
      allYearlyChartLabelsUnique.value = Array.from(
        new Set(allYearlyChartLabels.value)
      ).filter(x => parseInt(x) <= DEFAULT_BASELINE_YEAR)
    }
  }

  if (shouldDownloadDataset || shouldUpdateDataset) {
    resetBaselineDates()

    // Update all chart specific data
    const key = getKeyForType(
      state.type.value,
      state.showBaseline.value,
      state.standardPopulation.value
    )[0]
    if (!key) return

    const newData = await getAllChartData(
      key,
      state.chartType.value,
      dataset,
      allChartLabels.value || [],
      getStartIndex(allYearlyChartLabels.value || [], state.sliderStart.value),
      showCumPi(),
      state.ageGroups.value,
      state.countries.value,
      state.baselineMethod.value,
      state.baselineDateFrom.value,
      state.baselineDateTo.value,
      getBaseKeysForType()
    )
    Object.assign(allChartData, newData)

    resetDates()
  }

  // Update filtered chart datasets
  const filteredData = await updateFilteredData()
  chartData.value = filteredData as MortalityChartData

  configureOptions()

  // Clear the loading timeout and hide overlay
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
    loadingTimeout = null
  }
  showLoadingOverlay.value = false

  isUpdating.value = false
}

// Note: isYearlyChartType, showCumPi, and getBaseKeysForType are now provided by useExplorerHelpers composable above

const resetDates = () => {
  if (!allChartData || !allChartData.labels) return
  const labels = allChartData.labels
  if (labels.length === 0) return

  // Only reset if values are missing or don't match
  // Don't reset if user has manually selected a different range
  if (state.dateFrom.value && state.dateTo.value && labels.includes(state.dateFrom.value) && labels.includes(state.dateTo.value)) {
    // Values are valid, don't change them
    return
  }

  // Date Slider - validate and correct range
  const sliderStartStr = sliderStartPeriod()
  const defaultFrom = labels.includes(sliderStartStr) ? sliderStartStr : labels[0]!
  const defaultTo = labels[labels.length - 1]!

  // Try to preserve user's selection by finding matching labels based on year
  let currentFrom = state.dateFrom.value
  let currentTo = state.dateTo.value

  // Helper function to find closest year in labels
  const findClosestYear = (targetYear: string, preferLast: boolean = false): string => {
    const targetYearNum = parseInt(targetYear)
    const availableYears = Array.from(new Set(labels.map(l => parseInt(l.substring(0, 4)))))

    // Find the closest year
    const closestYear = availableYears.reduce((prev, curr) =>
      Math.abs(curr - targetYearNum) < Math.abs(prev - targetYearNum) ? curr : prev
    )

    // Find labels for that year
    const yearLabels = labels.filter(l => l.startsWith(closestYear.toString()))
    return preferLast ? yearLabels[yearLabels.length - 1]! : yearLabels[0]!
  }

  // If current values don't exist in new labels, try to find closest match by year
  if (currentFrom && !labels.includes(currentFrom)) {
    const fromYear = currentFrom.substring(0, 4)
    const matchingLabel = labels.find(l => l.startsWith(fromYear))
    // If exact year doesn't exist, find closest year instead of falling back to default
    currentFrom = matchingLabel || findClosestYear(fromYear, false)
  }

  if (currentTo && !labels.includes(currentTo)) {
    const toYear = currentTo.substring(0, 4)
    // Find the last label that starts with the year (to prefer end of year)
    const matchingLabels = labels.filter(l => l.startsWith(toYear))
    // If exact year doesn't exist, find closest year instead of falling back to default
    currentTo = (matchingLabels.length > 0 ? matchingLabels[matchingLabels.length - 1] : findClosestYear(toYear, true))!
  }

  const period = new ChartPeriod(labels, state.chartType.value as ChartType)
  const validatedRange = getValidatedRange(
    { from: currentFrom ?? defaultFrom, to: currentTo ?? defaultTo },
    period,
    { from: defaultFrom, to: defaultTo }
  )

  if (validatedRange.from !== state.dateFrom.value || !state.dateFrom.value) {
    state.dateFrom.value = validatedRange.from
  }
  if (validatedRange.to !== state.dateTo.value || !state.dateTo.value) {
    state.dateTo.value = validatedRange.to
  }
}

const sliderStartPeriod = () =>
  getSeasonString(state.chartType.value, Number(state.sliderStart.value))

const makeUrl = async () => {
  const base = 'https://mortality.watch/?qr='
  const query = JSON.stringify(window.location)
  const encodedQuery = arrayBufferToBase64(await compress(query))
  return base + encodeURIComponent(encodedQuery)
}

const updateFilteredData = async () => {
  if (!allChartData || !allChartData.labels || !allChartData.data) {
    return { datasets: [], labels: [] }
  }

  return await getFilteredChartData(
    state.countries.value,
    state.standardPopulation.value,
    state.ageGroups.value,
    state.showPredictionInterval.value,
    state.isExcess.value,
    state.type.value,
    state.cumulative.value,
    state.showBaseline.value,
    state.baselineMethod.value,
    state.baselineDateFrom.value,
    state.baselineDateTo.value,
    state.showTotal.value,
    state.chartType.value,
    state.dateFrom.value,
    state.dateTo.value,
    isBarChartStyle(),
    allCountries.value, // This is the country metadata, not the selected countries
    isErrorBarType(),
    displayColors.value, // Use displayColors which handles 8+ countries
    isMatrixChartStyle(),
    state.showPercentage.value,
    showCumPi(),
    isAsmrType(),
    state.maximize.value,
    state.showLabels.value,
    await makeUrl(),
    state.isLogarithmic.value,
    isPopulationType(),
    isDeathsType(),
    allChartData.labels,
    allChartData.data
  )
}

const configureOptions = () => {
  chartOptions.showTotalOption = state.isExcess.value && isBarChartStyle()
  chartOptions.showTotalOptionDisabled = !state.cumulative.value
  chartOptions.showMaximizeOption
    = !(state.isExcess.value && isLineChartStyle()) && !isMatrixChartStyle()
  chartOptions.showMaximizeOptionDisabled
    = state.isLogarithmic.value || (state.isExcess.value && !chartOptions.showTotalOption)
  chartOptions.showBaselineOption = hasBaseline() && !isMatrixChartStyle()
  chartOptions.showPredictionIntervalOption
    = chartOptions.showBaselineOption || (state.isExcess.value && !isMatrixChartStyle())
  chartOptions.showPredictionIntervalOptionDisabled
    = (!state.isExcess.value && !state.showBaseline.value) || (state.cumulative.value && !showCumPi())
  chartOptions.showCumulativeOption = state.isExcess.value
  chartOptions.showPercentageOption = state.isExcess.value
  chartOptions.showLogarithmicOption = !isMatrixChartStyle() && !state.isExcess.value
}

const resetBaselineDates = () => {
  if (!allChartLabels.value || !allYearlyChartLabels.value) return
  const labels = allChartLabels.value.slice(
    getStartIndex(allYearlyChartLabels.value, state.sliderStart.value)
  )
  if (labels.length === 0) return

  // Validate baseline range with minimum span requirement
  const defaultFrom = labels[0]!
  const defaultToIndex = Math.min(labels.length - 1, MIN_BASELINE_SPAN)
  const defaultTo = labels[defaultToIndex]!

  const period = new ChartPeriod(labels, state.chartType.value as ChartType)
  const validatedRange = getValidatedRange(
    { from: state.baselineDateFrom.value ?? defaultFrom, to: state.baselineDateTo.value ?? defaultTo },
    period,
    { from: defaultFrom, to: defaultTo },
    MIN_BASELINE_SPAN
  )

  if (validatedRange.from !== state.baselineDateFrom.value || !state.baselineDateFrom.value) {
    state.baselineDateFrom.value = validatedRange.from
  }
  if (validatedRange.to !== state.baselineDateTo.value || !state.baselineDateTo.value) {
    state.baselineDateTo.value = validatedRange.to
  }

  // Start Select - reset to default if current value is invalid
  if (state.sliderStart.value && !allYearlyChartLabelsUnique.value?.includes(state.sliderStart.value)) {
    state.sliderStart.value = '2010'
  }
}

// Load Data
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

let dataset: DatasetRaw
const allChartLabels = ref<string[]>([])
const allYearlyChartLabels = ref<string[]>([])
const allYearlyChartLabelsUnique = ref<string[]>([])
const allChartData = reactive<AllChartData>({
  labels: [],
  data: {},
  notes: {
    noData: undefined,
    noAsmr: undefined
  }
})
const chartData = ref<MortalityChartData | undefined>(undefined)

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

  if (chartData.value) {
    if (key === '_maximize') chartData.value.isMaximized = state.maximize.value
    if (key === '_showLabels') chartData.value.showLabels = state.showLabels.value
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

// Chart action functions
const copyChartLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    showToast('Link copied to clipboard!', 'success')
  } catch (error) {
    console.error('[copyChartLink] Error:', error)
    showToast('Failed to copy link', 'error')
  }
}

const screenshotChart = () => {
  const canvas = document.querySelector('#chart') as HTMLCanvasElement
  if (!canvas) {
    showToast('Chart not found', 'error')
    return
  }
  try {
    const dataURL = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = 'mortality-chart.png'
    link.href = dataURL
    link.click()
    showToast('Chart downloaded!', 'success')
  } catch (error) {
    console.error('[screenshotChart] Error:', error)
    showToast('Failed to download chart', 'error')
  }
}

const saveChart = async () => {
  const base = `${window.location.origin}/?qr=`
  const query = JSON.stringify(window.location)
  const encodedQuery = arrayBufferToBase64(await compress(query))
  const url = base + encodeURIComponent(encodedQuery)
  window.open(url.replaceAll('/?qr', '/chart.png?qr'), '_blank')
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
        :all-yearly-chart-labels-unique="allYearlyChartLabelsUnique"
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
            :chart-data="chartData"
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
            :show-loading-overlay="showLoadingOverlay"
            :show-size-label="showSizeLabel"
            :container-size="containerSize"
            :has-been-resized="hasBeenResized"
            :is-custom-mode="isCustomMode"
          />
        </div>

        <!-- Settings section - fixed width on large screens -->
        <div class="w-full xl:w-[420px] flex-shrink-0">
          <ExplorerSettings
            :countries="state.countries.value"
            :labels="labels"
            :all-yearly-chart-labels-unique="allYearlyChartLabelsUnique || []"
            :type="state.type.value"
            :chart-type="state.chartType.value"
            :chart-style="state.chartStyle.value"
            :standard-population="state.standardPopulation.value"
            :is-updating="false"
            :is-population-type="isPopulationType()"
            :is-excess="state.isExcess.value"
            :baseline-method="state.baselineMethod.value"
            :baseline-slider-value="baselineSliderValue"
            :show-baseline="state.showBaseline.value"
            :slider-start="state.sliderStart.value"
            :show-prediction-interval="state.showPredictionInterval.value"
            :show-prediction-interval-disabled="showPredictionIntervalDisabled"
            :show-labels="state.showLabels.value"
            :maximize="state.maximize.value"
            :is-logarithmic="state.isLogarithmic.value"
            :show-percentage="state.showPercentage.value || false"
            :cumulative="state.cumulative.value"
            :show-total="state.showTotal.value"
            :show-logarithmic-option="!isMatrixChartStyle() && !state.isExcess.value"
            :show-maximize-option="!(state.isExcess.value && isLineChartStyle()) && !isMatrixChartStyle()"
            :show-maximize-option-disabled="state.isLogarithmic.value || (state.isExcess.value && !chartOptions.showTotalOption)"
            :show-percentage-option="state.isExcess.value"
            :show-cumulative-option="state.isExcess.value"
            :show-total-option="state.isExcess.value && isBarChartStyle()"
            :show-total-option-disabled="!state.cumulative.value"
            :show-prediction-interval-option="chartOptions.showBaselineOption || (state.isExcess.value && !isMatrixChartStyle())"
            :show-prediction-interval-option-disabled="showPredictionIntervalDisabled"
            :is-matrix-chart-style="isMatrixChartStyle()"
            :colors="displayColors"
            :chart-preset="state.chartPreset.value"
            :show-logo="state.showLogo.value"
            :show-qr-code="state.showQrCode.value"
            :decimals="state.decimals.value"
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
            @copy-link="copyChartLink"
            @screenshot="screenshotChart"
            @save="saveChart"
          />
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

<style scoped>
.chart-card {
  aspect-ratio: 16/10;
  overflow: hidden;
}

.chart-card :deep(.p-4) {
  padding: 0 !important;
}

.chart-card :deep([class*="p-"]) {
  padding: 0 !important;
}

.chart-card.chart-card-resizable {
  aspect-ratio: unset;
  height: 100%;
  overflow: hidden; /* Default to hidden */
}

/* In Custom mode, allow overflow so resize handle is visible */
.chart-card.chart-card-custom {
  overflow: visible !important;
}

@media (min-width: 1280px) {
  .chart-card.chart-card-resizable {
    max-height: none; /* Remove max-height to prevent clipping */
  }
}

.chart-card.chart-card-resizable.chart-card-resized {
  width: fit-content;
  min-width: 0; /* Allow shrinking */
}

/* In Auto mode, chart card should be flexible */
.chart-card.chart-card-resizable:not(.chart-card-resized) {
  width: 100%;
  min-width: 0;
  max-width: 100%; /* Ensure it doesn't exceed parent */
}

/* Ensure UCard body can shrink */
.chart-card :deep(.overflow-hidden) {
  min-width: 0;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  /* Removed negative margin for proper resize handle alignment */
}

.chart-wrapper.resizable {
  min-width: v-bind('CHART_RESIZE.MIN_WIDTH + "px"');
  min-height: v-bind('CHART_RESIZE.MIN_HEIGHT + "px"');
}

/* Preset mode - fixed height, no resize handle */
.chart-wrapper.resizable:not(.auto-mode):not(.custom-mode) {
  height: 55vh;
  width: 100%;
  overflow: hidden; /* No scrollbars for presets */
  resize: none; /* No resize handle for presets */
}

/* Custom mode - allow resizing */
.chart-wrapper.resizable.custom-mode {
  height: 55vh;
  width: 100%;
  overflow: auto; /* Enable resize handle without forcing scrollbars */
  resize: both; /* Show resize handle only in Custom mode */
}

/* Hide scrollbars in custom mode - they're not needed, just the resize handle */
.chart-wrapper.resizable.custom-mode::-webkit-scrollbar {
  display: none;
}
.chart-wrapper.resizable.custom-mode {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

/* Auto mode - responsive with aspect ratio, no resize handle */
.chart-wrapper.resizable.auto-mode {
  width: 100%;
  max-width: 100%;
  height: auto; /* Override fixed height */
  min-width: 0; /* Allow shrinking below default min-width */
  min-height: 0; /* Allow shrinking below default min-height */
  aspect-ratio: 1 / 1; /* Mobile: square for vertical space */
  overflow: hidden; /* No scrollbars or resize handle in Auto mode */
  resize: none; /* Hide resize handle in Auto mode */
}

/* sm: tablet portrait - slightly wider */
@media (min-width: 640px) {
  .chart-wrapper.resizable.auto-mode {
    aspect-ratio: 4 / 3;
  }
}

/* md: tablet landscape - standard widescreen */
@media (min-width: 768px) {
  .chart-wrapper.resizable.auto-mode {
    aspect-ratio: 16 / 9;
  }
}

/* lg: desktop - 16:10 aspect ratio */
@media (min-width: 1024px) {
  .chart-wrapper.resizable.auto-mode {
    aspect-ratio: 16 / 10;
  }
}

/* xl: large desktop - 2:1 aspect ratio */
@media (min-width: 1280px) {
  .chart-wrapper.resizable.auto-mode {
    aspect-ratio: 2 / 1;
  }
}

/* 2xl: ultra-wide desktop - 21:9 for time series */
@media (min-width: 1536px) {
  .chart-wrapper.resizable.auto-mode {
    aspect-ratio: 21 / 9;
  }
}

.tab-card :deep(.divide-y) {
  border: none;
}

/* Settings card has no height constraints - naturally sizes to content */

.size-label {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
}

.banner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: rgb(107 114 128);
}

.chart-option-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;
  color: inherit;
}

.chart-option-button:hover {
  background-color: rgb(243 244 246);
}

.dark .chart-option-button:hover {
  background-color: rgb(31 41 55);
}

.chart-option-button:active {
  background-color: rgb(229 231 235);
}

.dark .chart-option-button:active {
  background-color: rgb(17 24 39);
}
</style>
