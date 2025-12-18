import { computed, type Ref } from 'vue'
import { getKeyForType, type NumberEntryFields } from '@/model'

/**
 * Composable for explorer page helper functions.
 *
 * Provides a collection of utility functions for determining chart behavior,
 * validation rules, and feature availability based on current explorer state.
 * All functions are reactive and will recompute when their dependencies change.
 *
 * @param type - The data type being visualized (e.g., 'deaths', 'asmr', 'le', 'population')
 * @param chartStyle - The chart style ('bar', 'line', or 'matrix')
 * @param isExcess - Whether excess mortality mode is enabled
 * @param standardPopulation - The standard population used for ASMR calculations
 * @param countries - Array of selected country codes
 * @param cumulative - Whether cumulative view is enabled
 * @param baselineMethod - The baseline calculation method (e.g., 'lin_reg', 'mean')
 * @param showBaseline - Whether the baseline is currently displayed
 * @param chartType - The time period type (e.g., 'year', 'fluseason', 'midyear')
 * @returns Object containing helper functions for chart configuration and validation
 *
 * @example
 * ```typescript
 * const helpers = useExplorerHelpers(
 *   type,
 *   chartStyle,
 *   isExcess,
 *   standardPopulation,
 *   countries,
 *   cumulative,
 *   baselineMethod,
 *   showBaseline,
 *   chartType
 * )
 *
 * // Check if current type is age-standardized mortality rate
 * if (helpers.isAsmrType()) {
 *   // Apply ASMR-specific logic
 * }
 *
 * // Get maximum allowed countries for current configuration
 * const maxCountries = helpers.getMaxCountriesAllowed()
 * ```
 */
export function useExplorerHelpers(
  type: Ref<string>,
  chartStyle: Ref<string>,
  isExcess: Ref<boolean>,
  standardPopulation: Ref<string>,
  countries: Ref<string[]>,
  cumulative: Ref<boolean>,
  baselineMethod: Ref<string>,
  showBaseline: Ref<boolean>,
  chartType: Ref<string>,
  isZScore: Ref<boolean> = ref(false),
  leAdjusted: Ref<boolean> = ref(true)
) {
  /**
   * Checks if the current data type is age-standardized mortality rate (ASMR).
   *
   * @returns True if the type includes 'asmr'
   */
  const isAsmrType = () => type.value.includes('asmr')

  /**
   * Checks if the current data type is population counts.
   *
   * @returns True if the type is 'population'
   */
  const isPopulationType = () => type.value === 'population'

  /**
   * Checks if the current data type is life expectancy.
   *
   * @returns True if the type is 'le'
   */
  const isLifeExpectancyType = () => type.value === 'le'

  /**
   * Checks if the current data type represents death counts.
   *
   * @returns True if the type includes 'deaths'
   */
  const isDeathsType = () => type.value.includes('deaths')

  /**
   * Checks if error bars should be displayed.
   *
   * Error bars are shown on bar charts when in excess mortality mode.
   *
   * @returns True if chart style is 'bar' and excess mode is enabled
   */
  const isErrorBarType = () => isBarChartStyle() && isExcess.value

  /**
   * Checks if a baseline can be displayed for the current configuration.
   *
   * Baselines are not applicable for population data or excess mortality views.
   *
   * @returns True if baseline is available for current type and mode
   */
  const hasBaseline = () => !isPopulationType() && !isExcess.value

  /**
   * Checks if the current chart style is line.
   *
   * @returns True if chart style is 'line'
   */
  const isLineChartStyle = () => chartStyle.value === 'line'

  /**
   * Checks if the current chart style is bar.
   *
   * @returns True if chart style is 'bar'
   */
  const isBarChartStyle = () => chartStyle.value === 'bar'

  /**
   * Checks if the current chart style is matrix/heatmap.
   *
   * @returns True if chart style is 'matrix'
   */
  const isMatrixChartStyle = () => chartStyle.value === 'matrix'

  /**
   * Gets the maximum number of countries allowed for the current configuration.
   *
   * When using ASMR with country-specific standard populations, only one country
   * can be selected at a time since each country uses its own population standard.
   *
   * @returns 1 if ASMR with country standard population, undefined otherwise (no limit)
   */
  const getMaxCountriesAllowed = () =>
    countries.value.length > 1
    && isAsmrType()
    && standardPopulation.value === 'country'
      ? 1
      : undefined

  /**
   * Checks if the current chart type represents yearly/annual aggregation.
   *
   * Yearly types include calendar year, flu season, and mid-year aggregations.
   * Used to determine feature availability like cumulative prediction intervals.
   *
   * @returns True if chart type is year-based ('year', 'fluseason', or 'midyear')
   */
  const isYearlyChartType = () =>
    chartType.value.includes('year')
    || chartType.value.includes('fluseason')
    || chartType.value.includes('midyear')

  /**
   * Determines if cumulative prediction intervals can be shown.
   *
   * Cumulative PIs are only available when:
   * - Cumulative mode is enabled
   * - Chart type is yearly (not weekly/monthly)
   * - Baseline method supports prediction intervals (linear regression or mean)
   *
   * @returns True if all conditions for cumulative prediction intervals are met
   */
  const showCumPi = (): boolean =>
    cumulative.value
    && isYearlyChartType()
    && ['lin_reg', 'mean'].includes(baselineMethod.value)

  /**
   * Gets the database field keys needed for the current data type configuration.
   *
   * Delegates to the model layer to determine which fields should be queried
   * based on the type, baseline visibility, and standard population settings.
   *
   * @returns Array of field keys to retrieve from the database
   */
  const getBaseKeysForType = (): (keyof NumberEntryFields)[] =>
    getKeyForType(type.value, showBaseline.value, standardPopulation.value, false, false, {
      leAdjusted: leAdjusted.value,
      chartType: chartType.value
    })

  /**
   * Gets the database field keys for data fetching, always including baseline keys.
   *
   * Unlike getBaseKeysForType which respects showBaseline state, this function
   * always returns baseline keys when the type supports baselines. This ensures
   * baseline data is always calculated and stored, making baseline toggle a
   * pure display operation without requiring data re-fetch.
   *
   * Important: In excess mode, we still need baseline keys for the baseline
   * calculation, even though the baseline line itself isn't displayed. The
   * baseline is used to calculate excess values and percentage transformations.
   *
   * @returns Array of field keys including baseline fields for data fetching
   */
  const getBaseKeysForFetch = (): (keyof NumberEntryFields)[] =>
    getKeyForType(type.value, !isPopulationType(), standardPopulation.value, false, false, {
      leAdjusted: leAdjusted.value,
      chartType: chartType.value
    })

  /**
   * Computed property indicating if the prediction interval toggle should be disabled.
   *
   * Prediction intervals are disabled when:
   * - Not in excess mode AND baseline is not shown (no baseline = no PI)
   * - In cumulative mode but cumulative PIs are not supported for current config
   * - In z-score view (baseline is implicit in z-score calculation)
   *
   * @returns Computed boolean indicating if PI toggle should be disabled
   */
  const showPredictionIntervalDisabled = computed(() =>
    (!isExcess.value && !showBaseline.value) || (cumulative.value && !showCumPi()) || isZScore.value
  )

  return {
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
    isYearlyChartType,
    showCumPi,
    getBaseKeysForType,
    getBaseKeysForFetch,
    showPredictionIntervalDisabled
  }
}
