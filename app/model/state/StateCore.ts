import { isRef, ref, type Ref, unref } from 'vue'
import { Defaults } from '@/lib/state/stateSerializer'
import type { ListType } from '@/model'
import { baselineMethods } from '@/model'

/**
 * Core state properties and their getters/setters
 */
export class StateCore {
  // Core Settings - Private refs
  _countries = ref<string[]>()
  _chartType = ref<string>()
  _isExcess = ref<boolean>()
  _type = ref<string>()
  _chartStyle = ref<string>()
  _dateFrom = ref<string>()
  _dateTo = ref<string>()
  _baselineDateFrom = ref<string>()
  _baselineDateTo = ref<string>()

  // Optional Settings - Private refs
  _ageGroups = ref<string[]>()
  _standardPopulation = ref<string>()
  _showBaseline = ref<boolean>()
  _baselineMethod = ref<string>()
  _cumulative = ref<boolean>()
  _showTotal = ref<boolean>()
  _maximize = ref<boolean>()
  _showPredictionInterval = ref<boolean>()
  _showLabels = ref<boolean>()
  _showPercentage = ref<boolean>()
  _isLogarithmic = ref<boolean>()
  _sliderStart = ref<string>()
  _userColors = ref<string[]>()

  /**
   * Generic setter that works with both refs and regular properties
   */
  async setValue(prop: string, val: unknown) {
    // @ts-expect-error - Dynamic property access
    if (isRef(this[prop])) {
      // @ts-expect-error - Dynamic property access
      (this[prop] as Ref).value = val
    } else {
      // @ts-expect-error - Dynamic property access
      this[prop] = val
    }
  }

  // Countries
  set countries(val: string[]) {
    this.setValue('_countries', val)
  }

  get countries(): string[] {
    return unref(this._countries) ?? Defaults.countries
  }

  // Chart Style
  set chartStyle(val: string) {
    this.setValue('_chartStyle', val)
  }

  get chartStyle(): string {
    return unref(this._chartStyle) ?? (this.isExcess ? 'bar' : 'line')
  }

  // Chart Type
  set chartType(val: string) {
    this.setValue('_chartType', val)
  }

  get chartType(): string {
    return unref(this._chartType) ?? Defaults.chartType
  }

  // Type
  set type(val: string) {
    if (val.startsWith('asmr') || val.startsWith('le'))
      this.setValue('_ageGroups', undefined)
    if (val === 'population') {
      this.setValue('_isExcess', undefined)
      this.setValue('_baselineMethod', undefined)
    }
    this.setValue('_type', val)
  }

  get type(): string {
    return unref(this._type) ?? Defaults.type
  }

  // Is Excess
  set isExcess(val: boolean) {
    this.setValue('_isExcess', val)
  }

  get isExcess(): boolean {
    return unref(this._isExcess) ?? Defaults.isExcess
  }

  // Date From
  set dateFrom(val: string | undefined) {
    this.setValue('_dateFrom', val)
  }

  get dateFrom(): string {
    return unref(this._dateFrom) ?? ''
  }

  // Date To
  set dateTo(val: string | undefined) {
    this.setValue('_dateTo', val)
  }

  get dateTo(): string {
    return unref(this._dateTo) ?? ''
  }

  // Slider Start
  set sliderStart(val: string | undefined) {
    this.setValue('_sliderStart', val)
  }

  get sliderStart(): string {
    return unref(this._sliderStart) ?? ''
  }

  // Age Groups
  set ageGroups(val: string[]) {
    this.setValue('_ageGroups', val)
  }

  get ageGroups(): string[] {
    if (this.isAsmrType()) return ['all']
    return unref(this._ageGroups) ?? Defaults.ageGroups
  }

  // Standard Population
  set standardPopulation(val: string) {
    this.setValue('_standardPopulation', val)
  }

  get standardPopulation(): string {
    return (
      unref(this._standardPopulation)
      ?? (this.countries.length > 1 ? Defaults.standardPopulation : 'country')
    )
  }

  // Show Baseline
  set showBaseline(on: boolean) {
    this.setValue('_showBaseline', on)
  }

  get showBaseline(): boolean {
    return unref(this._showBaseline) ?? Defaults.showBaseline
  }

  // Cumulative
  set cumulative(on: boolean) {
    this.setValue('_cumulative', on)
  }

  get cumulative(): boolean {
    if (!this.isExcess) return false
    return unref(this._cumulative) ?? Defaults.cumulative
  }

  // Show Total
  set showTotal(on: boolean) {
    this.setValue('_showTotal', on)
  }

  get showTotal(): boolean {
    if (!this.isBarChartStyle() || !this.cumulative) return false
    return unref(this._showTotal) ?? Defaults.showTotal
  }

  // Maximize
  set maximize(on: boolean) {
    this.setValue('_maximize', on)
  }

  get maximize(): boolean {
    if (this.isLogarithmic) return false
    return unref(this._maximize) ?? Defaults.maximize
  }

  // Show Prediction Interval
  set showPredictionInterval(on: boolean) {
    this.setValue('_showPredictionInterval', on)
  }

  get showPredictionInterval(): boolean {
    if (
      (!this.isExcess && !this.showBaseline)
      || this.isMatrixChartStyle()
      || (this.cumulative && !this.showCumPi())
    )
      return false

    const val = unref(this._showPredictionInterval)
    if (val !== undefined) return val
    return this.isExcess
      ? !Defaults.showPredictionInterval
      : Defaults.showPredictionInterval
  }

  // Show Labels
  set showLabels(on: boolean) {
    this.setValue('_showLabels', on)
  }

  get showLabels(): boolean {
    return unref(this._showLabels) ?? Defaults.showLabels
  }

  // Show Percentage
  get showPercentage(): boolean {
    if (!this.isExcess) return false
    return unref(this._showPercentage) ?? (this.isExcess && !this.cumulative)
  }

  set showPercentage(on: boolean) {
    this.setValue('_showPercentage', on)
  }

  // Is Logarithmic
  get isLogarithmic(): boolean {
    if (this.isMatrixChartStyle() || this.isExcess) return false
    return unref(this._isLogarithmic) ?? Defaults.isLogarithmic
  }

  set isLogarithmic(on: boolean) {
    this.setValue('_isLogarithmic', on)
  }

  // Baseline Date From
  set baselineDateFrom(val: string | undefined) {
    this.setValue('_baselineDateFrom', val)
  }

  get baselineDateFrom(): string {
    if (this._baselineDateFrom) {
      const df = unref(this._baselineDateFrom)
      if (df) return df
    }
    return ''
  }

  // Baseline Date To
  set baselineDateTo(val: string | undefined) {
    this.setValue('_baselineDateTo', val)
  }

  get baselineDateTo(): string {
    return unref(this._baselineDateTo) ?? ''
  }

  // Baseline Method
  set baselineMethod(val: string) {
    this.setValue('_baselineMethod', val)
  }

  get baselineMethod(): string {
    let method = unref(this._baselineMethod)
    if (method) return method
    switch (this.type) {
      case 'cmr':
      case 'deaths':
        method = 'lin_reg'
        break
      default:
        method = Defaults.baselineMethod
    }
    return method
  }

  // User Colors
  set userColors(val: string[] | undefined) {
    this.setValue('_userColors', val)
  }

  get userColors(): string[] | undefined {
    return unref(this._userColors) ?? Defaults.userColors
  }

  // Helper to get baseline method entry
  baselineMethodEntry = (): ListType =>
    baselineMethods.filter(v => v.value === this.baselineMethod)[0] ?? { name: '', value: '' }

  // Type predicates (must be implemented by subclass)
  protected isAsmrType(): boolean {
    return this.type.includes('asmr')
  }

  protected isBarChartStyle(): boolean {
    return this.chartStyle === 'bar'
  }

  protected isMatrixChartStyle(): boolean {
    return this.chartStyle === 'matrix'
  }

  protected showCumPi(): boolean {
    return false // Implemented in subclass
  }
}
