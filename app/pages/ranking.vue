<script setup lang="ts">
import {
  getAllChartData,
  getAllChartLabels,
  loadCountryMetadata,
  updateDataset
} from '@/data'
import {
  type AllChartData,
  type CountryData,
  type Country,
  chartTypes,
  jurisdictionTypes,
  standardPopulationItems,
  baselineMethodItems,
  decimalPrecisionItems,
  getKeyForType
} from '@/model'
import {
  isMobile
} from '@/utils'
import { computed, onMounted, ref, watch, type ComputedRef } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import DateSlider from '../components/charts/DateSlider.vue'
import { useDateRangeValidation } from '@/composables/useDateRangeValidation'
import { usePeriodFormat } from '@/composables/usePeriodFormat'
import { useJurisdictionFilter } from '@/composables/useJurisdictionFilter'
import { useRankingTableSort } from '@/composables/useRankingTableSort'
import { greenColor, specialColor } from '@/colors'
import { useRoute, useRouter } from 'vue-router'
import { useUrlState, useUrlObjectState } from '@/composables/useUrlState'
import {
  defaultBaselineFromDate,
  defaultBaselineToDate,
  getSeasonString
} from '@/model/baseline'
import { blDescription } from '@/chart'
import { showToast } from '../toast'
import { decodeBool, encodeBool } from '@/lib/state/stateSerializer'
import {
  processCountryRow,
  visibleCountryCodesForExplorer
} from '@/lib/ranking/dataProcessing'
import type { TableRow } from '@/lib/ranking/types'

definePageMeta({
  ssr: false
})

const router = useRouter()
const route = useRoute()

// Debounced router updates for sliders
const debouncedRouterPush = useDebounceFn(
  (query: Record<string, string | string[]>) => router.push({ query }),
  300
)
const debouncedRouterPushSlow = useDebounceFn(
  (query: Record<string, string | string[]>) => router.push({ query }),
  667
)

// Set page title
useSeoMeta({
  title: 'Excess Mortality Ranking - Mortality Watch',
  description: 'Compare excess mortality rates across countries and regions. Interactive ranking table with customizable time periods and metrics.'
})

// Constants
const RANKING_START_YEAR = 2020
const RANKING_END_YEAR = 2023

const hasLoaded = ref(false)
const startYear = RANKING_START_YEAR
const endYear = RANKING_END_YEAR

const { getPeriodStart, getPeriodEnd } = usePeriodFormat()

const startPeriod = (): string => getPeriodStart(startYear, selectedPeriodOfTime.value.value)
const endPeriod = (): string => getPeriodEnd(endYear, selectedPeriodOfTime.value.value)

// URL State - boolean flags
const showASMR = useUrlState('a', true, (val: boolean) => encodeBool(val) ?? 1, val => decodeBool(val) ?? true)
const showTotals = useUrlState('t', true, (val: boolean) => encodeBool(val) ?? 1, val => decodeBool(val) ?? true)
const showTotalsOnly = computed({
  get: () => {
    if (!showTotals.value) return false
    return decodeBool((route.query.to as string) ?? '0') ?? false
  },
  set: (val: boolean) =>
    router.push({ query: { ...route.query, to: encodeBool(val) ?? 0 } })
})
const showRelative = useUrlState('r', true, (val: boolean) => encodeBool(val) ?? 1, val => decodeBool(val) ?? true)
const showPI = computed({
  get: () => {
    if (cumulative.value || showTotalsOnly.value) return false
    return decodeBool((route.query.pi as string) ?? '0') ?? false
  },
  set: (val: boolean) =>
    router.push({ query: { ...route.query, pi: encodeBool(val) ?? 0 } })
})
const cumulative = useUrlState('c', false, (val: boolean) => encodeBool(val) ?? 0, val => decodeBool(val) ?? false)
const hideIncomplete = computed({
  get: () => !(decodeBool((route.query.i as string) ?? '0') ?? false),
  set: (val: boolean) =>
    router.push({ query: { ...route.query, i: encodeBool(!val) ?? 0 } })
})
// Items for select menus - stable arrays with label and name properties
const periodOfTimeItems = chartTypes
  .filter(x => ['yearly', 'fluseason', 'midyear', 'quarterly'].includes(x.value))
  .map(x => ({ label: x.name, name: x.name, value: x.value }))

const jurisdictionTypeItems = jurisdictionTypes.map(x => ({ label: x.name, name: x.name, value: x.value }))

// URL State - string values
const selectedPeriodOfTimeValue = useUrlState('p', 'fluseason')
const selectedJurisdictionTypeValue = useUrlState('j', jurisdictionTypes[0]!.value)
const selectedStandardPopulation = useUrlObjectState('sp', standardPopulationItems[0]!, standardPopulationItems)

// Computed for select menus - returns objects that match items by reference
const selectedPeriodOfTime = computed({
  get: () => periodOfTimeItems.find(x => x.value === selectedPeriodOfTimeValue.value) || periodOfTimeItems[0]!,
  set: (val: { label: string, name: string, value: string }) => { selectedPeriodOfTimeValue.value = val.value }
})

const selectedJurisdictionType = computed({
  get: () => jurisdictionTypeItems.find(x => x.value === selectedJurisdictionTypeValue.value) || jurisdictionTypeItems[0]!,
  set: (val: { label: string, name: string, value: string }) => { selectedJurisdictionTypeValue.value = val.value }
})

const allYearlyChartLabelsUnique = computed(() => {
  const allYearlyChartLabels = Array.from(
    allLabels.value.map(v => v.substring(0, 4))
  )
  return Array.from(new Set(allYearlyChartLabels))
})

const sliderStart = ref('2020')
const { getValidatedRange } = useDateRangeValidation()

// Date Slider
const sliderValues = computed(() => {
  const start = getSeasonString(selectedPeriodOfTime.value?.value || 'yearly', parseInt(sliderStart.value))
  const startIdx = allLabels.value.indexOf(start || '')
  return startIdx === -1 ? allLabels.value : allLabels.value.slice(startIdx)
})

const sliderValue = computed({
  get: () => {
    const routeDf = route.query.df as string
    const routeDt = route.query.dt as string

    // Get defaults for current period type
    const defaultFrom = startPeriod()
    const defaultTo = endPeriod()

    // If no URL params or allLabels not loaded yet, use defaults
    if (!routeDf || !routeDt || allLabels.value.length === 0) {
      return [defaultFrom, defaultTo]
    }

    // Use URL params if they exist
    const urlRange = {
      from: routeDf,
      to: routeDt
    }

    // Validate and correct the range if needed
    const validatedRange = getValidatedRange(
      urlRange,
      sliderValues.value,
      { from: defaultFrom, to: defaultTo }
    )

    return [validatedRange.from, validatedRange.to]
  },
  set: (val: string[]) => {
    const newQuery: Record<string, string | string[]> = {}
    for (const [k, v] of Object.entries(route.query)) {
      if (v !== null && v !== undefined) {
        newQuery[k] = Array.isArray(v) ? v.filter((x): x is string => x !== null) : v
      }
    }
    newQuery.df = val[0] || ''
    newQuery.dt = val[1] || ''
    debouncedRouterPush(newQuery)
  }
})

// Baseline
const baselineSliderValues = () => {
  const labels = allLabels.value
  const idx = labels.indexOf(sliderStart.value)
  return idx === -1 ? labels : labels.slice(idx)
}

const selectedBaselineMethod = useUrlObjectState('bm', baselineMethodItems[2] || baselineMethodItems[0]!, baselineMethodItems)
const selectedDecimalPrecision: ComputedRef<typeof decimalPrecisionItems[0]> = useUrlObjectState('dp', decimalPrecisionItems[1]!, decimalPrecisionItems) // Default to "1"
const MIN_BASELINE_SPAN = 3 // Need at least 3 data points for baseline

const baselineSliderValue = computed({
  get: () => {
    const routeBf = route.query.bf as string
    const routeBt = route.query.bt as string

    // Get defaults for current period type
    const defaultFrom = defaultBaselineFromDate(
      selectedPeriodOfTime.value?.value || 'yearly',
      allLabels.value,
      selectedBaselineMethod.value?.value || 'mean'
    ) || ''
    const defaultTo = defaultBaselineToDate(selectedPeriodOfTime.value?.value || 'yearly') || ''

    // Use URL params if they exist, otherwise use defaults
    const urlRange = {
      from: routeBf ?? defaultFrom,
      to: routeBt ?? defaultTo
    }

    // Validate and correct the range if needed (with minimum span for baseline)
    const validatedRange = getValidatedRange(
      urlRange,
      allLabels.value,
      { from: defaultFrom, to: defaultTo },
      MIN_BASELINE_SPAN
    )

    return [validatedRange.from, validatedRange.to]
  },
  set: (val: string[]) => {
    const newQuery: Record<string, string | string[]> = {}
    for (const [k, v] of Object.entries(route.query)) {
      if (v !== null && v !== undefined) {
        newQuery[k] = Array.isArray(v) ? v.filter((x): x is string => x !== null) : v
      }
    }
    newQuery.bf = val[0] || ''
    newQuery.bt = val[1] || ''
    debouncedRouterPushSlow(newQuery)
  }
})

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

const key = (): keyof CountryData =>
  (showASMR.value
    ? 'asmr_' + selectedStandardPopulation.value.value
    : 'cmr') as keyof CountryData
const allLabels = ref<string[]>([])
const isUpdating = ref<boolean>(false)

const result = ref<TableRow[]>([])
const labels = ref<string[]>()
let sliderValueNeedsUpdate = false
const total_row_key = `TOTAL`

// Sorting and pagination
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

const sortedResult = computed(() => getSortedResult(result.value))
const paginatedResult = computed(() => getPaginatedResult(sortedResult.value))
const totalPages = computed(() => getTotalPages(sortedResult.value))

// Jurisdiction filtering
const { shouldShowCountry } = useJurisdictionFilter()
const showCountry = (iso3c: string): boolean =>
  shouldShowCountry(iso3c, selectedJurisdictionType.value.value)

const visibleCountryCodes = ref<Set<string>>(new Set<string>())
const allChartData = ref<AllChartData>()
const updateProgress = ref<number>(0)
const initialLoadDone = ref(false)

/**
 * Reset baseline slider to default values if needed
 */
const maybeResetBaselineSlider = () => {
  if (!sliderValueNeedsUpdate) return

  const newFrom = startPeriod()
  const newTo = endPeriod()
  const newBaselineFrom = defaultBaselineFromDate(
    selectedPeriodOfTime.value?.value || 'yearly',
    allLabels.value,
    selectedBaselineMethod.value?.value || 'mean'
  ) || ''
  const newBaselineTo = defaultBaselineToDate(selectedPeriodOfTime.value?.value || 'yearly') || ''

  sliderValue.value = [newFrom, newTo]
  baselineSliderValue.value = [newBaselineFrom, newBaselineTo]
  sliderValueNeedsUpdate = false
}

/**
 * Fetch and prepare chart data
 */
const fetchChartData = async () => {
  const type = showASMR.value ? 'asmr' : 'cmr'
  const dataKey = key()
  const periodOfTime = selectedPeriodOfTime.value?.value || 'yearly'
  const countryFilter = Object.keys(metaData.value).filter(
    x => showCountry(x) && (showASMR.value ? metaData.value[x]?.has_asmr() : true)
  )
  const ageFilter = ['all']
  const data = await updateDataset(periodOfTime, countryFilter, ageFilter)

  allLabels.value = getAllChartLabels(data, type === 'asmr')

  if (!allLabels.value.length) {
    showToast('No ASMR data for selected countries. Please Select CMR')
    return null
  }

  maybeResetBaselineSlider()

  // Use defaults if URL values aren't valid for current period type
  // Note: Can't rely on baselineSliderValue.value here because URL update is async
  let baselineFrom = baselineSliderValue.value[0] || ''
  let baselineTo = baselineSliderValue.value[1] || ''

  // Validate against current labels and use defaults if needed
  if (!allLabels.value.includes(baselineFrom)) {
    baselineFrom = defaultBaselineFromDate(
      periodOfTime,
      allLabels.value,
      selectedBaselineMethod.value?.value || 'mean'
    ) || ''
  }
  if (!allLabels.value.includes(baselineTo)) {
    baselineTo = defaultBaselineToDate(periodOfTime) || ''
  }

  const baselineStartIdx = allLabels.value.indexOf(baselineFrom)

  return await getAllChartData(
    dataKey,
    periodOfTime,
    data,
    allLabels.value,
    baselineStartIdx,
    cumulative.value,
    ageFilter,
    countryFilter,
    selectedBaselineMethod.value?.value || 'mean',
    baselineFrom,
    baselineTo,
    getKeyForType(type, true, selectedStandardPopulation.value?.value || 'who2015'),
    (progress, total) => (updateProgress.value = Math.round((progress / total) * 100))
  )
}

const loadData = async () => {
  if (isUpdating.value) return
  isUpdating.value = true

  // Fetch and prepare data
  const chartData = await fetchChartData()
  if (!chartData) {
    isUpdating.value = false
    return
  }

  allChartData.value = chartData
  updateProgress.value = 0

  // Calculate date range indices
  const dateFrom = sliderValue.value[0]
  const dateTo = sliderValue.value[1]
  const startIndex = allChartData.value?.labels.indexOf(dateFrom || '') || 0
  const endIndex = (allChartData.value?.labels.indexOf(dateTo || '') || 0) + 1

  // Prepare labels
  const dataLabels = [...(allChartData.value?.labels.slice(startIndex, endIndex) || [])]
  const newLabels = [...dataLabels]
  if (showTotals.value) newLabels.push(total_row_key)

  // Process all countries
  const newResult: TableRow[] = []
  const newVisibleCountryCodes = new Set<string>()

  if (!allChartData.value?.data?.all) {
    isUpdating.value = false
    return
  }

  const dataKey = key()
  for (const [iso3c, countryData] of Object.entries(allChartData.value.data.all)) {
    const { row, hasData } = processCountryRow({
      iso3c,
      countryData,
      dataKey,
      range: { startIndex, endIndex },
      dataLabels,
      metaData: metaData.value,
      explorerLink,
      display: {
        showRelative: showRelative.value,
        cumulative: cumulative.value,
        hideIncomplete: hideIncomplete.value
      },
      totalRowKey: total_row_key
    })

    if (hasData) {
      newVisibleCountryCodes.add(iso3c)
      newResult.push(row)
    }
  }

  // Update all refs at once
  labels.value = showTotalsOnly.value ? ['TOTAL'] : newLabels
  result.value = newResult
  visibleCountryCodes.value = newVisibleCountryCodes

  // Only reset page if current page would be out of bounds
  const maxPage = Math.ceil(newResult.length / itemsPerPage.value)
  if (currentPage.value > maxPage && maxPage > 0) {
    currentPage.value = 1
  }

  isUpdating.value = false
}

const sliderChanged = (val: string[]) => {
  sliderValue.value = val
  // URL update is debounced, watcher will trigger loadData
}

const baselineSliderChanged = (val: string[]) => {
  baselineSliderValue.value = val
  // URL update is debounced, watcher will trigger loadData
}

const periodOfTimeChanged = (val: { label: string, name: string, value: string }) => {
  // Update the selected value
  selectedPeriodOfTimeValue.value = val.value

  sliderValueNeedsUpdate = true

  // Reset URL params to defaults for new period type when period changes
  // Use the NEW period type (val.value) directly, not the computed property
  const defaultFrom = getPeriodStart(startYear, val.value)
  const defaultTo = getPeriodEnd(endYear, val.value)

  // Also reset baseline dates to match the new period type
  // Use hardcoded year to avoid issues with stale allLabels
  const baselineMethod = selectedBaselineMethod.value?.value || 'mean'
  const baselineStartYear = baselineMethod === 'lin_reg' ? 2010 : baselineMethod === 'mean' ? 2017 : 2015
  const defaultBaselineFrom = getSeasonString(val.value, baselineStartYear)
  const defaultBaselineTo = defaultBaselineToDate(val.value) || ''

  router.push({
    query: {
      ...route.query,
      p: val.value,
      df: defaultFrom,
      dt: defaultTo,
      bf: defaultBaselineFrom,
      bt: defaultBaselineTo
    }
  })
}

const explorerLink = (countryCodes?: string[]) => {
  const codes = countryCodes ?? Array.from(visibleCountryCodes.value)
  const link
    = `/explorer/?${visibleCountryCodesForExplorer(codes).join('&')}`
      + `&t=${showASMR.value ? 'asmr' : 'cmr'}_excess`
      + `&p=${showRelative.value ? '1' : '0'}`
      + `&df=${sliderValue.value[0]}`
      + `&dt=${sliderValue.value[1]}`
      + `&ce=${showTotalsOnly.value || cumulative.value ? '1' : '0'}`
      + `&st=${showTotalsOnly.value ? '1' : '0'}`
      + `&sp=${selectedStandardPopulation.value?.value || 'who2015'}`
      + `&sl=${countryCodes ? '1' : '0'}`
      + `&pi=${countryCodes && showPI.value ? '1' : '0'}`
      + `&m=1`
  if (selectedBaselineMethod.value?.value === 'mean') {
    return `${link}&v=2`
  } else {
    return (
      `${link}&`
      + `bm=${selectedBaselineMethod.value?.value || 'mean'}`
      + `&bf=${baselineSliderValue.value[0]}`
      + `&bt=${baselineSliderValue.value[1]}`
      + `&v=2`
    )
  }
}

const title = () => {
  let result = 'Excess '

  if (showASMR.value)
    result = isMobile()
      ? `${result}ASMR`
      : `${result}Age-Standardized Mortality Rate`
  else result = isMobile() ? `${result}CMR` : `${result}Crude Mortality Rate`
  if (selectedJurisdictionType.value.value !== 'countries') {
    result = `${result} [${selectedJurisdictionType.value.name}]`
  }
  return cumulative.value ? `Cumulative ${result}` : result
}

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
  totalRowKey: total_row_key,
  selectedBaselineMethod: selectedBaselineMethod.value?.value || 'mean',
  decimalPrecision: selectedDecimalPrecision.value?.value || '1',
  subtitle: subtitle.value
}))

// Only load data on client-side after mount
onMounted(() => {
  loadData().finally(() => {
    hasLoaded.value = true
    initialLoadDone.value = true
  })
})

// Watch URL query params directly to avoid double-triggering from object reference changes
// Includes slider params (df, dt, bf, bt) since debouncing is now handled in URL updates
watch(
  () => [
    route.query.a, // showASMR
    route.query.p, // selectedPeriodOfTime
    route.query.sp, // selectedStandardPopulation
    route.query.i, // hideIncomplete
    route.query.t, // showTotals
    route.query.to, // showTotalsOnly
    route.query.pi, // showPI
    route.query.c, // cumulative
    route.query.r, // showRelative
    route.query.j, // selectedJurisdictionType
    route.query.bm, // selectedBaselineMethod
    route.query.df, // slider from date
    route.query.dt, // slider to date
    route.query.bf, // baseline from date
    route.query.bt // baseline to date
  ],
  (newVal, oldVal) => {
    // Only trigger if:
    // 1. Initial load is done
    // 2. Values actually changed (oldVal exists and differs)
    // 3. Not already updating (prevents cascading reloads)
    if (initialLoadDone.value && oldVal && JSON.stringify(newVal) !== JSON.stringify(oldVal) && !isUpdating.value) {
      loadData()
    }
  },
  { flush: 'post' } // Run after component updates
)
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col gap-6 text-center mx-auto">
      <h1 class="text-4xl font-bold mb-6">
        Excess Mortality Ranking
      </h1>

      <div class="space-y-4">
        <p class="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          Compare excess mortality across all available countries and regions.
          Countries are ranked by total excess mortality for the selected period.
        </p>
        <p class="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
          Click on a country name to jump directly to the
          <NuxtLink
            to="/explorer"
            class="text-primary hover:underline"
          >Explorer</NuxtLink>
          for detailed time-series analysis and visualization.
        </p>
      </div>

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
          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold">
                Data Selection
              </h2>
            </template>

            <div class="flex flex-wrap gap-4">
              <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <label
                  class="text-sm font-medium whitespace-nowrap"
                  for="periodOfTime"
                >Period of Time</label>
                <USelectMenu
                  id="periodOfTime"
                  v-model="selectedPeriodOfTime"
                  :items="periodOfTimeItems"
                  placeholder="Select the period of time"
                  size="sm"
                  class="w-44"
                  @update:model-value="periodOfTimeChanged"
                />
              </div>
              <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <label
                  class="text-sm font-medium whitespace-nowrap"
                  for="jurisdictionType"
                >Jurisdictions</label>
                <USelectMenu
                  id="jurisdictionType"
                  v-model="selectedJurisdictionType"
                  :items="jurisdictionTypeItems"
                  placeholder="Select the jurisdictions to include"
                  size="sm"
                  class="w-48"
                />
              </div>
            </div>

            <div
              v-if="allLabels.length"
              class="mt-6 flex flex-wrap gap-6"
            >
              <div
                v-show="selectedBaselineMethod.value !== 'auto'"
                class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <label
                  class="text-sm font-medium whitespace-nowrap"
                  for="startingPeriod"
                >
                  Start Period
                </label>
                <USelectMenu
                  id="startingPeriod"
                  v-model="sliderStart"
                  :items="allYearlyChartLabelsUnique"
                  placeholder="Select the start period"
                  :disabled="isUpdating"
                  size="sm"
                  class="w-24"
                />
              </div>

              <div class="flex-1 min-w-[400px] px-4 pt-1 pb-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div class="flex items-center gap-4">
                  <label class="text-sm font-medium whitespace-nowrap">
                    Date Range
                  </label>
                  <div class="flex-1 mt-12 px-4">
                    <DateSlider
                      :slider-value="sliderValue"
                      :labels="sliderValues"
                      :color="specialColor()"
                      :min-range="0"
                      @slider-changed="sliderChanged"
                    />
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Ranking Table - Second on mobile, first on large screens -->
        <div class="order-2 lg:order-1 flex-1">
          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold">
                {{ title() }}
              </h2>
            </template>

            <RankingTable
              v-model:current-page="currentPage"
              v-model:items-per-page="itemsPerPage"
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
              :loading="{ isUpdating, hasLoaded, progress: updateProgress }"
              @toggle-sort="toggleSort"
            />
            <UButton
              :to="explorerLink()"
              variant="outline"
              size="lg"
              class="mt-4"
            >
              Show in Mortality Explorer
            </UButton>
          </UCard>
        </div>

        <!-- Right Sidebar (Desktop only) - contains Data Selection + Settings -->
        <div class="hidden lg:flex lg:flex-col lg:gap-4 lg:order-2 lg:w-[420px] flex-shrink-0">
          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold">
                Data Selection
              </h2>
            </template>

            <div class="flex flex-wrap gap-4">
              <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <label
                  class="text-sm font-medium whitespace-nowrap"
                  for="periodOfTime2"
                >Period of Time</label>
                <USelectMenu
                  id="periodOfTime2"
                  v-model="selectedPeriodOfTime"
                  :items="periodOfTimeItems"
                  placeholder="Select the period of time"
                  size="sm"
                  class="w-44"
                  @update:model-value="periodOfTimeChanged"
                />
              </div>
              <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <label
                  class="text-sm font-medium whitespace-nowrap"
                  for="jurisdictionType2"
                >Jurisdictions</label>
                <USelectMenu
                  id="jurisdictionType2"
                  v-model="selectedJurisdictionType"
                  :items="jurisdictionTypeItems"
                  placeholder="Select jurisdiction"
                  size="sm"
                  class="w-32"
                />
              </div>

              <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <label
                  class="text-sm font-medium whitespace-nowrap"
                  for="startingPeriod2"
                >
                  Start Period
                </label>
                <USelectMenu
                  id="startingPeriod2"
                  v-model="sliderStart"
                  :items="allYearlyChartLabelsUnique"
                  placeholder="Select the start period"
                  :disabled="isUpdating"
                  size="sm"
                  class="w-24"
                />
              </div>

              <div class="flex-1 min-w-[400px] px-4 pt-1 pb-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div class="flex items-center gap-4">
                  <label class="text-sm font-medium whitespace-nowrap">
                    Date Range
                  </label>
                  <div class="flex-1 mt-12 px-4">
                    <DateSlider
                      :slider-value="sliderValue"
                      :labels="sliderValues"
                      :color="specialColor()"
                      :min-range="0"
                      @slider-changed="sliderChanged"
                    />
                  </div>
                </div>
              </div>
            </div>
          </UCard>

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
            @baseline-slider-changed="baselineSliderChanged"
          />
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
            @baseline-slider-changed="baselineSliderChanged"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
