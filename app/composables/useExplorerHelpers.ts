import { computed, type Ref } from 'vue'
import { getKeyForType, type NumberEntryFields } from '@/model'

/**
 * Helper functions for the explorer page
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
  chartType: Ref<string>
) {
  const isAsmrType = () => type.value.includes('asmr')
  const isPopulationType = () => type.value === 'population'
  const isLifeExpectancyType = () => type.value === 'le'
  const isDeathsType = () => type.value.includes('deaths')
  const isErrorBarType = () => isBarChartStyle() && isExcess.value
  const hasBaseline = () => !isPopulationType() && !isExcess.value
  const isLineChartStyle = () => chartStyle.value === 'line'
  const isBarChartStyle = () => chartStyle.value === 'bar'
  const isMatrixChartStyle = () => chartStyle.value === 'matrix'

  const getMaxCountriesAllowed = () =>
    countries.value.length > 1
    && isAsmrType()
    && standardPopulation.value === 'country'
      ? 1
      : undefined

  const isYearlyChartType = () =>
    chartType.value.includes('year')
    || chartType.value.includes('fluseason')
    || chartType.value.includes('midyear')

  const showCumPi = (): boolean =>
    cumulative.value
    && isYearlyChartType()
    && ['lin_reg', 'mean'].includes(baselineMethod.value)

  const getBaseKeysForType = (): (keyof NumberEntryFields)[] =>
    getKeyForType(type.value, showBaseline.value, standardPopulation.value, false)

  const showPredictionIntervalDisabled = computed(() =>
    (!isExcess.value && !showBaseline.value) || (cumulative.value && !showCumPi())
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
    showPredictionIntervalDisabled
  }
}
