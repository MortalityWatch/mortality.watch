import {
  getSourceDescription,
  getStartIndex,
  loadCountryMetadata
} from '@/lib/data'
import { getCamelCase, isMobile } from '@/utils'
import { reactive, ref, toRaw, unref } from 'vue'
import type { Serializable } from './serializable'
import type {
  DatasetRaw,
  AllChartData,
  Country,
  ListType
} from '@/model'
import { getChartTypeFromOrdinal, baselineMethods } from '@/model'
import { ChartPeriod, type ChartType } from './period'
import type { LocationQuery } from 'vue-router'
import { getSeasonString, defaultBaselineFromDate, defaultBaselineToDate } from './baseline'
import { getColorsForDataset } from '@/colors'
import type { MortalityChartData } from '@/lib/chart/chartTypes'
import { StateHelpers } from './state/StateHelpers'
import { StateSerialization } from './state/StateSerialization'
import { Defaults } from '@/lib/state/stateSerializer'
import { createStateProperties, type StateProperties } from './state/stateProperties'
import { DataService } from '@/services/dataService'

/**
 * State class - Manages chart/explorer state
 *
 * Phase 10.2: Proxy pattern for zero-boilerplate property access
 * - ES6 Proxy automatically delegates simple properties to StateProperties
 * - Side effects centralized in _sideEffects map
 * - Only properties with custom logic need explicit getters
 * - 100% backward compatible API
 *
 * Previous phases:
 * - Phase 9.3: Composition over inheritance (StateProperties, StateHelpers, DataService)
 * - Eliminated StateCore's 35+ getter/setter pairs
 * - Improved type safety (no @ts-expect-error)
 */
export class State implements Serializable {
  // Composition: reactive state properties
  private _props: StateProperties

  // Composition: helpers and services
  private _helpers: StateHelpers
  private _serializer: StateSerialization
  private _dataService: DataService

  // Side effects map for property setters
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _sideEffects: Map<string, (val: any) => void>

  // TypeScript declarations for Proxy-delegated properties
  // These are handled by the Proxy at runtime, but TypeScript needs to know they exist
  countries!: string[]
  chartType!: string
  type!: string
  isExcess!: boolean
  showBaseline!: boolean
  userColors?: string[]

  constructor() {
    // Create reactive state with defaults
    this._props = createStateProperties(Defaults as Partial<StateProperties>)

    // Initialize helpers with state properties
    this._helpers = new StateHelpers(this._props)

    // Data service
    this._dataService = new DataService()

    // Serializer will be initialized in initFromSavedState with allCountries
    // Use a placeholder that will be replaced
    this._serializer = {} as StateSerialization

    // Initialize side effects map
    this._sideEffects = this._initializeSideEffects()

    // Return Proxy instead of class instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this._createProxy() as any as State
  }

  /**
   * Create Proxy for automatic property delegation
   *
   * Delegates property access to _props unless:
   * - Property is a method on State class
   * - Property has a getter with custom logic
   */
  private _createProxy(): State {
    return new Proxy(this, {
      get: (target, prop: string | symbol) => {
        // Only handle string properties (not symbols like Symbol.toStringTag)
        if (typeof prop !== 'string') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (target as any)[prop]
        }

        // 1. Check if it's a method or getter on the State class prototype
        const descriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(target),
          prop
        )
        if (descriptor) {
          // If it's a getter, call it
          if (descriptor.get) {
            return descriptor.get.call(target)
          }
          // If it's a method, bind it to target
          if (typeof descriptor.value === 'function') {
            return descriptor.value.bind(target)
          }
        }

        // 2. Check private properties (start with _)
        if (prop.startsWith('_')) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (target as any)[prop]
        }

        // 3. Delegate to _props for state properties
        if (prop in target._props) {
          return target._props[prop as keyof StateProperties]
        }

        // 4. Return undefined for unknown properties
        return undefined
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set: (target, prop: string | symbol, value: any) => {
        // Only handle string properties
        if (typeof prop !== 'string') {
          return false
        }

        // 1. Check if there's a setter on the State class
        const descriptor = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(target),
          prop
        )
        if (descriptor?.set) {
          descriptor.set.call(target, value)
          return true
        }

        // 2. Handle private properties
        if (prop.startsWith('_')) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (target as any)[prop] = value
          return true
        }

        // 3. Delegate to _props with optional side effects
        if (prop in target._props) {
          // Execute side effect if registered
          const sideEffect = target._sideEffects.get(prop)
          if (sideEffect) {
            sideEffect.call(target, value)
          }

          // Type assertion needed for Proxy dynamic property assignment
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(target._props as any)[prop] = value
          return true
        }

        // 4. Unknown property - fail
        return false
      }
    }) as State
  }

  /**
   * Initialize side effects map
   *
   * Side effects are additional actions that occur when setting certain properties.
   * These were previously embedded in setter methods.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _initializeSideEffects(): Map<string, (val: any) => void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const effects = new Map<string, (val: any) => void>()

    // type: Reset age groups for ASMR/LE, disable excess for population
    effects.set('type', function (this: State, val: string) {
      if (val.startsWith('asmr') || val.startsWith('le')) {
        this._props.ageGroups = ['all']
      }
      if (val === 'population') {
        this._props.isExcess = false
        this._props.baselineMethod = Defaults.baselineMethod
      }
    })

    return effects
  }

  // ============================================================================
  // PUBLIC API - Getters with Custom Logic Only
  // ============================================================================
  // Note: Simple property access is now handled by Proxy
  // Only properties with conditional logic, defaults, or computed values need explicit getters

  // Chart Style: Defaults to 'bar' for excess, 'line' otherwise
  get chartStyle(): string {
    return this._props.chartStyle || (this._props.isExcess ? 'bar' : 'line')
  }

  // Age Groups: Always ['all'] for ASMR types
  get ageGroups(): string[] {
    if (this.isAsmrType()) return ['all']
    return this._props.ageGroups
  }

  // Standard Population: Context-dependent default
  get standardPopulation(): string {
    return this._props.standardPopulation || (this.countries.length > 1 ? Defaults.standardPopulation : 'country')
  }

  // Baseline Method: Type-dependent default
  get baselineMethod(): string {
    if (this._props.baselineMethod) return this._props.baselineMethod
    // Default logic
    switch (this.type) {
      case 'cmr':
      case 'deaths':
        return 'lin_reg'
      default:
        return Defaults.baselineMethod
    }
  }

  // Cumulative: Disabled when not in excess mode
  get cumulative(): boolean {
    if (!this.isExcess) return false
    return this._props.cumulative
  }

  // Show Total: Only available for bar charts in cumulative mode
  get showTotal(): boolean {
    if (!this.isBarChartStyle() || !this.cumulative) return false
    return this._props.showTotal
  }

  // Maximize: Disabled when logarithmic
  get maximize(): boolean {
    if (this.isLogarithmic) return false
    return this._props.maximize
  }

  // Show Prediction Interval: Complex conditional logic
  get showPredictionInterval(): boolean {
    if (
      (!this.isExcess && !this.showBaseline)
      || this.isMatrixChartStyle()
      || (this.cumulative && !this._helpers.showCumPi())
    )
      return false

    if (this._props.showPredictionInterval !== undefined) {
      return this._props.showPredictionInterval
    }
    return this.isExcess ? !Defaults.showPredictionInterval : Defaults.showPredictionInterval
  }

  // Show Percentage: Only available in excess mode
  get showPercentage(): boolean {
    if (!this.isExcess) return false
    return this._props.showPercentage ?? (this.isExcess && !this.cumulative)
  }

  // Is Logarithmic: Disabled for matrix charts or excess mode
  get isLogarithmic(): boolean {
    if (this.isMatrixChartStyle() || this.isExcess) return false
    return this._props.isLogarithmic
  }

  // Date From: With default fallback
  get dateFrom(): string {
    return this._props.dateFrom ?? this._defaultFromDate() ?? ''
  }

  set dateFrom(val: string | undefined) {
    this._props.dateFrom = val
  }

  // Date To: With default fallback
  get dateTo(): string {
    return this._props.dateTo ?? this._defaultToDate() ?? ''
  }

  set dateTo(val: string | undefined) {
    this._props.dateTo = val
  }

  // Slider Start: With default fallback
  get sliderStart(): string {
    return this._props.sliderStart ?? this._defaultSliderStart() ?? ''
  }

  set sliderStart(val: string | undefined) {
    this._props.sliderStart = val
  }

  // Baseline Date From: Complex default with label dependency
  get baselineDateFrom(): string {
    if (this._props.baselineDateFrom) return this._props.baselineDateFrom
    const labels = unref(this.allChartLabels)!
    return defaultBaselineFromDate(this.chartType as ChartType, labels, this.baselineMethod) ?? ''
  }

  set baselineDateFrom(val: string | undefined) {
    this._props.baselineDateFrom = val
  }

  // Baseline Date To: With default fallback
  get baselineDateTo(): string {
    return this._props.baselineDateTo ?? defaultBaselineToDate(this.chartType as ChartType)
  }

  set baselineDateTo(val: string | undefined) {
    this._props.baselineDateTo = val
  }

  // Show Labels: Complex conditional with chart data dependency
  get showLabels(): boolean {
    const val = this._props.showLabels
    if (val !== undefined) return val
    return (
      Defaults.showLabels
      && this.allChartData
      && this.dateToIndex() - this.dateFromIndex() + 1 <= (isMobile() ? 20 : 60)
    )
  }

  // Computed properties
  get sliderValue(): string[] {
    return [this.dateFrom, this.dateTo]
  }

  set sliderValue(sliderValue: string[]) {
    if (this.dateFrom !== sliderValue[0]) {
      this.dateFrom = sliderValue[0]
    }
    if (this.dateTo !== sliderValue[1]) {
      this.dateTo = sliderValue[1]
    }
  }

  get baselineSliderValue(): string[] {
    return [this.baselineDateFrom, this.baselineDateTo]
  }

  set baselineSliderValue(sliderValue: string[]) {
    if (this.baselineDateFrom !== sliderValue[0])
      this.baselineDateFrom = sliderValue[0]
    if (this.baselineDateTo !== sliderValue[1])
      this.baselineDateTo = sliderValue[1]
  }

  // Custom colors getter with normalization logic
  get colors(): string[] {
    const defaultColors = getColorsForDataset(this.dataset)
    if (!this.userColors) return defaultColors
    if (this.userColors.length > defaultColors.length) {
      this._props.userColors = this.userColors.slice(0, defaultColors.length)
    }
    if (this.userColors.length < defaultColors.length) {
      this._props.userColors = [
        ...this.userColors,
        ...defaultColors.slice(this.userColors.length)
      ]
    }
    return this.userColors
  }

  // Baseline method entry helper
  baselineMethodEntry = (): ListType =>
    baselineMethods.filter(v => v.value === this.baselineMethod)[0] ?? { name: '', value: '' }

  // ============================================================================
  // DATA PROPERTIES
  // ============================================================================

  // Transitory
  chartOptions = reactive({
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

  // Data
  allCountries!: Record<string, Country>
  dataset!: DatasetRaw
  allChartLabels = ref<string[]>()
  allYearlyChartLabels = ref<string[]>()
  allYearlyChartLabelsUnique = ref<string[]>()
  allChartData!: AllChartData
  chartData!: MortalityChartData

  // Other
  isUpdating = ref(false)

  async initFromSavedState(locationQuery: LocationQuery): Promise<void> {
    // Load country metadata if needed
    if (!this.allCountries) this.allCountries = await loadCountryMetadata()

    // Initialize serializer with state properties and countries
    this._serializer = new StateSerialization(this._props, this.allCountries)

    // Use the serializer to load state
    await this._serializer.initFromSavedState(locationQuery)
  }

  private configureOptions = () => {
    this.chartOptions.showTotalOption = this.isExcess && this.isBarChartStyle()
    this.chartOptions.showTotalOptionDisabled = !this.cumulative
    this.chartOptions.showMaximizeOption
      = !(this.isExcess && this.isLineChartStyle()) && !this.isMatrixChartStyle()
    this.chartOptions.showMaximizeOptionDisabled
      = this.isLogarithmic
        || (this.isExcess && !this.chartOptions.showTotalOption)
    this.chartOptions.showBaselineOption
      = this.hasBaseline() && !this.isMatrixChartStyle()
    this.chartOptions.showPredictionIntervalOption
      = this.chartOptions.showBaselineOption
        || (this.isExcess && !this.isMatrixChartStyle())
    this.chartOptions.showPredictionIntervalOptionDisabled
      = (!this.isExcess && !this.showBaseline)
        || (this.cumulative && !this.showCumPi())
    this.chartOptions.showCumulativeOption = this.isExcess
    this.chartOptions.showPercentageOption = this.isExcess
    this.chartOptions.showLogarithmicOption
      = !this.isMatrixChartStyle() && !this.isExcess
  }

  sliderStartPeriod = () =>
    getSeasonString(this.chartType as ChartType, Number(this.sliderStart))

  // ============================================================================
  // HELPER METHODS - Delegate to StateHelpers
  // ============================================================================

  isAsmrType = () => this._helpers.isAsmrType()

  isPopulationType = () => this._helpers.isPopulationType()

  isLifeExpectancyType = () => this._helpers.isLifeExpectancyType()

  isDeathsType = () => this._helpers.isDeathsType()

  isErrorBarType = () => this._helpers.isErrorBarType()

  hasBaseline = () => this._helpers.hasBaseline()

  isLineChartStyle = () => this._helpers.isLineChartStyle()

  isBarChartStyle = () => this._helpers.isBarChartStyle()

  isMatrixChartStyle = () => this._helpers.isMatrixChartStyle()

  isWeeklyChartType = () => this._helpers.isWeeklyChartType()

  isMonthlyChartType = () => this._helpers.isMonthlyChartType()

  isYearlyChartType = () => this._helpers.isYearlyChartType()

  /**
   * Get ChartPeriod instance for current labels
   * Helper method to enable ChartPeriod API usage throughout the state
   */
  private getChartPeriod = (): ChartPeriod => {
    return new ChartPeriod(this.getLabels(), this.chartType as ChartType)
  }

  dateFromIndex = () => this.getChartPeriod().indexOf(this.dateFrom)

  dateToIndex = () => this.getChartPeriod().indexOf(this.dateTo)

  baselineDateFromIndex = () => this.getChartPeriod().indexOf(this.baselineDateFrom)

  baselineDateToIndex = () => this.getChartPeriod().indexOf(this.baselineDateTo)

  indexToDate = (index: number) => this.getLabels()[index]

  maxDateIndex = () => this.getLabels().length - 1

  getLabels = () => {
    if (!this.showSliderStartSelect()) return this.allChartData.labels

    // Use ChartPeriod for smart index lookup
    const period = new ChartPeriod(this.allChartData.labels, this.chartType as ChartType)
    const startIdx = period.indexOf(this.sliderStartPeriod())
    return this.allChartData.labels.slice(startIdx)
  }

  getBaseKeysForType = () => this._helpers.getBaseKeysForType()

  getMaxDateType = () => this._helpers.getMaxDateType()

  periodMultiplicatorForType = () => this._helpers.periodMultiplicatorForType()

  // Backwards compatibility check
  isIsoKey = (str: string) => this._helpers.isIsoKey(str)

  showCumPi = (): boolean => this._helpers.showCumPi()

  _defaultFromDate = () => {
    const labels = this.allChartLabels.value!
    const years = 10
    switch (this.chartType) {
      case 'weekly':
      case 'weekly_104w_sma':
      case 'weekly_52w_sma':
      case 'weekly_26w_sma':
      case 'weekly_13w_sma':
        return labels[Math.max(0, labels.length - years * 52 - 3)]
      case 'monthly':
        return labels[Math.max(0, labels.length - years * 12)]
      case 'quarterly':
        return labels[Math.max(0, labels.length - years * 4)]
      default:
        return labels[Math.max(0, labels.length - years)]
    }
  }

  _defaultToDate = () =>
    this.allChartLabels.value![this.allChartLabels.value!.length - 1]

  _defaultPeriods = 30

  _defaultSliderPeriods = () =>
    Math.round(this._defaultPeriods * this.periodMultiplicatorForType())

  _defaultSliderStart = () => {
    const labels = this.allYearlyChartLabels.value ?? []
    if (!this.showSliderStartSelect()) return labels[0]
    return labels[labels.length - this._defaultSliderPeriods()] ?? labels[0]
  }

  showSliderStartSelect = () =>
    (this.allChartLabels.value?.length ?? 0) > this._defaultPeriods + 10

  resetBaselineDates = () => {
    const labels = this.allChartLabels.value!.slice(
      getStartIndex(this.allYearlyChartLabels.value!, this.sliderStart)
    )
    if (!labels.includes(this.baselineDateFrom))
      this.baselineDateFrom = labels[0]
    if (!labels.includes(this.baselineDateTo)) this.baselineDateTo = labels[0]
    // Start Select
    if (!this.allYearlyChartLabelsUnique.value?.includes(this.sliderStart)) {
      this.sliderStart = undefined
    }
  }

  resetDates = () => {
    const labels = this.allChartData.labels
    // Date Slider
    const sliderStart = this.sliderStartPeriod()
    if (!labels.includes(this.dateFrom)) {
      if (labels.includes(sliderStart)) this.dateFrom = sliderStart
      this.dateFrom = labels[0]
    }
    if (!labels.includes(this.dateTo)) this.dateTo = undefined
  }

  // ============================================================================
  // DATA UPDATE METHODS
  // ============================================================================

  updateData = async (
    shouldDownloadDataset: boolean,
    shouldUpdateDataset: boolean
  ) => {
    this.isUpdating.value = true
    if (!this.allCountries) this.allCountries = await this._dataService.loadCountries()

    // Use DataService to update dataset and chart data
    this.dataset = await this._dataService.updateData(
      this._props,
      this.allCountries,
      this.dataset,
      this.allChartLabels,
      this.allYearlyChartLabels,
      this.allYearlyChartLabelsUnique,
      this.allChartData,
      shouldDownloadDataset,
      shouldUpdateDataset,
      {
        isAsmrType: this.isAsmrType.bind(this),
        showCumPi: this.showCumPi.bind(this),
        getBaseKeysForType: this.getBaseKeysForType.bind(this)
      }
    )

    if (shouldDownloadDataset || shouldUpdateDataset) {
      this.resetBaselineDates()
      this.resetDates()
    }

    // Update filtered chart datasets
    const filteredData = await this.updateFilteredData()
    if (this.chartData) {
      Object.assign(this.chartData, filteredData)
    } else {
      this.chartData = filteredData
    }

    this.configureOptions()

    this.isUpdating.value = false
  }

  updateFilteredData = async () =>
    await this._dataService.getFilteredData(
      this._props,
      this.allCountries,
      this.colors,
      this.allChartData.labels!,
      this.allChartData.data!,
      {
        isAsmrType: this.isAsmrType.bind(this),
        isBarChartStyle: this.isBarChartStyle.bind(this),
        isMatrixChartStyle: this.isMatrixChartStyle.bind(this),
        isPopulationType: this.isPopulationType.bind(this),
        isDeathsType: this.isDeathsType.bind(this),
        isErrorBarType: this.isErrorBarType.bind(this),
        showCumPi: this.showCumPi.bind(this)
      }
    )

  handleUpdate = async (key: string) => {
    if (this.countries.length) {
      await this.updateData(
        ['_countries', '_type', '_chartType', '_ageGroups'].includes(key),
        [
          '_baselineMethod',
          '_standardPopulation',
          '_baselineDateFrom',
          '_baselineDateTo',
          '_sliderStart'
        ].includes(key)
        || (this.baselineMethod !== 'auto' && key == '_cumulative')
      )
    }

    if (key === '_maximize') this.chartData.isMaximized = this.maximize
    if (key === '_showLabels') this.chartData.showLabels = this.showLabels
  }

  asmrCountries = (): Record<string, string> => {
    const result: Record<string, string> = {}
    Object.entries(this.allCountries).map(([iso3c, country]) => {
      if (country.has_asmr()) result[iso3c] = country.jurisdiction
    })
    return result
  }

  cmrCountries = (): Record<string, string> => {
    const result: Record<string, string> = {}
    Object.entries(this.allCountries).map(
      ([iso3c, country]) => (result[iso3c] = country.jurisdiction)
    )
    return result
  }

  allAgeGroups = (): ListType[] => {
    const result: Set<string> = new Set()
    Object.values(this.allCountries).filter((c: Country) => {
      if (!this.countries.includes(c.iso3c)) return
      for (const ag of c.age_groups()) {
        result.add(JSON.stringify({ name: getCamelCase(ag), value: ag }))
      }
    })
    const final: ListType[] = []
    Array.from(result)
      .sort()
      .forEach((b) => {
        final.push(JSON.parse(b))
      })
    return final
  }

  sources = (): string[] => {
    const result: string[] = []
    for (const source of this.chartData.sources) {
      if (source) result.push(getSourceDescription(source))
    }
    return result
  }

  notes = (): string[] => {
    const notes = this.allChartData.notes

    // No data
    const result = []
    if (notes?.noData) {
      for (const iso3c in notes.noData) {
        const ags = notes.noData[iso3c]
        const country = this.allCountries[iso3c]
        if (!country) continue
        const agsSet = ags as Set<string> | undefined
        if (!agsSet) continue
        result.push(
          `${country.jurisdiction}: No data for age groups: ${Array.from(
            agsSet
          ).join(', ')}`
        )
      }
    }

    // No ASMR
    if (notes?.noAsmr) {
      for (const iso3c of notes.noAsmr) {
        const country = this.allCountries[iso3c]
        if (!country) continue
        result.push(
          `${country.jurisdiction}: No ASMR data available. Please consider using CMR instead.`
        )
      }
    }
    // Disaggregated
    if (notes?.disaggregatedData) {
      for (const iso3c in notes.disaggregatedData) {
        const types: string[] = []
        const country = this.allCountries[iso3c]
        if (!country) continue
        const disaggData = notes.disaggregatedData[iso3c]
        if (!disaggData) continue
        for (const ord of disaggData)
          types.push(getChartTypeFromOrdinal(ord))
        result.push(
          `${country.jurisdiction}: Data may be disaggregated from ${types.join(
            ', '
          )} resolution.`
        )
      }
    }

    return result.sort()
  }

  getChartDataRaw = () => toRaw(this.chartData)
}
