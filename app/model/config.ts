/**
 * Configuration constants and list types
 */

export type ListType = { name: string, value: string }

export const types: ListType[] = [
  { name: 'Life Expectancy (LE)', value: 'le' },
  { name: 'Age Std. Mortality Rate (ASMR)', value: 'asmr' },
  { name: 'Crude Mortality Rate (CMR)', value: 'cmr' },
  { name: 'Deaths', value: 'deaths' },
  { name: 'Population', value: 'population' }
]

export const chartTypes: ListType[] = [
  { name: 'Week', value: 'weekly' },
  { name: 'Month', value: 'monthly' },
  { name: 'Quarter', value: 'quarterly' },
  { name: 'Year (Jan-Dec)', value: 'yearly' },
  { name: 'Year (Jul-Jun)', value: 'midyear' },
  { name: 'Year (Oct-Sep)', value: 'fluseason' },
  { name: 'Week (13W SMA)', value: 'weekly_13w_sma' },
  { name: 'Week (26W SMA)', value: 'weekly_26w_sma' },
  { name: 'Week (52W SMA)', value: 'weekly_52w_sma' },
  { name: 'Week (104W SMA)', value: 'weekly_104w_sma' }
]

export const chartStyles: ListType[] = [
  { name: 'Line', value: 'line' },
  { name: 'Bar', value: 'bar' },
  { name: 'Matrix', value: 'matrix' }
]

export const standardPopulations: ListType[] = [
  { name: 'ESP2013', value: 'esp' },
  { name: 'WHO2015', value: 'who' },
  { name: 'US2000', value: 'usa' },
  { name: '2020', value: 'country' }
]

export const jurisdictionTypes: ListType[] = [
  { name: 'Countries', value: 'countries' },
  { name: 'Countries & States ', value: 'countries_states' },
  { name: 'U.S. States', value: 'usa' },
  { name: 'Canadian Provinces', value: 'can' },
  { name: 'EU27 Countries', value: 'eu27' },
  { name: 'German States', value: 'deu' },
  { name: 'Africa', value: 'af' },
  { name: 'Asia', value: 'as' },
  { name: 'Europe', value: 'eu' },
  { name: 'North America', value: 'na' },
  { name: 'Oceania', value: 'oc' },
  { name: 'South America', value: 'sa' }
]

export const baselineMethods: ListType[] = [
  { name: 'Last Value', value: 'naive' },
  { name: 'Average', value: 'mean' },
  { name: 'Median', value: 'median' },
  { name: 'Linear Regression', value: 'lin_reg' },
  { name: 'Exponential Smoothing (ETS)', value: 'exp' }
]

export const decimalPrecisions: ListType[] = [
  { name: 'Auto', value: 'auto' },
  { name: '0', value: '0' },
  { name: '1', value: '1' },
  { name: '2', value: '2' },
  { name: '3', value: '3' }
]

// Transformed arrays for UI components (with label property for USelectMenu)
export const standardPopulationItems = standardPopulations
  .filter(x => x.value !== 'country')
  .map(x => ({ label: x.name, name: x.name, value: x.value }))

export const baselineMethodItems = baselineMethods
  .map(x => ({ label: x.name, name: x.name, value: x.value }))

export const decimalPrecisionItems = decimalPrecisions
  .map(x => ({ label: x.name, name: x.name, value: x.value }))

export const settingsModel = {
  chartStyle: chartStyles.map(v => v.value),
  chartType: chartTypes.map(v => v.value),
  type: types.map(v => v.value)
}
