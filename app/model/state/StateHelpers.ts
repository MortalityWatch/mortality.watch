import { getKeyForType, type NumberEntryFields } from '@/model'
import type { StateProperties } from './stateProperties'

/**
 * Helper methods for state - type predicates and utilities
 */
export class StateHelpers {
  constructor(private props: StateProperties) {}

  // Type predicates
  isAsmrType = () => this.props.type.includes('asmr')

  isPopulationType = () => this.props.type === 'population'

  isLifeExpectancyType = () => this.props.type === 'le'

  isDeathsType = () => this.props.type.includes('deaths')

  isErrorBarType = () => this.isBarChartStyle() && this.props.isExcess

  hasBaseline = () => !this.isPopulationType() && !this.props.isExcess

  isLineChartStyle = () => this.props.chartStyle === 'line'

  isBarChartStyle = () => this.props.chartStyle === 'bar'

  isMatrixChartStyle = () => this.props.chartStyle === 'matrix'

  isWeeklyChartType = () => this.props.chartType.includes('weekly')

  isMonthlyChartType = () => this.props.chartType.includes('monthly')

  isYearlyChartType = () =>
    this.props.chartType.includes('year')
    || this.props.chartType.includes('fluseason')
    || this.props.chartType.includes('midyear')

  showCumPi = (): boolean =>
    this.props.cumulative
    && this.isYearlyChartType()
    && ['lin_reg', 'mean'].includes(this.props.baselineMethod)

  getBaseKeysForType = (): (keyof NumberEntryFields)[] =>
    getKeyForType(this.props.type, this.props.showBaseline, this.props.standardPopulation, false)

  getMaxDateType() {
    if (this.props.type.includes('deaths') || this.props.type.includes('cmr')) return 'cmr'
    return 'asmr'
  }

  periodMultiplicatorForType = () => {
    switch (this.props.chartType) {
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
