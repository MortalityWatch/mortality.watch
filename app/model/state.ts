import {
  getSourceDescription,
  loadCountryMetadata
} from '@/lib/data'
import { getCamelCase } from '@/utils'
import { toRaw } from 'vue'
import type { Serializable } from './serializable'
import type {
  DatasetRaw,
  AllChartData,
  Country,
  ListType
} from '@/model'
import { getChartTypeFromOrdinal, baselineMethods } from '@/model'
import type { LocationQuery } from 'vue-router'
import type { MortalityChartData } from '@/lib/chart/chartTypes'
import { StateHelpers } from './state/StateHelpers'
import { StateSerialization } from './state/StateSerialization'
import { StateData } from './state/StateData'
import { StateComputed } from './state/StateComputed'
import { StateValidation } from './state/StateValidation'
import { StateEffects } from './state/StateEffects'
import { DataService } from '@/services/dataService'

/**
 * State class - Central state management for chart/explorer
 *
 * Architecture (Composition Pattern):
 * - StateData: Core data properties and storage
 * - StateComputed: Derived/computed properties
 * - StateValidation: State validation and integrity
 * - StateEffects: Side effect coordination
 * - StateHelpers: Type checking and utility methods
 * - StateSerialization: URL state persistence
 * - DataService: External data loading and processing
 *
 * Design Principles:
 * - Single Responsibility: Each class handles specific concerns
 * - Explicit Side Effects: All changes trigger documented effects
 * - Reactive Properties: Vue reactivity integrated at source
 * - 100% Backward Compatible: Maintains existing API surface
 *
 * History:
 * - Phase 4b: Removed Proxy pattern, integrated Phase 4a classes
 * - Phase 4a: Initial class extraction from monolithic State
 * - Phase 10.2: Proxy pattern (now removed for clarity)
 * - Phase 9.3: Composition over inheritance
 */
export class State implements Serializable {
  /**
   * Core state composition classes
   * Each handles a specific aspect of state management
   */
  private _data: StateData
  private _computed: StateComputed
  private _validation: StateValidation
  private _effects: StateEffects

  /**
   * Supporting classes
   * Helpers provide utilities, serializer handles persistence,
   * dataService handles external data operations
   */
  private _helpers: StateHelpers
  private _serializer: StateSerialization
  private _dataService: DataService

  constructor() {
    // Initialize StateData with all data properties
    this._data = new StateData()

    // Initialize helpers with data
    this._helpers = new StateHelpers(this._data)

    // Initialize computed properties handler
    this._computed = new StateComputed(this._data, this._helpers)

    // Initialize validation handler
    this._validation = new StateValidation(this._data, this._computed)

    // Initialize side effects handler
    this._effects = new StateEffects(this._data, this._helpers)

    // Data service
    this._dataService = new DataService()

    // Serializer will be initialized in initFromSavedState with allCountries
    // Use a placeholder that will be replaced
    this._serializer = {} as StateSerialization
  }

  // ============================================================================
  // CONFIGURATION PROPERTIES
  // Direct delegation to StateData with effect coordination
  // ============================================================================

  /**
   * Core chart settings
   * Changes to these properties trigger appropriate side effects
   */
  get countries(): string[] {
    return this._data.countries
  }

  set countries(value: string[]) {
    this._data.countries = value
    this._effects.onCountriesChange(value)
  }

  get chartType(): string {
    return this._data.chartType
  }

  set chartType(value: string) {
    this._data.chartType = value
    this._effects.onChartTypeChange()
  }

  get type(): string {
    return this._data.type
  }

  set type(value: string) {
    this._data.type = value
    this._effects.onTypeChange(value)
  }

  get isExcess(): boolean {
    return this._data.isExcess
  }

  set isExcess(value: boolean) {
    this._data.isExcess = value
    this._effects.onIsExcessChange(value)
  }

  get showBaseline(): boolean {
    return this._data.showBaseline
  }

  set showBaseline(value: boolean) {
    this._data.showBaseline = value
  }

  get userColors(): string[] | undefined {
    return this._data.userColors
  }

  set userColors(value: string[] | undefined) {
    this._data.userColors = value
  }

  // ============================================================================
  // COMPUTED PROPERTIES
  // Derived properties calculated from configuration state
  // Changes may trigger data updates via StateEffects
  // ============================================================================

  get chartStyle(): string {
    return this._computed.getChartStyle()
  }

  set chartStyle(value: string) {
    this._data.chartStyle = value
    this._effects.onChartStyleChange()
  }

  get ageGroups(): string[] {
    return this._computed.getAgeGroups()
  }

  set ageGroups(value: string[]) {
    this._data.ageGroups = value
    this._effects.onAgeGroupsChange()
  }

  get standardPopulation(): string {
    return this._computed.getStandardPopulation()
  }

  set standardPopulation(value: string) {
    this._data.standardPopulation = value
  }

  get baselineMethod(): string {
    return this._computed.getBaselineMethod()
  }

  set baselineMethod(value: string) {
    this._data.baselineMethod = value
    this._effects.onBaselineMethodChange()
  }

  get cumulative(): boolean {
    return this._computed.getCumulative()
  }

  set cumulative(value: boolean) {
    this._data.cumulative = value
    this._effects.onCumulativeChange(value)
  }

  get showTotal(): boolean {
    return this._computed.getShowTotal()
  }

  set showTotal(value: boolean) {
    this._data.showTotal = value
  }

  get maximize(): boolean {
    return this._computed.getMaximize()
  }

  set maximize(value: boolean) {
    this._data.maximize = value
    this._effects.onMaximizeChange(value)
  }

  get showPredictionInterval(): boolean {
    return this._computed.getShowPredictionInterval()
  }

  set showPredictionInterval(value: boolean) {
    this._data.showPredictionInterval = value
  }

  get showPercentage(): boolean {
    return this._computed.getShowPercentage()
  }

  set showPercentage(value: boolean) {
    this._data.showPercentage = value
  }

  get isLogarithmic(): boolean {
    return this._computed.getIsLogarithmic()
  }

  set isLogarithmic(value: boolean) {
    this._data.isLogarithmic = value
  }

  get dateFrom(): string {
    return this._computed.getDateFrom()
  }

  set dateFrom(value: string | undefined) {
    this._data.dateFrom = value
  }

  get dateTo(): string {
    return this._computed.getDateTo()
  }

  set dateTo(value: string | undefined) {
    this._data.dateTo = value
  }

  get sliderStart(): string {
    return this._computed.getSliderStart()
  }

  set sliderStart(value: string | undefined) {
    this._data.sliderStart = value
  }

  get baselineDateFrom(): string {
    return this._computed.getBaselineDateFrom()
  }

  set baselineDateFrom(value: string | undefined) {
    this._data.baselineDateFrom = value
  }

  get baselineDateTo(): string {
    return this._computed.getBaselineDateTo()
  }

  set baselineDateTo(value: string | undefined) {
    this._data.baselineDateTo = value
  }

  get showLabels(): boolean {
    return this._computed.getShowLabels()
  }

  set showLabels(value: boolean) {
    this._data.showLabels = value
    this._effects.onShowLabelsChange(value)
  }

  get sliderValue(): string[] {
    return this._computed.getSliderValue()
  }

  set sliderValue(value: string[]) {
    if (this.dateFrom !== value[0]) {
      this.dateFrom = value[0]
    }
    if (this.dateTo !== value[1]) {
      this.dateTo = value[1]
    }
  }

  get baselineSliderValue(): string[] {
    return this._computed.getBaselineSliderValue()
  }

  set baselineSliderValue(value: string[]) {
    if (this.baselineDateFrom !== value[0]) {
      this.baselineDateFrom = value[0]
    }
    if (this.baselineDateTo !== value[1]) {
      this.baselineDateTo = value[1]
    }
  }

  get colors(): string[] {
    return this._computed.getColors()
  }

  // Baseline method entry helper
  baselineMethodEntry = (): ListType =>
    baselineMethods.filter(v => v.value === this.baselineMethod)[0] ?? { name: '', value: '' }

  // ============================================================================
  // RUNTIME DATA PROPERTIES
  // Processed data and metadata for chart rendering
  // ============================================================================

  get chartOptions() {
    return this._data.chartOptions
  }

  get allCountries(): Record<string, Country> {
    return this._data.allCountries
  }

  set allCountries(value: Record<string, Country>) {
    this._data.allCountries = value
  }

  get dataset(): DatasetRaw {
    return this._data.dataset
  }

  set dataset(value: DatasetRaw) {
    this._data.dataset = value
  }

  get allChartLabels() {
    return this._data.allChartLabels
  }

  get allYearlyChartLabels() {
    return this._data.allYearlyChartLabels
  }

  get allYearlyChartLabelsUnique() {
    return this._data.allYearlyChartLabelsUnique
  }

  get allChartData(): AllChartData {
    return this._data.allChartData
  }

  set allChartData(value: AllChartData) {
    this._data.allChartData = value
  }

  get chartData(): MortalityChartData {
    return this._data.chartData
  }

  set chartData(value: MortalityChartData) {
    this._data.chartData = value
  }

  get isUpdating() {
    return this._data.isUpdating
  }

  async initFromSavedState(locationQuery: LocationQuery): Promise<void> {
    // Load country metadata if needed
    if (!this.allCountries) this.allCountries = await loadCountryMetadata()

    // Initialize serializer with state data and countries
    this._serializer = new StateSerialization(this._data, this.allCountries)

    // Use the serializer to load state
    await this._serializer.initFromSavedState(locationQuery)
  }

  private configureOptions = () => {
    this._effects.configureChartOptions()
  }

  sliderStartPeriod = () => this._computed.sliderStartPeriod()

  // ============================================================================
  // HELPER METHODS & TYPE CHECKS
  // Utilities for type checking and categorical queries
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

  // ============================================================================
  // INDEX CALCULATIONS & HELPERS
  // Date indexing, label retrieval, and type-specific utilities
  // ============================================================================

  dateFromIndex = () => this._computed.dateFromIndex()

  dateToIndex = () => this._computed.dateToIndex()

  baselineDateFromIndex = () => this._computed.baselineDateFromIndex()

  baselineDateToIndex = () => this._computed.baselineDateToIndex()

  indexToDate = (index: number) => this._computed.indexToDate(index)

  maxDateIndex = () => this._computed.maxDateIndex()

  getLabels = () => this._computed.getLabels()

  getBaseKeysForType = () => this._helpers.getBaseKeysForType()

  getMaxDateType = () => this._helpers.getMaxDateType()

  periodMultiplicatorForType = () => this._helpers.periodMultiplicatorForType()

  // Backwards compatibility check
  isIsoKey = (str: string) => this._helpers.isIsoKey(str)

  showCumPi = (): boolean => this._helpers.showCumPi()

  showSliderStartSelect = () => this._computed.showSliderStartSelect()

  // ============================================================================
  // VALIDATION & DATE RESET
  // State validation and date range normalization
  // ============================================================================

  resetBaselineDates = () => {
    this._validation.resetBaselineDates()
  }

  resetDates = () => {
    this._validation.resetDates()
  }

  // ============================================================================
  // DATA OPERATIONS
  // Async data fetching and processing
  // ============================================================================

  updateData = async (
    shouldDownloadDataset: boolean,
    shouldUpdateDataset: boolean
  ) => {
    this.isUpdating.value = true
    if (!this.allCountries) this.allCountries = await this._dataService.loadCountries()

    // Use DataService to update dataset and chart data
    this.dataset = await this._dataService.updateData(
      this._data,
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
      this._data,
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
      // Use StateEffects to determine if update is needed
      const shouldDownload = this._effects.shouldDownloadDataset(key.replace('_', ''))
      const shouldUpdate = this._effects.shouldUpdateDataset(key.replace('_', ''))

      await this.updateData(shouldDownload, shouldUpdate)
    }

    // These are now handled by StateEffects directly in setters
    // But we keep this for legacy key-based updates
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
