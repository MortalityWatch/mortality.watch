import type { StateData } from './StateData'
import type { StateHelpers } from './StateHelpers'

/**
 * StateEffects - Side effect handlers
 *
 * Provides clear, explicit side effect triggers with no hidden behavior.
 *
 * This class handles:
 * - Property change reactions (e.g., reset age groups when type changes)
 * - Chart option configuration updates
 * - Cascading state updates
 * - Data refresh triggers
 *
 * Philosophy:
 * - Side effects should be explicit and traceable
 * - Each handler should have a single, clear responsibility
 * - Avoid deeply nested side effects
 */
export class StateEffects {
  constructor(
    private data: StateData,
    private helpers: StateHelpers
  ) {}

  // ============================================================================
  // PROPERTY CHANGE HANDLERS
  // ============================================================================

  /**
   * Handle type change side effects
   * - Reset age groups for ASMR/LE types
   * - Disable excess for population type
   */
  onTypeChange(newType: string): void {
    // ASMR and Life Expectancy only support 'all' age group
    if (newType.startsWith('asmr') || newType.startsWith('le')) {
      this.data.ageGroups = ['all']
    }

    // Population type cannot be in excess mode
    if (newType === 'population') {
      this.data.isExcess = false
      this.data.baselineMethod = 'auto' // Reset to default
    }
  }

  /**
   * Handle chart type change side effects
   * - Update available periods
   * - Reset date ranges if needed
   */
  onChartTypeChange(): void {
    // Chart type changes may require date range revalidation
    // This is typically handled by StateValidation.resetDates()
    // but we can trigger other effects here if needed
  }

  /**
   * Handle country selection change
   * - Validate age groups are still available
   * - Update color array if needed
   */
  onCountriesChange(newCountries: string[]): void {
    // If no countries selected, reset age groups to default
    if (newCountries.length === 0) {
      this.data.ageGroups = ['all']
    }

    // Reset user colors if count changes (handled by StateComputed.getColors())
  }

  /**
   * Handle age groups change
   * - Validate selection is valid for current countries
   */
  onAgeGroupsChange(): void {
    // Validation is handled by StateValidation
    // This handler is for any additional side effects
  }

  /**
   * Handle excess mode toggle
   * NOTE: State changes now handled by StateResolver in explorer.vue
   * This handler kept for backward compatibility but logic moved to constraints
   */
  onIsExcessChange(_newIsExcess: boolean): void {
    // State resolution now handled by StateResolver
    // Constraints are defined in app/lib/state/constraints.ts
  }

  /**
   * Handle cumulative toggle
   * - May affect prediction interval visibility
   * - Affects show total option
   */
  onCumulativeChange(newCumulative: boolean): void {
    if (!newCumulative) {
      // When disabling cumulative mode, hide total
      this.data.showTotal = false
    }
  }

  /**
   * Handle baseline method change
   * - May trigger data recalculation
   */
  onBaselineMethodChange(): void {
    // Baseline method changes require data update
    // Trigger is handled by handleUpdate in State.ts
  }

  /**
   * Handle chart style change
   * - Update available options
   */
  onChartStyleChange(): void {
    // Chart style changes may affect available options
    // Configuration is handled by configureChartOptions()
  }

  // ============================================================================
  // CHART OPTIONS CONFIGURATION
  // ============================================================================

  /**
   * Configure chart options based on current state
   * This replaces the configureOptions method in State.ts
   */
  configureChartOptions(): void {
    const options = this.data.chartOptions

    // Show Total Option: Only for excess mode + bar charts
    options.showTotalOption = this.data.isExcess && this.helpers.isBarChartStyle()
    options.showTotalOptionDisabled = !this.data.cumulative

    // Maximize Option: Not available for certain chart combinations
    options.showMaximizeOption
      = !(this.data.isExcess && this.helpers.isLineChartStyle())
        && !this.helpers.isMatrixChartStyle()
    options.showMaximizeOptionDisabled
      = this.data.isLogarithmic
        || (this.data.isExcess && !options.showTotalOption)

    // Baseline Option: Not for population or excess mode
    options.showBaselineOption
      = this.helpers.hasBaseline() && !this.helpers.isMatrixChartStyle()

    // Prediction Interval Option
    options.showPredictionIntervalOption
      = options.showBaselineOption
        || (this.data.isExcess && !this.helpers.isMatrixChartStyle())
    options.showPredictionIntervalOptionDisabled
      = (!this.data.isExcess && !this.data.showBaseline)
        || (this.data.cumulative && !this.helpers.showCumPi())

    // Cumulative and Percentage: Only for excess mode
    options.showCumulativeOption = this.data.isExcess
    options.showPercentageOption = this.data.isExcess

    // Logarithmic: Not for matrix or excess mode
    options.showLogarithmicOption
      = !this.helpers.isMatrixChartStyle() && !this.data.isExcess
  }

  // ============================================================================
  // UPDATE TRIGGERS
  // ============================================================================

  /**
   * Determine if a property change should trigger data download
   * @param property - The property that changed
   */
  shouldDownloadDataset(property: string): boolean {
    const downloadTriggers = ['countries', 'type', 'chartType', 'ageGroups']
    return downloadTriggers.includes(property)
  }

  /**
   * Determine if a property change should trigger dataset update
   * @param property - The property that changed
   */
  shouldUpdateDataset(property: string): boolean {
    const updateTriggers = [
      'baselineMethod',
      'standardPopulation',
      'baselineDateFrom',
      'baselineDateTo',
      'sliderStart'
    ]

    // Also update if cumulative changes and baseline method is not 'auto'
    if (property === 'cumulative' && this.data.baselineMethod !== 'auto') {
      return true
    }

    return updateTriggers.includes(property)
  }

  /**
   * Handle maximize change
   */
  onMaximizeChange(newMaximize: boolean): void {
    // Update chart data if it exists
    if (this.data.chartData) {
      this.data.chartData.isMaximized = newMaximize
    }
  }

  /**
   * Handle show labels change
   */
  onShowLabelsChange(newShowLabels: boolean): void {
    // Update chart data if it exists
    if (this.data.chartData) {
      this.data.chartData.showLabels = newShowLabels
    }
  }

  // ============================================================================
  // BATCH EFFECTS
  // ============================================================================

  /**
   * Handle multiple related changes at once
   * Useful when initializing state from URL params
   */
  applyBatchChanges(changes: Partial<StateData>): void {
    // Apply changes without triggering individual side effects
    Object.assign(this.data, changes)

    // Then run comprehensive side effects once
    this.onBatchChangeComplete()
  }

  /**
   * Execute all necessary side effects after batch changes
   */
  private onBatchChangeComplete(): void {
    // Reconfigure chart options
    this.configureChartOptions()

    // Any other global side effects can be added here
  }

  // ============================================================================
  // EFFECT REGISTRATION
  // ============================================================================

  /**
   * Get a map of property names to their effect handlers
   * This can be used by State.ts to register effects with the Proxy
   *
   * Handlers are typed to match their specific parameter types.
   */
  getEffectHandlers(): Map<string, (value: unknown) => void> {
    // Create a temporary typed map for internal use
    type EffectHandler = (value: unknown) => void
    const handlers = new Map<string, EffectHandler>()

    // Type changes (string parameter)
    handlers.set('type', ((val: string) => this.onTypeChange(val)) as EffectHandler)

    // Country changes (string[] parameter)
    handlers.set('countries', ((val: string[]) => this.onCountriesChange(val)) as EffectHandler)

    // Excess mode changes (boolean parameter)
    handlers.set('isExcess', ((val: boolean) => this.onIsExcessChange(val)) as EffectHandler)

    // Cumulative changes (boolean parameter)
    handlers.set('cumulative', ((val: boolean) => this.onCumulativeChange(val)) as EffectHandler)

    // Chart type changes (no parameter)
    handlers.set('chartType', (() => this.onChartTypeChange()) as EffectHandler)

    // Age group changes (no parameter)
    handlers.set('ageGroups', (() => this.onAgeGroupsChange()) as EffectHandler)

    // Baseline method changes (no parameter)
    handlers.set('baselineMethod', (() => this.onBaselineMethodChange()) as EffectHandler)

    // Chart style changes (no parameter)
    handlers.set('chartStyle', (() => this.onChartStyleChange()) as EffectHandler)

    // Maximize changes (boolean parameter)
    handlers.set('maximize', ((val: boolean) => this.onMaximizeChange(val)) as EffectHandler)

    // Show labels changes (boolean parameter)
    handlers.set('showLabels', ((val: boolean) => this.onShowLabelsChange(val)) as EffectHandler)

    return handlers
  }
}
