import { getStartIndex } from '@/lib/data'
import type { StateData } from './StateData'
import type { StateComputed } from './StateComputed'

/**
 * StateValidation - Validation logic and data integrity checks
 *
 * Pure functions with no side effects for data consistency.
 *
 * This class handles:
 * - Date range validation
 * - Country selection validation
 * - Data integrity checks
 * - Reset logic for invalid states
 */
export class StateValidation {
  constructor(
    private data: StateData,
    private computed: StateComputed
  ) {}

  // ============================================================================
  // DATE VALIDATION
  // ============================================================================

  /**
   * Validate and reset baseline dates if invalid
   * Called when chart type, slider start, or other factors change
   */
  resetBaselineDates(): void {
    const labels = this.data.allChartLabels.value?.slice(
      getStartIndex(this.data.allYearlyChartLabels.value!, this.computed.getSliderStart())
    )

    if (!labels) return

    const baselineDateFrom = this.computed.getBaselineDateFrom()
    const baselineDateTo = this.computed.getBaselineDateTo()

    // Reset baselineDateFrom if it's not in the available labels
    if (!labels.includes(baselineDateFrom)) {
      this.data.baselineDateFrom = labels[0]
    }

    // Reset baselineDateTo if it's not in the available labels
    if (!labels.includes(baselineDateTo)) {
      this.data.baselineDateTo = labels[0]
    }

    // Reset sliderStart if not in unique yearly labels
    if (!this.data.allYearlyChartLabelsUnique.value?.includes(this.computed.getSliderStart())) {
      this.data.sliderStart = undefined
    }
  }

  /**
   * Validate and reset date range if invalid
   * Called when labels change (e.g., chart type change, data update)
   */
  resetDates(): void {
    const labels = this.data.allChartData.labels
    if (!labels) return

    const dateFrom = this.computed.getDateFrom()
    const dateTo = this.computed.getDateTo()
    const sliderStart = this.computed.sliderStartPeriod()

    // Reset dateFrom if it's not in available labels
    if (!labels.includes(dateFrom)) {
      if (labels.includes(sliderStart)) {
        this.data.dateFrom = sliderStart
      } else {
        this.data.dateFrom = labels[0]
      }
    }

    // Reset dateTo if it's not in available labels
    if (!labels.includes(dateTo)) {
      this.data.dateTo = labels[labels.length - 1]
    }
  }

  // ============================================================================
  // DATE RANGE VALIDATION CHECKS
  // ============================================================================

  /**
   * Check if date range is valid
   * @returns true if dateFrom <= dateTo
   */
  isDateRangeValid(): boolean {
    const fromIndex = this.computed.dateFromIndex()
    const toIndex = this.computed.dateToIndex()

    return fromIndex >= 0 && toIndex >= 0 && fromIndex <= toIndex
  }

  /**
   * Check if baseline date range is valid
   * @returns true if baselineDateFrom <= baselineDateTo
   */
  isBaselineDateRangeValid(): boolean {
    const fromIndex = this.computed.baselineDateFromIndex()
    const toIndex = this.computed.baselineDateToIndex()

    return fromIndex >= 0 && toIndex >= 0 && fromIndex <= toIndex
  }

  /**
   * Check if date is within available labels
   */
  isDateValid(date: string): boolean {
    return this.computed.getLabels().includes(date)
  }

  /**
   * Check if baseline date is within available labels
   */
  isBaselineDateValid(date: string): boolean {
    const labels = this.data.allChartLabels.value
    if (!labels) return false
    return labels.includes(date)
  }

  // ============================================================================
  // COUNTRY VALIDATION
  // ============================================================================

  /**
   * Validate country selection
   * @returns true if at least one country is selected
   */
  hasValidCountrySelection(): boolean {
    return this.data.countries.length > 0
  }

  /**
   * Check if a country code is valid
   */
  isValidCountry(countryCode: string): boolean {
    return countryCode in this.data.allCountries
  }

  /**
   * Filter out invalid countries from selection
   * @returns Array of valid country codes
   */
  getValidCountries(): string[] {
    return this.data.countries.filter(code => this.isValidCountry(code))
  }

  /**
   * Remove invalid countries from selection
   */
  removeInvalidCountries(): void {
    const validCountries = this.getValidCountries()
    if (validCountries.length !== this.data.countries.length) {
      this.data.countries = validCountries
    }
  }

  // ============================================================================
  // AGE GROUP VALIDATION
  // ============================================================================

  /**
   * Check if age group is valid for selected countries
   */
  isValidAgeGroup(ageGroup: string): boolean {
    // 'all' is always valid
    if (ageGroup === 'all') return true

    // Check if any selected country has this age group
    for (const countryCode of this.data.countries) {
      const country = this.data.allCountries[countryCode]
      if (country) {
        const ageGroups = country.age_groups()
        // age_groups() returns a Set, so we need to check differently
        if (Array.isArray(ageGroups)) {
          if (ageGroups.includes(ageGroup)) return true
        } else if (ageGroups instanceof Set) {
          if (ageGroups.has(ageGroup)) return true
        }
      }
    }

    return false
  }

  /**
   * Get valid age groups for current country selection
   */
  getValidAgeGroups(): string[] {
    return this.data.ageGroups.filter(ag => this.isValidAgeGroup(ag))
  }

  /**
   * Remove invalid age groups from selection
   */
  removeInvalidAgeGroups(): void {
    const validAgeGroups = this.getValidAgeGroups()
    if (validAgeGroups.length !== this.data.ageGroups.length) {
      this.data.ageGroups = validAgeGroups.length > 0 ? validAgeGroups : ['all']
    }
  }

  // ============================================================================
  // CHART TYPE VALIDATION
  // ============================================================================

  /**
   * Check if chart type is valid for current data type
   * Some data types may not support certain chart types
   */
  isValidChartType(): boolean {
    // ASMR types only support 'all' age group
    if (this.data.type.includes('asmr')) {
      return this.data.ageGroups.length === 1 && this.data.ageGroups[0] === 'all'
    }

    return true
  }

  /**
   * Check if baseline method is valid for current data type
   */
  isValidBaselineMethod(): boolean {
    // Population type doesn't support excess mode
    if (this.data.type === 'population' && this.data.isExcess) {
      return false
    }

    return true
  }

  // ============================================================================
  // DATA AVAILABILITY VALIDATION
  // ============================================================================

  /**
   * Check if chart data is loaded and valid
   */
  hasValidChartData(): boolean {
    return !!(
      this.data.allChartData
      && this.data.allChartData.labels
      && this.data.allChartData.labels.length > 0
      && this.data.allChartData.data
    )
  }

  /**
   * Check if country metadata is loaded
   */
  hasValidCountryMetadata(): boolean {
    return !!(
      this.data.allCountries
      && Object.keys(this.data.allCountries).length > 0
    )
  }

  /**
   * Check if all required data is loaded for rendering
   */
  isReadyToRender(): boolean {
    return (
      this.hasValidCountryMetadata()
      && this.hasValidChartData()
      && this.hasValidCountrySelection()
      && this.isDateRangeValid()
    )
  }

  // ============================================================================
  // COMPREHENSIVE VALIDATION
  // ============================================================================

  /**
   * Run all validation checks and return results
   * Useful for debugging and error reporting
   */
  validateAll(): ValidationResult {
    return {
      dateRange: this.isDateRangeValid(),
      baselineDateRange: this.isBaselineDateRangeValid(),
      countrySelection: this.hasValidCountrySelection(),
      chartType: this.isValidChartType(),
      baselineMethod: this.isValidBaselineMethod(),
      chartData: this.hasValidChartData(),
      countryMetadata: this.hasValidCountryMetadata(),
      readyToRender: this.isReadyToRender()
    }
  }
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  dateRange: boolean
  baselineDateRange: boolean
  countrySelection: boolean
  chartType: boolean
  baselineMethod: boolean
  chartData: boolean
  countryMetadata: boolean
  readyToRender: boolean
}
