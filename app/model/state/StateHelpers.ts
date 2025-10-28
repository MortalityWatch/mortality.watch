import { getKeyForType, type NumberEntryFields } from '@/model'

/**
 * Helper methods for state - type predicates and utilities
 */
export class StateHelpers {
  type!: string
  chartStyle!: string
  chartType!: string
  isExcess!: boolean
  cumulative!: boolean
  baselineMethod!: string
  showBaseline!: boolean
  standardPopulation!: string

  // Type predicates
  isAsmrType = () => this.type.includes('asmr')

  isPopulationType = () => this.type === 'population'

  isLifeExpectancyType = () => this.type === 'le'

  isDeathsType = () => this.type.includes('deaths')

  isErrorBarType = () => this.isBarChartStyle() && this.isExcess

  hasBaseline = () => !this.isPopulationType() && !this.isExcess

  isLineChartStyle = () => this.chartStyle === 'line'

  isBarChartStyle = () => this.chartStyle === 'bar'

  isMatrixChartStyle = () => this.chartStyle === 'matrix'

  isWeeklyChartType = () => this.chartType.includes('weekly')

  isMonthlyChartType = () => this.chartType.includes('monthly')

  isYearlyChartType = () =>
    this.chartType.includes('year')
    || this.chartType.includes('fluseason')
    || this.chartType.includes('midyear')

  showCumPi = (): boolean =>
    this.cumulative
    && this.isYearlyChartType()
    && ['lin_reg', 'mean'].includes(this.baselineMethod)

  getBaseKeysForType = (): (keyof NumberEntryFields)[] =>
    getKeyForType(this.type, this.showBaseline, this.standardPopulation, false)

  getMaxDateType() {
    if (this.type.includes('deaths') || this.type.includes('cmr')) return 'cmr'
    return 'asmr'
  }

  periodMultiplicatorForType = () => {
    switch (this.chartType) {
      case 'weekly':
      case 'weekly_104w_sma':
      case 'weekly_52w_sma':
      case 'weekly_26w_sma':
      case 'weekly_13w_sma':
        return 52.1429
      case 'monthly':
        return 12
      case 'quarterly':
        return 4
      default:
        return 1
    }
  }

  // Backwards compatibility check
  isIsoKey = (str: string) => {
    return (
      str === str.toUpperCase()
      && (str.length === 3
        || /^(USA-\w{2})$/.test(str)
        || /^(DEU-\w{2})$/.test(str)
        || /^(GBR\w{4})$/.test(str))
    )
  }
}
