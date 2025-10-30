import { ref, reactive } from 'vue'
import type { Country, DatasetRaw, AllChartData } from '@/model'
import type { MortalityChartData } from '@/lib/chart/chartTypes'

/**
 * StateData - Core data properties without Proxy complexity
 *
 * Phase 4a: Extracted from State.ts
 * - Simple getters/setters
 * - No reactive Proxy wrapper
 * - All data properties from State.ts
 *
 * This class holds the raw data that the application works with:
 * - Chart configuration (countries, date ranges, display options)
 * - Chart data (labels, datasets, rendered chart data)
 * - Metadata (country information, dataset references)
 */
export class StateData {
  // ============================================================================
  // CONFIGURATION PROPERTIES
  // ============================================================================

  // Core Settings
  private _countries: string[] = []
  private _chartType: string = 'weekly'
  private _type: string = 'deaths'
  private _chartStyle: string = 'line'
  private _isExcess: boolean = false

  // Date Range
  private _dateFrom: string | undefined
  private _dateTo: string | undefined
  private _sliderStart: string | undefined

  // Baseline
  private _showBaseline: boolean = false
  private _baselineMethod: string = 'auto'
  private _baselineDateFrom: string | undefined
  private _baselineDateTo: string | undefined

  // Display Options
  private _ageGroups: string[] = ['all']
  private _standardPopulation: string = 'esp2013'
  private _cumulative: boolean = false
  private _showTotal: boolean = false
  private _maximize: boolean = false
  private _showPredictionInterval: boolean = true
  private _showLabels: boolean = true
  private _showPercentage: boolean = false
  private _isLogarithmic: boolean = false

  // Colors
  private _userColors: string[] | undefined

  // ============================================================================
  // DATA PROPERTIES
  // ============================================================================

  // Chart Options (reactive for UI updates)
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

  // Country and Dataset Data
  allCountries!: Record<string, Country>
  dataset!: DatasetRaw

  // Chart Labels (refs for reactivity)
  allChartLabels = ref<string[]>()
  allYearlyChartLabels = ref<string[]>()
  allYearlyChartLabelsUnique = ref<string[]>()

  // Chart Data
  allChartData!: AllChartData
  chartData!: MortalityChartData

  // Status
  isUpdating = ref(false)

  // ============================================================================
  // SIMPLE GETTERS & SETTERS
  // ============================================================================

  // Core Settings
  get countries(): string[] {
    return this._countries
  }

  set countries(value: string[]) {
    this._countries = value
  }

  get chartType(): string {
    return this._chartType
  }

  set chartType(value: string) {
    this._chartType = value
  }

  get type(): string {
    return this._type
  }

  set type(value: string) {
    this._type = value
  }

  get chartStyle(): string {
    return this._chartStyle
  }

  set chartStyle(value: string) {
    this._chartStyle = value
  }

  get isExcess(): boolean {
    return this._isExcess
  }

  set isExcess(value: boolean) {
    this._isExcess = value
  }

  // Date Range
  get dateFrom(): string | undefined {
    return this._dateFrom
  }

  set dateFrom(value: string | undefined) {
    this._dateFrom = value
  }

  get dateTo(): string | undefined {
    return this._dateTo
  }

  set dateTo(value: string | undefined) {
    this._dateTo = value
  }

  get sliderStart(): string | undefined {
    return this._sliderStart
  }

  set sliderStart(value: string | undefined) {
    this._sliderStart = value
  }

  // Baseline
  get showBaseline(): boolean {
    return this._showBaseline
  }

  set showBaseline(value: boolean) {
    this._showBaseline = value
  }

  get baselineMethod(): string {
    return this._baselineMethod
  }

  set baselineMethod(value: string) {
    this._baselineMethod = value
  }

  get baselineDateFrom(): string | undefined {
    return this._baselineDateFrom
  }

  set baselineDateFrom(value: string | undefined) {
    this._baselineDateFrom = value
  }

  get baselineDateTo(): string | undefined {
    return this._baselineDateTo
  }

  set baselineDateTo(value: string | undefined) {
    this._baselineDateTo = value
  }

  // Display Options
  get ageGroups(): string[] {
    return this._ageGroups
  }

  set ageGroups(value: string[]) {
    this._ageGroups = value
  }

  get standardPopulation(): string {
    return this._standardPopulation
  }

  set standardPopulation(value: string) {
    this._standardPopulation = value
  }

  get cumulative(): boolean {
    return this._cumulative
  }

  set cumulative(value: boolean) {
    this._cumulative = value
  }

  get showTotal(): boolean {
    return this._showTotal
  }

  set showTotal(value: boolean) {
    this._showTotal = value
  }

  get maximize(): boolean {
    return this._maximize
  }

  set maximize(value: boolean) {
    this._maximize = value
  }

  get showPredictionInterval(): boolean {
    return this._showPredictionInterval
  }

  set showPredictionInterval(value: boolean) {
    this._showPredictionInterval = value
  }

  get showLabels(): boolean {
    return this._showLabels
  }

  set showLabels(value: boolean) {
    this._showLabels = value
  }

  get showPercentage(): boolean {
    return this._showPercentage
  }

  set showPercentage(value: boolean) {
    this._showPercentage = value
  }

  get isLogarithmic(): boolean {
    return this._isLogarithmic
  }

  set isLogarithmic(value: boolean) {
    this._isLogarithmic = value
  }

  // Colors
  get userColors(): string[] | undefined {
    return this._userColors
  }

  set userColors(value: string[] | undefined) {
    this._userColors = value
  }
}
