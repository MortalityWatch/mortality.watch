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
  chartType: 'fluseason',
  chartStyle: 'line',
  dateFrom: undefined as string | undefined, // undefined = use default range
  dateTo: undefined as string | undefined, // undefined = use latest available
  baselineDateFrom: undefined as string | undefined,
  baselineDateTo: undefined as string | undefined,
  standardPopulation: 'who',
  ageGroups: ['all'],
  showBaseline: true,
  baselineMethod: 'mean',
  cumulative: false,
  showTotal: false,
  maximize: false,
  showPredictionInterval: true,
  showLabels: true,
  showPercentage: undefined as boolean | undefined,
  isLogarithmic: false,
  sliderStart: '2010' as string | undefined, // Slider shows from 2010 onwards
  userColors: undefined as string[] | undefined,
  showLogo: true,
  showQrCode: true,
  showCaption: true,
  decimals: 'auto',
  darkMode: false
}

export type ChartStateInput = typeof Defaults

export const stateFieldEncoders = {
  countries: { key: 'c' },
  type: { key: 't' },
  chartType: { key: 'ct' },
  // Note: 'e' param now handled by view system (see viewDetector.ts)
  chartStyle: { key: 'cs' },
  dateFrom: { key: 'df' },
  dateTo: { key: 'dt' },
  sliderStart: { key: 'ss' },
  baselineDateFrom: { key: 'bf' },
  baselineDateTo: { key: 'bt' },
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
  userColors: { key: 'uc' },
  decimals: { key: 'dec' },
  showLogo: { key: 'l', encode: encodeBool, decode: decodeBool },
  showQrCode: { key: 'qr', encode: encodeBool, decode: decodeBool },
  showCaption: { key: 'cap', encode: encodeBool, decode: decodeBool },
  darkMode: { key: 'dm', encode: encodeBool, decode: decodeBool }
}
