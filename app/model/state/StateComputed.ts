import { unref } from 'vue'
import { isMobile } from '@/utils'
import { ChartPeriod, type ChartType } from '@/model/period'
import { getSeasonString, defaultBaselineFromDate, defaultBaselineToDate } from '@/model/baseline'
import { getColorsForDataset } from '@/colors'
import { DATA_CONFIG } from '@/lib/config/constants'
import type { StateData } from './StateData'
import type { StateHelpers } from './StateHelpers'

/**
 * StateComputed - Computed properties and derived values
 *
 * Phase 4a: Extracted from State.ts
 * - All computed property logic
 * - Methods that derive values from StateData
 * - No direct state mutation (read-only operations)
 *
 * This class handles:
 * - Conditional defaults (e.g., chartStyle defaults based on isExcess)
 * - Computed properties (e.g., sliderValue, colors)
 * - Index calculations (e.g., dateFromIndex, dateToIndex)
 * - Label filtering and transformations
 */
export class StateComputed {
  constructor(
    private data: StateData,
    private helpers: StateHelpers
  ) {}

  // ============================================================================
  // COMPUTED PROPERTIES WITH CONDITIONAL LOGIC
  // ============================================================================

  /**
   * Chart Style: Defaults to 'bar' for excess, 'line' otherwise
   */
  getChartStyle(): string {
    return this.data.chartStyle || (this.data.isExcess ? 'bar' : 'line')
  }

  /**
   * Age Groups: Always ['all'] for ASMR types
   */
  getAgeGroups(): string[] {
    if (this.helpers.isAsmrType()) return ['all']
    return this.data.ageGroups
  }

  /**
   * Standard Population: Context-dependent default
   */
  getStandardPopulation(): string {
    return this.data.standardPopulation || (this.data.countries.length > 1 ? 'esp2013' : 'country')
  }

  /**
   * Baseline Method: Type-dependent default
   */
  getBaselineMethod(): string {
    if (this.data.baselineMethod) return this.data.baselineMethod
    // Default logic
    switch (this.data.type) {
      case 'cmr':
      case 'deaths':
        return 'lin_reg'
      default:
        return 'auto'
    }
  }

  /**
   * Cumulative: Disabled when not in excess mode
   */
  getCumulative(): boolean {
    if (!this.data.isExcess) return false
    return this.data.cumulative
  }

  /**
   * Show Total: Only available for bar charts in cumulative mode
   */
  getShowTotal(): boolean {
    if (!this.helpers.isBarChartStyle() || !this.getCumulative()) return false
    return this.data.showTotal
  }

  /**
   * Maximize: Disabled when logarithmic
   */
  getMaximize(): boolean {
    if (this.data.isLogarithmic) return false
    return this.data.maximize
  }

  /**
   * Show Prediction Interval: Complex conditional logic
   */
  getShowPredictionInterval(): boolean {
    if (
      (!this.data.isExcess && !this.data.showBaseline)
      || this.helpers.isMatrixChartStyle()
      || (this.getCumulative() && !this.helpers.showCumPi())
    )
      return false

    if (this.data.showPredictionInterval !== undefined) {
      return this.data.showPredictionInterval
    }
    return this.data.isExcess ? false : true
  }

  /**
   * Show Percentage: Only available in excess mode
   */
  getShowPercentage(): boolean {
    if (!this.data.isExcess) return false
    return this.data.showPercentage ?? (this.data.isExcess && !this.getCumulative())
  }

  /**
   * Is Logarithmic: Disabled for matrix charts or excess mode
   */
  getIsLogarithmic(): boolean {
    if (this.helpers.isMatrixChartStyle() || this.data.isExcess) return false
    return this.data.isLogarithmic
  }

  /**
   * Date From: With default fallback
   */
  getDateFrom(): string {
    return this.data.dateFrom ?? this.getDefaultFromDate() ?? ''
  }

  /**
   * Date To: With default fallback
   */
  getDateTo(): string {
    return this.data.dateTo ?? this.getDefaultToDate() ?? ''
  }

  /**
   * Slider Start: With default fallback
   */
  getSliderStart(): string {
    return this.data.sliderStart ?? this.getDefaultSliderStart() ?? ''
  }

  /**
   * Baseline Date From: Complex default with label dependency
   */
  getBaselineDateFrom(): string {
    if (this.data.baselineDateFrom) return this.data.baselineDateFrom
    const labels = unref(this.data.allChartLabels)!
    return defaultBaselineFromDate(this.data.chartType as ChartType, labels, this.getBaselineMethod()) ?? ''
  }

  /**
   * Baseline Date To: With default fallback
   */
  getBaselineDateTo(): string {
    return this.data.baselineDateTo ?? defaultBaselineToDate(this.data.chartType as ChartType)
  }

  /**
   * Show Labels: Complex conditional with chart data dependency
   */
  getShowLabels(): boolean {
    const val = this.data.showLabels
    if (val !== undefined) return val
    return (
      this.data.allChartData !== undefined
      && this.dateToIndex() - this.dateFromIndex() + 1 <= (isMobile() ? 20 : 60)
    )
  }

  // ============================================================================
  // COMPUTED ARRAY PROPERTIES
  // ============================================================================

  /**
   * Slider Value: Computed from dateFrom and dateTo
   */
  getSliderValue(): string[] {
    return [this.getDateFrom(), this.getDateTo()]
  }

  /**
   * Baseline Slider Value: Computed from baseline dates
   */
  getBaselineSliderValue(): string[] {
    return [this.getBaselineDateFrom(), this.getBaselineDateTo()]
  }

  /**
   * Colors: Custom colors with normalization logic
   */
  getColors(): string[] {
    const defaultColors = getColorsForDataset(this.data.dataset)
    if (!this.data.userColors) return defaultColors

    const userColors = this.data.userColors
    if (userColors.length > defaultColors.length) {
      return userColors.slice(0, defaultColors.length)
    }
    if (userColors.length < defaultColors.length) {
      return [
        ...userColors,
        ...defaultColors.slice(userColors.length)
      ]
    }
    return userColors
  }

  // ============================================================================
  // INDEX CALCULATIONS
  // ============================================================================

  /**
   * Get ChartPeriod instance for current labels
   */
  private getChartPeriod(): ChartPeriod {
    return new ChartPeriod(this.getLabels(), this.data.chartType as ChartType)
  }

  /**
   * Date From Index
   */
  dateFromIndex(): number {
    return this.getChartPeriod().indexOf(this.getDateFrom())
  }

  /**
   * Date To Index
   */
  dateToIndex(): number {
    return this.getChartPeriod().indexOf(this.getDateTo())
  }

  /**
   * Baseline Date From Index
   */
  baselineDateFromIndex(): number {
    return this.getChartPeriod().indexOf(this.getBaselineDateFrom())
  }

  /**
   * Baseline Date To Index
   */
  baselineDateToIndex(): number {
    return this.getChartPeriod().indexOf(this.getBaselineDateTo())
  }

  /**
   * Index to Date conversion
   */
  indexToDate(index: number): string {
    return this.getLabels()[index] ?? ''
  }

  /**
   * Max Date Index
   */
  maxDateIndex(): number {
    return this.getLabels().length - 1
  }

  // ============================================================================
  // LABEL GETTERS AND TRANSFORMATIONS
  // ============================================================================

  /**
   * Get filtered labels based on slider start
   */
  getLabels(): string[] {
    if (!this.showSliderStartSelect()) return this.data.allChartData.labels

    // Use ChartPeriod for smart index lookup
    const period = new ChartPeriod(this.data.allChartData.labels, this.data.chartType as ChartType)
    const startIdx = period.indexOf(this.sliderStartPeriod())
    return this.data.allChartData.labels.slice(startIdx)
  }

  /**
   * Slider Start Period as season string
   */
  sliderStartPeriod(): string {
    const sliderStart = this.getSliderStart()
    return getSeasonString(this.data.chartType as ChartType, Number(sliderStart || 0))
  }

  /**
   * Should show slider start select
   */
  showSliderStartSelect(): boolean {
    return (this.data.allChartLabels.value?.length ?? 0) > this.getDefaultPeriods() + 10
  }

  // ============================================================================
  // DEFAULT VALUE CALCULATIONS
  // ============================================================================

  /**
   * Default From Date based on chart type
   */
  private getDefaultFromDate(): string | undefined {
    const labels = this.data.allChartLabels.value
    if (!labels) return undefined

    const years = 10
    switch (this.data.chartType) {
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

  /**
   * Default To Date (last available label)
   */
  private getDefaultToDate(): string | undefined {
    const labels = this.data.allChartLabels.value
    if (!labels) return undefined
    return labels[labels.length - 1]
  }

  /**
   * Default number of periods
   */
  private getDefaultPeriods(): number {
    return DATA_CONFIG.DEFAULT_PERIODS
  }

  /**
   * Default slider periods (adjusted for chart type)
   */
  private getDefaultSliderPeriods(): number {
    return Math.round(this.getDefaultPeriods() * this.helpers.periodMultiplicatorForType())
  }

  /**
   * Default Slider Start
   */
  private getDefaultSliderStart(): string | undefined {
    const labels = this.data.allYearlyChartLabels.value ?? []
    if (!this.showSliderStartSelect()) return labels[0]
    return labels[labels.length - this.getDefaultSliderPeriods()] ?? labels[0]
  }
}
