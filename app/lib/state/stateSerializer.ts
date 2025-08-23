export const encodeBool = (bool: boolean | undefined): number | undefined => {
  if (bool === undefined) return undefined
  return bool ? 1 : 0
}

export const decodeBool = (
  num: string | number | undefined
): boolean | undefined => {
  if (num === undefined) return undefined
  return num == 1 ? true : false
}

export const encodeString = (str: string | undefined): string | undefined => {
  if (str === undefined) return undefined
  return encodeURIComponent(str)
}

export const decodeString = (str: string | undefined): string | undefined => {
  if (str === undefined) return undefined
  return decodeURIComponent(str)
}

export const Defaults = {
  countries: ['USA', 'SWE'],
  type: 'asmr',
  isExcess: false,
  chartType: 'yearly',
  chartStyle: 'line',
  dateFrom: undefined as unknown as string,
  dateTo: undefined as unknown as string,
  baselineDateFrom: undefined as unknown as string,
  baselineDateTo: undefined as unknown as string,
  standardPopulation: 'esp',
  ageGroups: ['all'],
  showBaseline: true,
  baselineMethod: 'mean',
  cumulative: false,
  showTotal: false,
  maximize: false,
  showPredictionInterval: true,
  showLabels: true,
  showPercentage: undefined as unknown as boolean,
  isLogarithmic: false,
  sliderStart: undefined as unknown as string,
  userColors: undefined as unknown as string[]
}

export type ChartStateInput = typeof Defaults

export const stateFieldEncoders = {
  countries: { key: 'c' },
  type: { key: 't' },
  chartType: { key: 'ct' },
  isExcess: { key: 'e', encode: encodeBool, decode: decodeBool },
  chartStyle: { key: 'cs' },
  dateFrom: { key: 'df', encode: encodeString, decode: decodeString },
  dateTo: { key: 'dt', encode: encodeString, decode: decodeString },
  sliderStart: { key: 'ss' },
  baselineDateFrom: { key: 'bf', encode: encodeString, decode: decodeString },
  baselineDateTo: { key: 'bt', encode: encodeString, decode: decodeString },
  standardPopulation: { key: 'sp' },
  ageGroups: { key: 'ag' },
  showBaseline: { key: 'sb', encode: encodeBool, decode: decodeBool },
  baselineMethod: { key: 'bm' },
  cumulative: { key: 'ce', encode: encodeBool, decode: decodeBool },
  showTotal: { key: 'st', encode: encodeBool, decode: decodeBool },
  maximize: { key: 'm', encode: encodeBool, decode: decodeBool },
  showPredictionInterval: { key: 'pi', encode: encodeBool, decode: decodeBool },
  showLabels: { key: 'sl', encode: encodeBool, decode: decodeBool },
  showPercentage: { key: 'p', encode: encodeBool, decode: decodeBool },
  isLogarithmic: { key: 'lg', encode: encodeBool, decode: decodeBool },
  userColors: { key: 'uc' }
}
