<script setup lang="ts">
import { Defaults, stateFieldEncoders } from '@/lib/state/stateSerializer'
import { useUrlState } from '@/composables/useUrlState'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref
} from 'vue'
import { useDateRangeValidation } from '@/composables/useDateRangeValidation'
import type {
  AllChartData,
  Country,
  DatasetRaw,
  NumberEntryFields
} from '@/model'
import { getKeyForType } from '@/model'
import { isMobile } from '@/utils'
import {
  getAllChartData,
  getAllChartLabels,
  getStartIndex,
  loadCountryMetadata,
  updateDataset
} from '@/data'
import MortalityChartControlsSecondary from '@/components/charts/MortalityChartControlsSecondaryCustom.vue'
import MortalityChartControlsPrimary from '@/components/charts/MortalityChartControlsPrimary.vue'
import { colors, specialColor } from '@/colors'
import DateSlider from '@/components/charts/DateSlider.vue'
import type { ChartStyle, MortalityChartData } from '@/lib/chart/chartTypes'
import { useRoute, useRouter } from 'vue-router'
import MortalityChart from '@/components/charts/MortalityChart.vue'
import { getSeasonString } from '@/model/baseline'
import { getFilteredChartData } from '@/chart'
import {
  arrayBufferToBase64,
  compress
} from '@/lib/compression/compress.browser'
import { DEFAULT_BASELINE_YEAR, CHART_RESIZE, CHART_PRESETS } from '@/lib/constants'
import { showToast } from '@/toast'

// State stored in URL params
const countries = useUrlState(
  stateFieldEncoders.countries.key,
  Defaults.countries
)
const chartType = useUrlState(
  stateFieldEncoders.chartType.key,
  Defaults.chartType
)
const ageGroups = useUrlState<string[]>(
  stateFieldEncoders.ageGroups.key,
  ['all']
)
const standardPopulation = useUrlState(
  stateFieldEncoders.standardPopulation.key,
  Defaults.standardPopulation
)
const isExcess = useUrlState<boolean>(
  stateFieldEncoders.isExcess.key,
  false,
  stateFieldEncoders.isExcess.encode,
  stateFieldEncoders.isExcess.decode
)
const type = useUrlState(
  stateFieldEncoders.type.key,
  Defaults.type
)
const chartStyle = useUrlState(
  stateFieldEncoders.chartStyle.key,
  Defaults.chartStyle
)
const dateFrom = useUrlState<string>(
  stateFieldEncoders.dateFrom.key,
  '2017',
  stateFieldEncoders.dateFrom.encode,
  stateFieldEncoders.dateFrom.decode,
  { debounce: 300 }
)
const dateTo = useUrlState<string>(
  stateFieldEncoders.dateTo.key,
  '2023',
  stateFieldEncoders.dateTo.encode,
  stateFieldEncoders.dateTo.decode,
  { debounce: 300 }
)
const baselineDateFrom = useUrlState<string>(
  stateFieldEncoders.baselineDateFrom.key,
  '2017',
  stateFieldEncoders.baselineDateFrom.encode,
  stateFieldEncoders.baselineDateFrom.decode
)
const baselineDateTo = useUrlState<string>(
  stateFieldEncoders.baselineDateTo.key,
  '2019',
  stateFieldEncoders.baselineDateTo.encode,
  stateFieldEncoders.baselineDateTo.decode
)
const showBaseline = useUrlState<boolean>(
  stateFieldEncoders.showBaseline.key,
  true,
  stateFieldEncoders.showBaseline.encode,
  stateFieldEncoders.showBaseline.decode
)
const baselineMethod = useUrlState(
  stateFieldEncoders.baselineMethod.key,
  Defaults.baselineMethod
)
const cumulative = useUrlState<boolean>(
  stateFieldEncoders.cumulative.key,
  false,
  stateFieldEncoders.cumulative.encode,
  stateFieldEncoders.cumulative.decode
)
const showTotal = useUrlState<boolean>(
  stateFieldEncoders.showTotal.key,
  false,
  stateFieldEncoders.showTotal.encode,
  stateFieldEncoders.showTotal.decode
)
const maximize = useUrlState<boolean>(
  stateFieldEncoders.maximize.key,
  false,
  stateFieldEncoders.maximize.encode,
  stateFieldEncoders.maximize.decode
)
const showPredictionInterval = useUrlState<boolean>(
  stateFieldEncoders.showPredictionInterval.key,
  true,
  stateFieldEncoders.showPredictionInterval.encode,
  stateFieldEncoders.showPredictionInterval.decode
)
const showLabels = useUrlState<boolean>(
  stateFieldEncoders.showLabels.key,
  true,
  stateFieldEncoders.showLabels.encode,
  stateFieldEncoders.showLabels.decode
)
const showPercentage = useUrlState<boolean>(
  stateFieldEncoders.showPercentage.key,
  false,
  stateFieldEncoders.showPercentage.encode,
  stateFieldEncoders.showPercentage.decode
)
const isLogarithmic = useUrlState<boolean>(
  stateFieldEncoders.isLogarithmic.key,
  false,
  stateFieldEncoders.isLogarithmic.encode,
  stateFieldEncoders.isLogarithmic.decode
)
const sliderStart = useUrlState(
  stateFieldEncoders.sliderStart.key,
  Defaults.sliderStart ?? '2010'
)
const userColors = useUrlState<string[] | undefined>(
  stateFieldEncoders.userColors.key,
  undefined
)
const chartPreset = useUrlState<string | undefined>(
  stateFieldEncoders.chartPreset.key,
  undefined,
  stateFieldEncoders.chartPreset.encode,
  stateFieldEncoders.chartPreset.decode
)
const chartWidth = useUrlState<number | undefined>(
  stateFieldEncoders.chartWidth.key,
  undefined
)
const chartHeight = useUrlState<number | undefined>(
  stateFieldEncoders.chartHeight.key,
  undefined
)
const showLogo = useUrlState<boolean>(
  stateFieldEncoders.showLogo.key,
  true,
  stateFieldEncoders.showLogo.encode,
  stateFieldEncoders.showLogo.decode
)
const showQrCode = useUrlState<boolean>(
  stateFieldEncoders.showQrCode.key,
  true,
  stateFieldEncoders.showQrCode.encode,
  stateFieldEncoders.showQrCode.decode
)

// Router
const _router = useRouter()
const _route = useRoute()

// Validation
const MIN_BASELINE_SPAN = 3
const { getValidatedRange } = useDateRangeValidation()

// Dynamic OG images based on current chart state
const chartState = computed(() => ({
  countries: countries.value,
  type: type.value,
  chartType: chartType.value,
  isExcess: isExcess.value,
  ageGroups: ageGroups.value,
  chartStyle: chartStyle.value
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

// Helper Functions
const isAsmrType = () => type.value.includes('asmr')
const isPopulationType = () => type.value === 'population'
const isLifeExpectancyType = () => type.value === 'le'
const isDeathsType = () => type.value.includes('deaths')
const isErrorBarType = () => isBarChartStyle() && isExcess.value
const hasBaseline = () => !isPopulationType() && !isExcess.value
const isLineChartStyle = () => chartStyle.value === 'line'
const isBarChartStyle = () => chartStyle.value === 'bar'
const isMatrixChartStyle = () => chartStyle.value === 'matrix'
const getMaxCountriesAllowed = () =>
  countries.value.length > 1
  && isAsmrType()
  && standardPopulation.value === 'country'
    ? 1
    : undefined

// Computed
const sliderValue = computed(() => [dateFrom.value, dateTo.value])
const baselineSliderValue = computed(() => [baselineDateFrom.value, baselineDateTo.value])
const showPredictionIntervalDisabled = computed(() =>
  (!isExcess.value && !showBaseline.value) || (cumulative.value && !showCumPi())
)

// Data
const isUpdating = ref<boolean>(false)
const showLoadingOverlay = ref<boolean>(false)
let loadingTimeout: ReturnType<typeof setTimeout> | null = null

const dateSliderChanged = async (val: string[]) => {
  console.log('[Explorer] dateSliderChanged called with:', val)

  // Update URL state - useUrlState now handles optimistic updates internally
  dateFrom.value = val[0]!
  dateTo.value = val[1]!

  update('dateRange')
}

const labels = computed(() => allChartData?.labels || allChartLabels.value || [])

// Make Chart resizeable
const chartContainer = ref<HTMLElement | null>(null)
const showSizeLabel = ref<boolean>(false)
const hasBeenResized = ref<boolean>(false)
let sizeTimeout: ReturnType<typeof setTimeout> | null = null
const containerSize = ref('100x100')

// Apply preset size to chart
const applyPresetSize = (presetName: string) => {
  if (!chartContainer.value) return

  const preset = CHART_PRESETS.find(p => p.name === presetName)
  if (!preset) return

  // Special case: "Fit to Page" resets to default
  if (preset.width === 0 && preset.height === 0) {
    hasBeenResized.value = false
    chartContainer.value.style.width = ''
    chartContainer.value.style.height = ''
    containerSize.value = 'Fit to Page'
    showSizeLabel.value = true

    // Clear dimensions from URL
    chartWidth.value = undefined
    chartHeight.value = undefined

    // Trigger resize event
    window.dispatchEvent(new Event('resize'))

    // Hide label after timeout
    if (sizeTimeout) clearTimeout(sizeTimeout)
    sizeTimeout = setTimeout(() => (showSizeLabel.value = false), CHART_RESIZE.SIZE_LABEL_TIMEOUT)
    return
  }

  hasBeenResized.value = true
  chartContainer.value.style.width = `${preset.width}px`
  chartContainer.value.style.height = `${preset.height}px`

  // Save dimensions to URL
  chartWidth.value = preset.width
  chartHeight.value = preset.height

  // Update the size label to show preset name
  containerSize.value = preset.name
  showSizeLabel.value = true

  // Trigger resize event
  window.dispatchEvent(new Event('resize'))

  // Hide label after timeout
  if (sizeTimeout) clearTimeout(sizeTimeout)
  sizeTimeout = setTimeout(() => (showSizeLabel.value = false), CHART_RESIZE.SIZE_LABEL_TIMEOUT)
}

const updateData = async (
  shouldDownloadDataset: boolean,
  shouldUpdateDataset: boolean
) => {
  console.log('[Explorer] updateData called:', { shouldDownloadDataset, shouldUpdateDataset })
  isUpdating.value = true

  // Only show loading overlay if update takes longer than 500ms
  loadingTimeout = setTimeout(() => {
    showLoadingOverlay.value = true
  }, 500)

  if (shouldDownloadDataset) {
    console.log('[Explorer] Downloading dataset for countries:', countries.value)
    dataset = await updateDataset(
      chartType.value,
      countries.value,
      isAsmrType() ? ['all'] : ageGroups.value
    )
    console.log('[Explorer] Dataset downloaded, keys:', Object.keys(dataset))

    // All Labels
    allChartLabels.value = getAllChartLabels(
      dataset,
      isAsmrType(),
      ageGroups.value,
      countries.value,
      chartType.value
    )
    console.log('[Explorer] All chart labels:', allChartLabels.value)

    if (chartType.value === 'yearly') {
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
      type.value,
      showBaseline.value,
      standardPopulation.value
    )[0]
    if (!key) return

    console.log('[Explorer] Getting all chart data for countries:', countries.value)
    const newData = await getAllChartData(
      key,
      chartType.value,
      dataset,
      allChartLabels.value || [],
      getStartIndex(allYearlyChartLabels.value || [], sliderStart.value),
      showCumPi(),
      ageGroups.value,
      countries.value,
      baselineMethod.value,
      baselineDateFrom.value,
      baselineDateTo.value,
      getBaseKeysForType()
    )
    console.log('[Explorer] newData from getAllChartData:', newData)
    console.log('[Explorer] newData.data keys:', newData.data ? Object.keys(newData.data) : 'undefined')
    if (allChartData) Object.assign(allChartData, newData)
    else allChartData = newData
    console.log('[Explorer] allChartData after update:', allChartData)
    console.log('[Explorer] allChartData.data keys:', allChartData.data ? Object.keys(allChartData.data) : 'undefined')

    resetDates()
  }

  // Update filtered chart datasets
  console.log('[Explorer] Calling updateFilteredData...')
  const filteredData = await updateFilteredData()
  console.log('[Explorer] Filtered data:', filteredData)
  console.log('[Explorer] filteredData.datasets.length:', filteredData.datasets?.length)
  console.log('[Explorer] chartData.value before update:', chartData.value)
  console.log('[Explorer] Updating chartData with new data')
  chartData.value = filteredData as MortalityChartData
  console.log('[Explorer] chartData.value after update:', chartData.value)
  console.log('[Explorer] chartData.value.datasets.length:', chartData.value?.datasets?.length)

  configureOptions()

  // Clear the loading timeout and hide overlay
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
    loadingTimeout = null
  }
  showLoadingOverlay.value = false

  console.log('[Explorer] updateData completed, isUpdating = false')
  isUpdating.value = false
}

const isYearlyChartType = () =>
  chartType.value.includes('year')
  || chartType.value.includes('fluseason')
  || chartType.value.includes('midyear')

const showCumPi = (): boolean =>
  cumulative.value
  && isYearlyChartType()
  && ['lin_reg', 'mean'].includes(baselineMethod.value)

const getBaseKeysForType = (): (keyof NumberEntryFields)[] =>
  getKeyForType(type.value, showBaseline.value, standardPopulation.value, false)

const resetDates = () => {
  if (!allChartData || !allChartData.labels) return
  const labels = allChartData.labels
  if (labels.length === 0) return

  // Date Slider - validate and correct range
  const sliderStartStr = sliderStartPeriod()
  const defaultFrom = labels.includes(sliderStartStr) ? sliderStartStr : labels[0]!
  const defaultTo = labels[labels.length - 1]!

  const validatedRange = getValidatedRange(
    { from: dateFrom.value ?? defaultFrom, to: dateTo.value ?? defaultTo },
    labels,
    { from: defaultFrom, to: defaultTo }
  )

  if (validatedRange.from !== dateFrom.value || !dateFrom.value) {
    dateFrom.value = validatedRange.from
  }
  if (validatedRange.to !== dateTo.value || !dateTo.value) {
    dateTo.value = validatedRange.to
  }
}

const sliderStartPeriod = () =>
  getSeasonString(chartType.value, Number(sliderStart.value))

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

  console.log('[Explorer] Filtering data with countries:', countries.value, 'dateFrom:', dateFrom.value, 'dateTo:', dateTo.value)

  return await getFilteredChartData(
    countries.value,
    standardPopulation.value,
    ageGroups.value,
    showPredictionInterval.value,
    isExcess.value,
    type.value,
    cumulative.value,
    showBaseline.value,
    baselineMethod.value,
    baselineDateFrom.value,
    baselineDateTo.value,
    showTotal.value,
    chartType.value,
    dateFrom.value,
    dateTo.value,
    isBarChartStyle(),
    allCountries.value, // This is the country metadata, not the selected countries
    isErrorBarType(),
    userColors.value ?? colors,
    isMatrixChartStyle(),
    showPercentage.value,
    showCumPi(),
    isAsmrType(),
    maximize.value,
    showLabels.value,
    await makeUrl(),
    isLogarithmic.value,
    isPopulationType(),
    isDeathsType(),
    allChartData.labels,
    allChartData.data
  )
}

const configureOptions = () => {
  chartOptions.showTotalOption = isExcess && isBarChartStyle()
  chartOptions.showTotalOptionDisabled = !cumulative
  chartOptions.showMaximizeOption
    = !(isExcess && isLineChartStyle()) && !isMatrixChartStyle()
  chartOptions.showMaximizeOptionDisabled
    = isLogarithmic.value || (isExcess.value && !chartOptions.showTotalOption)
  chartOptions.showBaselineOption = hasBaseline() && !isMatrixChartStyle()
  chartOptions.showPredictionIntervalOption
    = chartOptions.showBaselineOption || (isExcess && !isMatrixChartStyle())
  chartOptions.showPredictionIntervalOptionDisabled
    = (!isExcess && !showBaseline) || (cumulative && !showCumPi())
  chartOptions.showCumulativeOption = isExcess.value
  chartOptions.showPercentageOption = isExcess.value
  chartOptions.showLogarithmicOption = !isMatrixChartStyle() && !isExcess
}

const resetBaselineDates = () => {
  if (!allChartLabels.value || !allYearlyChartLabels.value) return
  const labels = allChartLabels.value.slice(
    getStartIndex(allYearlyChartLabels.value, sliderStart.value)
  )
  if (labels.length === 0) return

  // Validate baseline range with minimum span requirement
  const defaultFrom = labels[0]!
  const defaultToIndex = Math.min(labels.length - 1, MIN_BASELINE_SPAN)
  const defaultTo = labels[defaultToIndex]!

  const validatedRange = getValidatedRange(
    { from: baselineDateFrom.value ?? defaultFrom, to: baselineDateTo.value ?? defaultTo },
    labels,
    { from: defaultFrom, to: defaultTo },
    MIN_BASELINE_SPAN
  )

  if (validatedRange.from !== baselineDateFrom.value || !baselineDateFrom.value) {
    baselineDateFrom.value = validatedRange.from
  }
  if (validatedRange.to !== baselineDateTo.value || !baselineDateTo.value) {
    baselineDateTo.value = validatedRange.to
  }

  // Start Select - reset to default if current value is invalid
  if (sliderStart.value && !allYearlyChartLabelsUnique.value?.includes(sliderStart.value)) {
    sliderStart.value = Defaults.sliderStart ?? '2010'
  }
}

// Load Data
const allCountries = ref<Record<string, Country>>({})
const isDataLoaded = ref(false)
const allAgeGroups = computed(() => {
  const result = new Set<string>()
  countries.value.forEach((countryCode) => {
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
  console.log('[Explorer] handleUpdate called with key:', key)
  console.log('[Explorer] Current state:', {
    countries: countries.value,
    type: type.value,
    chartType: chartType.value,
    chartStyle: chartStyle.value,
    isExcess: isExcess.value,
    ageGroups: ageGroups.value,
    standardPopulation: standardPopulation.value,
    showBaseline: showBaseline.value,
    baselineMethod: baselineMethod.value,
    cumulative: cumulative.value,
    showPredictionInterval: showPredictionInterval.value,
    showLabels: showLabels.value,
    maximize: maximize.value,
    isLogarithmic: isLogarithmic.value,
    showPercentage: showPercentage.value,
    showTotal: showTotal.value,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
    baselineDateFrom: baselineDateFrom.value,
    baselineDateTo: baselineDateTo.value
  })

  if (countries.value.length) {
    const shouldDownloadDataset = ['_countries', '_type', '_chartType', '_ageGroups'].includes(key)
    const shouldUpdateDataset = [
      '_baselineMethod',
      '_standardPopulation',
      '_baselineDateFrom',
      '_baselineDateTo',
      '_sliderStart'
    ].includes(key)
    || (baselineMethod.value !== 'auto' && key === '_cumulative')

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

    console.log('[Explorer] Update triggers:', {
      key,
      shouldDownloadDataset,
      shouldUpdateDataset,
      needsFilterUpdate,
      willCallUpdateData: shouldDownloadDataset || shouldUpdateDataset || needsFilterUpdate
    })

    // Always call updateData if any trigger is true OR if it's a filter update
    if (shouldDownloadDataset || shouldUpdateDataset || needsFilterUpdate) {
      await updateData(shouldDownloadDataset, shouldUpdateDataset)
    } else {
      console.log('[Explorer] No update needed for key:', key)
    }
  } else {
    console.log('[Explorer] Skipping updateData - no countries selected')
  }

  if (chartData.value) {
    if (key === '_maximize') chartData.value.isMaximized = maximize.value
    if (key === '_showLabels') chartData.value.showLabels = showLabels.value
  }
}

// Prevent concurrent updates
let isCurrentlyUpdating = false
let pendingUpdateKey: string | null = null

const update = async (key: string) => {
  console.log('[Explorer] update() called with key:', key)
  console.trace('[Explorer] Call stack:')

  // If already updating, queue this update
  if (isCurrentlyUpdating) {
    console.log('[Explorer] Already updating, queueing:', key)
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
      console.log('[Explorer] Processing queued update:', nextKey)
      await handleUpdate(nextKey)
    }
  } finally {
    isCurrentlyUpdating = false
    console.log('[Explorer] update() completed')
  }
}

// Event handlers for URL state updates
const handleCountriesChanged = async (v: string[]) => {
  // useUrlState now handles optimistic updates internally
  countries.value = v
  await nextTick()
  update('_countries')
}
const handleAgeGroupsChanged = async (v: string[]) => {
  ageGroups.value = v
  await nextTick()
  update('_ageGroups')
}
const handleTypeChanged = async (v: string) => {
  type.value = v
  await nextTick()
  update('_type')
}
const handleChartTypeChanged = async (v: string) => {
  chartType.value = v
  await nextTick()
  update('_chartType')
}
const handleChartStyleChanged = async (v: string) => {
  chartStyle.value = v
  await nextTick()
  update('_chartStyle')
}
const handleStandardPopulationChanged = async (v: string) => {
  standardPopulation.value = v
  await nextTick()
  update('_standardPopulation')
}
const handleIsExcessChanged = async (v: boolean) => {
  isExcess.value = v
  await nextTick()
  update('_isExcess')
}
const handleShowBaselineChanged = async (v: boolean) => {
  showBaseline.value = v
  await nextTick()
  update('_showBaseline')
}
const handleBaselineMethodChanged = async (v: string) => {
  baselineMethod.value = v
  await nextTick()
  update('_baselineMethod')
}
const handleBaselineSliderValueChanged = async (v: string[]) => {
  baselineDateFrom.value = v[0]!
  baselineDateTo.value = v[1]!
  await nextTick()
  update('_baselineDateFrom')
}
const handleShowPredictionIntervalChanged = async (v: boolean) => {
  showPredictionInterval.value = v
  await nextTick()
  update('_showPredictionInterval')
}
const handleShowLabelsChanged = async (v: boolean) => {
  showLabels.value = v
  await nextTick()
  update('_showLabels')
}
const handleMaximizeChanged = async (v: boolean) => {
  maximize.value = v
  await nextTick()
  update('_maximize')
}
const handleIsLogarithmicChanged = async (v: boolean) => {
  isLogarithmic.value = v
  await nextTick()
  update('_isLogarithmic')
}
const handleShowPercentageChanged = async (v: boolean) => {
  showPercentage.value = v
  await nextTick()
  update('_showPercentage')
}
const handleCumulativeChanged = async (v: boolean) => {
  cumulative.value = v
  await nextTick()
  update('_cumulative')
}
const handleShowTotalChanged = async (v: boolean) => {
  showTotal.value = v
  await nextTick()
  update('_showTotal')
}
const handleSliderStartChanged = async (v: string) => {
  // useUrlState now handles optimistic updates internally
  sliderStart.value = v
  await nextTick()
  update('_sliderStart')
}
const handleUserColorsChanged = async (v: string[]) => {
  userColors.value = v
  await nextTick()
  update('_userColors')
}
const handleChartPresetChanged = async (v: string) => {
  // Decode preset if it's in short form (dimensions)
  const match = v.match(/^(\d+)x(\d+)$/)
  if (match && match[1] && match[2]) {
    const width = parseInt(match[1])
    const height = parseInt(match[2])
    const preset = CHART_PRESETS.find(p => p.width === width && p.height === height)
    if (preset) {
      chartPreset.value = preset.name
      await nextTick()
      applyPresetSize(preset.name)
      return
    }
  }
  chartPreset.value = v
  await nextTick()
  applyPresetSize(v)
}
const handleShowLogoChanged = async (v: boolean) => {
  showLogo.value = v
  await nextTick()
}
const handleShowQrCodeChanged = async (v: boolean) => {
  showQrCode.value = v
  await nextTick()
}

// Setup ResizeObserver cleanup before any async operations
let resizeObserver: ResizeObserver | null = null
onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

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
  if (countries.value && countries.value.length > 0) {
    await updateData(true, true)
  }

  isDataLoaded.value = true
  await update('dateFrom')

  if (!isMobile() && chartContainer.value) {
    let isFirstResize = true

    // Restore saved dimensions from URL
    if (chartWidth.value && chartHeight.value) {
      hasBeenResized.value = true
      chartContainer.value.style.width = `${chartWidth.value}px`
      chartContainer.value.style.height = `${chartHeight.value}px`
    }

    resizeObserver = new ResizeObserver(() => {
      if (isFirstResize) {
        isFirstResize = false
        return
      }

      hasBeenResized.value = true

      const currentWidth = chartContainer.value?.offsetWidth || 0
      const currentHeight = chartContainer.value?.offsetHeight || 0

      // Save dimensions to URL
      chartWidth.value = currentWidth
      chartHeight.value = currentHeight

      // Check if current size matches a preset
      const matchedPreset = CHART_PRESETS.find(
        p => Math.abs(p.width - currentWidth) < 5 && Math.abs(p.height - currentHeight) < 5
      )

      if (matchedPreset) {
        containerSize.value = matchedPreset.name
        // Update preset in URL when it matches
        if (chartPreset.value !== matchedPreset.name) {
          chartPreset.value = matchedPreset.name
        }
      } else {
        containerSize.value = `${currentWidth - 2}×${currentHeight - 2}`
      }

      showSizeLabel.value = true
      window.dispatchEvent(new Event('resize'))
      requestAnimationFrame(() => (showSizeLabel.value = true))
      if (sizeTimeout) clearTimeout(sizeTimeout)
      sizeTimeout = setTimeout(() => (showSizeLabel.value = false), CHART_RESIZE.SIZE_LABEL_TIMEOUT)
    })

    resizeObserver.observe(chartContainer.value)
  }
})

// Chart action functions
const copyChartLink = async () => {
  console.log('[copyChartLink] Called')
  try {
    await navigator.clipboard.writeText(window.location.href)
    showToast('Link copied to clipboard!', 'success')
  } catch (error) {
    console.error('[copyChartLink] Error:', error)
    showToast('Failed to copy link', 'error')
  }
}

const screenshotChart = () => {
  console.log('[screenshotChart] Called')
  const canvas = document.querySelector('#chart') as HTMLCanvasElement
  console.log('[screenshotChart] Canvas found:', !!canvas)
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
  const base = 'https://mortality.watch/?qr='
  const query = JSON.stringify(window.location)
  const encodedQuery = arrayBufferToBase64(await compress(query))
  const url = base + encodeURIComponent(encodedQuery)
  window.open(url.replaceAll('/?qr', '/chart?qr'), '_blank')
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
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            Data Selection
          </h2>
        </template>

        <div class="flex flex-col gap-4">
          <!-- Jurisdictions - full width -->
          <div class="w-full">
            <MortalityChartControlsPrimary
              :all-countries="allCountries"
              :all-age-groups="allAgeGroups"
              :countries="countries"
              :age-groups="ageGroups"
              :is-asmr-type="isAsmrType()"
              :is-life-expectancy-type="isLifeExpectancyType()"
              :is-updating="false"
              :max-countries-allowed="getMaxCountriesAllowed()"
              @countries-changed="handleCountriesChanged"
              @age-groups-changed="handleAgeGroupsChanged"
            />
          </div>

          <!-- Date Range Selection -->
          <div class="w-full px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div class="flex items-center gap-3">
              <!-- Start Period -->
              <div class="flex items-center gap-2">
                <label class="text-sm font-medium whitespace-nowrap">From</label>
                <USelectMenu
                  v-model="sliderStart"
                  :items="allYearlyChartLabelsUnique || []"
                  placeholder="Start"
                  size="sm"
                  class="w-24"
                  :disabled="false"
                  @update:model-value="handleSliderStartChanged"
                />
                <UPopover>
                  <UButton
                    icon="i-lucide-info"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    aria-label="Start period information"
                  />
                  <template #content>
                    <div class="p-3 max-w-xs">
                      <div class="text-sm text-gray-700 dark:text-gray-300">
                        Sets the earliest year in the available data range. The Display slider will start from this year.
                      </div>
                    </div>
                  </template>
                </UPopover>
              </div>

              <!-- Divider -->
              <div class="h-6 w-px bg-gray-300 dark:bg-gray-600" />

              <!-- Date Range Slider -->
              <div class="flex-1 flex items-center gap-2">
                <label class="text-sm font-medium whitespace-nowrap">Display</label>
                <div class="flex-1">
                  <DateSlider
                    :slider-value="sliderValue"
                    :labels="labels"
                    :color="specialColor()"
                    :min-range="0"
                    :disabled="false"
                    @slider-changed="dateSliderChanged"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Main content area with responsive layout -->
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
        <!-- Chart section - takes up available space on large screens -->
        <div class="flex-1">
          <UCard
            class="chart-card"
            :class="{ 'chart-card-resizable': !isMobile(), 'chart-card-resized': hasBeenResized }"
            :ui="{ body: { padding: '0' } }"
          >
            <div
              ref="chartContainer"
              class="chart-wrapper relative"
              :class="{ resizable: !isMobile() }"
            >
              <!-- Glass overlay for loading (only shown after 500ms delay) -->
              <GlassOverlay
                v-if="showLoadingOverlay && chartData"
                title="Loading data..."
              />
              <div
                v-if="showSizeLabel"
                class="size-label"
              >
                {{ containerSize }}
              </div>
              <div
                v-if="countries.length === 0"
                class="banner"
              >
                <p>Please select a country.</p>
              </div>
              <MortalityChart
                v-if="countries.length > 0 && chartData"
                :chart-style="chartStyle as ChartStyle"
                :data="chartData"
                :is-excess="isExcess"
                :is-life-expectancy-type="isLifeExpectancyType()"
                :show-prediction-interval="showPredictionInterval"
                :show-percentage="showPercentage"
                :show-labels="showLabels"
                :is-deaths-type="isDeathsType()"
                :is-population-type="isPopulationType()"
                :show-logo="showLogo"
                :show-qr-code="showQrCode"
              />
            </div>
          </UCard>
        </div>

        <!-- Settings section - fixed width on large screens -->
        <div class="w-full lg:w-[420px] flex-shrink-0">
          <UCard class="tab-card">
            <template #header>
              <h2 class="text-xl font-semibold">
                Settings
              </h2>
            </template>

            <MortalityChartControlsSecondary
              :countries="countries"
              :labels="labels"
              :all-yearly-chart-labels-unique="allYearlyChartLabelsUnique || []"
              :type="type"
              :chart-type="chartType"
              :chart-style="chartStyle"
              :standard-population="standardPopulation"
              :is-updating="false"
              :is-population-type="isPopulationType()"
              :is-excess="isExcess"
              :baseline-method="baselineMethod"
              :baseline-slider-value="baselineSliderValue"
              :show-baseline="showBaseline"
              :slider-start="sliderStart"
              :show-prediction-interval="showPredictionInterval"
              :show-prediction-interval-disabled="showPredictionIntervalDisabled"
              :show-labels="showLabels"
              :maximize="maximize"
              :is-logarithmic="isLogarithmic"
              :show-percentage="showPercentage || false"
              :cumulative="cumulative"
              :show-total="showTotal"
              :show-logarithmic-option="!isMatrixChartStyle() && !isExcess"
              :show-maximize-option="
                !(isExcess && isLineChartStyle()) && !isMatrixChartStyle()
              "
              :show-maximize-option-disabled="
                isLogarithmic || (isExcess && !chartOptions.showTotalOption)
              "
              :show-percentage-option="isExcess"
              :show-cumulative-option="isExcess"
              :show-total-option="isExcess && isBarChartStyle()"
              :show-total-option-disabled="!cumulative"
              :show-prediction-interval-option="
                chartOptions.showBaselineOption
                  || (isExcess && !isMatrixChartStyle())
              "
              :show-prediction-interval-option-disabled="showPredictionIntervalDisabled"
              :is-matrix-chart-style="isMatrixChartStyle()"
              :colors="userColors ?? colors"
              :chart-preset="chartPreset"
              :show-logo="showLogo"
              :show-qr-code="showQrCode"
              @type-changed="handleTypeChanged"
              @chart-type-changed="handleChartTypeChanged"
              @chart-style-changed="handleChartStyleChanged"
              @standard-population-changed="handleStandardPopulationChanged"
              @is-excess-changed="handleIsExcessChanged"
              @show-baseline-changed="handleShowBaselineChanged"
              @baseline-method-changed="handleBaselineMethodChanged"
              @baseline-slider-value-changed="handleBaselineSliderValueChanged"
              @show-prediction-interval-changed="handleShowPredictionIntervalChanged"
              @show-labels-changed="handleShowLabelsChanged"
              @maximize-changed="handleMaximizeChanged"
              @is-logarithmic-changed="handleIsLogarithmicChanged"
              @show-percentage-changed="handleShowPercentageChanged"
              @cumulative-changed="handleCumulativeChanged"
              @show-total-changed="handleShowTotalChanged"
              @slider-start-changed="handleSliderStartChanged"
              @user-colors-changed="handleUserColorsChanged"
              @chart-preset-changed="handleChartPresetChanged"
              @show-logo-changed="handleShowLogoChanged"
              @show-qr-code-changed="handleShowQrCodeChanged"
            />
          </UCard>

          <!-- Chart Options Card -->
          <UCard
            class="mt-3"
            :ui="{ body: { padding: 'p-0' } }"
          >
            <template #header>
              <h2 class="text-xl font-semibold">
                Chart Options
              </h2>
            </template>
            <ClientOnly>
              <div class="flex flex-col">
                <button
                  class="chart-option-button"
                  @click="copyChartLink"
                >
                  <UIcon
                    name="i-lucide-link"
                    class="w-4 h-4 flex-shrink-0"
                  />
                  <div class="flex-1 text-left text-sm">
                    Copy Link
                  </div>
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="w-3 h-3 text-gray-400"
                  />
                </button>

                <div class="border-t border-gray-200 dark:border-gray-700" />

                <button
                  class="chart-option-button"
                  @click="screenshotChart"
                >
                  <UIcon
                    name="i-lucide-camera"
                    class="w-4 h-4 flex-shrink-0"
                  />
                  <div class="flex-1 text-left text-sm">
                    Download Screenshot
                  </div>
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="w-3 h-3 text-gray-400"
                  />
                </button>

                <div class="border-t border-gray-200 dark:border-gray-700" />

                <button
                  class="chart-option-button"
                  @click="saveChart"
                >
                  <UIcon
                    name="i-lucide-save"
                    class="w-4 h-4 flex-shrink-0"
                  />
                  <div class="flex-1 text-left text-sm">
                    Save Chart
                  </div>
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="w-3 h-3 text-gray-400"
                  />
                </button>
              </div>
            </ClientOnly>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Override UMain min-height for explorer page on desktop only */
@media (min-width: 1024px) {
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
}

@media (min-width: 1024px) {
  .chart-card.chart-card-resizable {
    max-height: 55vh;
  }
}

.chart-card.chart-card-resizable.chart-card-resized {
  width: fit-content;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  margin: -0.25rem;
}

.chart-wrapper.resizable {
  resize: both;
  overflow: hidden;
  height: 55vh;
  width: 100%;
  min-width: v-bind('CHART_RESIZE.MIN_WIDTH + "px"');
  min-height: v-bind('CHART_RESIZE.MIN_HEIGHT + "px"');
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
