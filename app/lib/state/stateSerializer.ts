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

// Encode chart preset name to short form (dimensions like "1000x625")
export const encodePreset = (name: string | undefined): string | undefined => {
  if (name === undefined) return undefined
  if (name === 'Fit to Page') return 'fit'
  // Extract dimensions like "1000×625" from name like "Medium (1000×625)"
  const match = name.match(/\((\d+)×(\d+)\)/)
  if (match) return `${match[1]}x${match[2]}`
  return name
}

export const decodePreset = (str: string | undefined): string | undefined => {
  if (str === undefined) return undefined
  if (str === 'fit') return 'Fit to Page'
  // If it's dimensions like "1000x625", find the matching preset
  const match = str.match(/^(\d+)x(\d+)$/)
  if (match && match[1] && match[2]) {
    const _width = parseInt(match[1])
    const _height = parseInt(match[2])
    // We'll need to import CHART_PRESETS to find the matching one
    // For now, just return the dimensions format that will be matched
    return str // This will be handled in the component
  }
  return str
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
  userColors: undefined as unknown as string[],
  chartPreset: undefined as unknown as string,
  chartWidth: undefined as unknown as number,
  chartHeight: undefined as unknown as number,
  showLogo: true,
  showQrCode: true,
  decimals: 'auto'
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
  userColors: { key: 'uc' },
  decimals: { key: 'dec' },
  chartPreset: { key: 'preset', encode: encodePreset, decode: decodePreset },
  chartWidth: { key: 'cw' },
  chartHeight: { key: 'ch' },
  showLogo: { key: 'l', encode: encodeBool, decode: decodeBool },
  showQrCode: { key: 'qr', encode: encodeBool, decode: decodeBool }
}
