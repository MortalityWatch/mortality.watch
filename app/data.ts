import Papa from 'papaparse'
import {
  CountryData,
  Country,
  type CountryRaw,
  type Dataset,
  type DatasetEntry,
  type AllChartData,
  type NumberArray,
  type NumberEntryFields,
  type DatasetRaw,
  stringKeys,
  type StringArray,
  numberKeys,
  type DataVector
} from './model'
import {
  getObjectOfArrays,
  prefillUndefined,
  fromYearMonthString,
  left,
  right
} from './utils'
import { dataLoader } from './lib/dataLoader'

const errHandler = (err: string) => console.error(err)

export const loadCountryMetadataFlat = async (options?: {
  filterCountries?: string[]
}): Promise<CountryRaw[]> => {
  const text = await dataLoader.fetchMetadata()
  const rawObjects = Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  }).data as CountryRaw[]

  // Filter by specified countries if provided
  const filterCountries = options?.filterCountries || []
  if (filterCountries.length > 0) {
    return rawObjects.filter(obj => filterCountries.includes(obj.iso3c))
  }

  return rawObjects
}

export const loadCountryMetadata = async (options?: {
  filterCountries?: string[]
}): Promise<Record<string, Country>> => {
  const text = await dataLoader.fetchMetadata()
  const rawObjects = Papa.parse(text, { header: true }).data as unknown[]
  const data: Record<string, Country> = {}

  // Get dev countries filter from options
  const filterCountries = options?.filterCountries || []

  if (import.meta.dev && filterCountries.length > 0) {
    console.log('[loadCountryMetadata] Filtering to countries:', filterCountries)
  }

  for (const rawObj of rawObjects) {
    const typedObj = rawObj as Record<string, unknown>
    if (!typedObj.iso3c) continue

    const parsedObj = new Country(rawObj as CountryRaw)
    const iso = parsedObj.iso3c

    // Filter by specified countries if provided
    if (filterCountries.length > 0 && !filterCountries.includes(iso)) {
      continue
    }

    if (!data[iso]) data[iso] = parsedObj
    else
      data[iso].data_source = [
        ...data[iso].data_source,
        ...parsedObj.data_source
      ]
  }
  return data
}

const fetchData = async (
  chartType: string,
  country: string,
  ageGroup: string
): Promise<CountryData[]> => {
  try {
    const rawData = await dataLoader.fetchData(country, chartType, ageGroup)
    const rawObjects = Papa.parse(rawData, {
      header: true,
      delimiter: ',',
      newline: '\n'
    }).data
    const data: CountryData[] = []
    for (const rawObj of rawObjects) {
      const parsedObj = new CountryData(rawObj, ageGroup, chartType)
      if (!parsedObj.iso3c) continue
      data.push(parsedObj)
    }
    return data
  } catch (error) {
    console.error(`Error fetching ${country}/${chartType}/${ageGroup}:`, error)
    errHandler(error as string)
    return []
  }
}

export const updateDataset = async (
  chartType: string,
  countryCodes: string[],
  ageGroups: string[]
): Promise<DatasetRaw> => {
  try {
    const operations: Promise<CountryData[]>[] = []
    // Call fetchData in parallel for all combinations
    countryCodes.forEach((country) => {
      ageGroups.forEach((ag) => {
        operations.push(fetchData(chartType, country, ag))
      })
    })
    const results = await Promise.all(operations)
    const rows = results.flat()
    const data: DatasetRaw = {}
    rows.forEach((row) => {
      const { age_group, iso3c } = row
      data[age_group] = data[age_group] || {}
      data[age_group][iso3c] = data[age_group][iso3c] || []
      data[age_group][iso3c].push(row)
    })
    return data
  } catch (error) {
    console.error(error)
    return {}
  }
}

export const getLabels = (chartType: string, labels: string[]): string[] => {
  let labelsArr: string[]
  if (chartType === 'monthly') {
    labelsArr = labels.sort((a: string, b: string) => {
      return fromYearMonthString(a) - fromYearMonthString(b)
    }) as string[]
  } else {
    labelsArr = labels.sort() as string[]
  }
  return labelsArr
}

const getEmptyLabelFilterKey = (isAsmrType: boolean): keyof CountryData => {
  let key = 'cmr'
  if (isAsmrType) key = 'asmr_who'
  return key as keyof CountryData
}

export const getAllChartLabels = (
  rawData: DatasetRaw,
  isAsmrType: boolean,
  ageGroupFilter?: string[],
  countryCodeFilter?: string[],
  chartType?: string
): string[] => {
  const allLabels = new Set<string>()
  const ageGroups = ageGroupFilter ?? Object.keys(rawData || {})
  const countryCodes = countryCodeFilter ?? Object.keys(rawData.all ?? {})
  const type = getEmptyLabelFilterKey(isAsmrType)

  for (const ag of ageGroups) {
    for (const iso3c of countryCodes) {
      if (!rawData[ag] || !rawData[ag][iso3c]) continue
      rawData[ag][iso3c].forEach((el) => {
        if (el[type] !== undefined) allLabels.add(el.date)
      })
    }
  }

  const result = Array.from(allLabels)
  if (chartType === 'monthly') {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ]
    const customSort = (a: string, b: string) => {
      const x = parseInt(left(a, 4), 10) + months.indexOf(right(a, 3)) / 12
      const y = parseInt(left(b, 4), 10) + months.indexOf(right(b, 3)) / 12
      return x - y
    }

    return result.sort(customSort)
  }
  return result.sort()
}

const calculateExcess = (data: DatasetEntry, key: keyof DatasetEntry): void => {
  const currentValues = data[key] as NumberArray
  const baseline = data[`${key}_baseline` as keyof DatasetEntry] as NumberArray
  const baselineLower = data[
    `${key}_baseline_lower` as keyof DatasetEntry
  ] as NumberArray
  const baselineUpper = data[
    `${key}_baseline_upper` as keyof DatasetEntry
  ] as NumberArray

  // Ensure arrays are initialized
  if (!data[`${key}_excess` as keyof DatasetEntry])
    data[`${key}_excess` as keyof DatasetEntry] = []
  if (!data[`${key}_excess_lower` as keyof DatasetEntry])
    data[`${key}_excess_lower` as keyof DatasetEntry] = []
  if (!data[`${key}_excess_upper` as keyof DatasetEntry])
    data[`${key}_excess_upper` as keyof DatasetEntry] = []

  const excess = data[`${key}_excess` as keyof DatasetEntry]
  const excessLower = data[`${key}_excess_lower` as keyof DatasetEntry]
  const excessUpper = data[`${key}_excess_upper` as keyof DatasetEntry]

  for (let i = 0; i < currentValues.length; i++) {
    const currentValue = currentValues[i] ?? 0
    const base = baseline[i] ?? 0
    const baseLower = baselineLower[i] ?? 0
    const baseUpper = baselineUpper[i] ?? 0

    excess[i] = currentValue - base
    excessLower[i] = currentValue - baseLower
    excessUpper[i] = currentValue - baseUpper
  }
}

const getSeasonType = (chartType: string) => {
  switch (chartType) {
    case 'weekly':
    case 'weekly_104w_sma':
    case 'weekly_52w_sma':
    case 'weekly_26w_sma':
    case 'weekly_13w_sma':
      return 4
    case 'monthly':
      return 3
    case 'quarterly':
      return 2
    default:
      return 1
  }
}

const calculateBaseline = async (
  data: DatasetEntry,
  labels: string[],
  startIdx: number,
  endIdx: number,
  keys: (keyof DatasetEntry)[],
  method: string,
  chartType: string,
  cumulative: boolean
) => {
  if (method === 'auto') return

  const n = labels.length
  const firstKey = keys[0]
  const all_data = firstKey ? (data[firstKey]?.slice(startIdx, n) || []) : []
  const bl_data = firstKey ? (data[firstKey]?.slice(startIdx, endIdx + 1) || []) : []
  const h = all_data.length - bl_data.length
  const trend = method === 'lin_reg' // Only linear regression uses trend mode (t=1)
  const s = getSeasonType(chartType)

  if (bl_data.every(x => x == null || isNaN(x as number))) return

  // Validate indices before making API call
  if (startIdx < 0 || endIdx < 0) {
    console.warn('Invalid baseline indices:', {
      startIdx,
      endIdx,
      chartType,
      labelsLength: labels.length,
      firstLabel: labels[0],
      lastLabel: labels[labels.length - 1]
    })
    return
  }

  // Ensure we have enough data points for meaningful baseline calculation
  const validDataPoints = bl_data.filter(x => x != null && !isNaN(x as number)).length
  if (validDataPoints < 3) {
    console.warn('Insufficient data points for baseline calculation:', {
      iso3c: data.iso3c?.[0],
      validDataPoints,
      blDataLength: bl_data.length,
      startIdx,
      endIdx,
      chartType
    })
    return
  }

  try {
    const baseUrl = 'https://rstats.mortality.watch/'
    const dataParam
      = cumulative && s === 1 ? (all_data as (string | number)[]).join(',') : (bl_data as (string | number)[]).join(',')
    const url
      = cumulative && s === 1
        ? `${baseUrl}cum?y=${dataParam}&h=${h}&t=${trend ? 1 : 0}`
        : `${baseUrl}?y=${dataParam}&h=${h}&s=${s}&t=${trend ? 1 : 0}&m=${method}`

    const text = await dataLoader.fetchBaseline(url)
    const json = JSON.parse(text)

    // Update NA to undefined
    json.lower = (json.lower as string[]).map(x =>
      x === 'NA' ? undefined : x
    )
    json.upper = (json.upper as string[]).map(x =>
      x === 'NA' ? undefined : x
    )

    if (keys[1]) data[keys[1]] = prefillUndefined(
      json.y as NumberArray,
      startIdx
    ) as DataVector
    if (keys[2]) data[keys[2]] = prefillUndefined(json.lower, startIdx) as DataVector
    if (keys[3]) data[keys[3]] = prefillUndefined(json.upper, startIdx) as DataVector
  } catch (error) {
    console.error('Baseline calculation failed, using simple mean fallback:', {
      iso3c: data.iso3c?.[0],
      chartType,
      method,
      startIdx,
      endIdx,
      blDataLength: bl_data.length,
      validDataPoints,
      error
    })

    // Fallback: Use simple mean baseline when external service fails
    const validData = bl_data.filter(x => x != null && !isNaN(x as number)) as number[]
    if (validData.length > 0) {
      const mean = validData.reduce((sum, val) => sum + val, 0) / validData.length
      const stdDev = Math.sqrt(
        validData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validData.length
      )

      // Create baseline array filled with mean value
      const baselineArray = new Array(all_data.length).fill(mean)
      const lowerArray = new Array(all_data.length).fill(mean - 2 * stdDev)
      const upperArray = new Array(all_data.length).fill(mean + 2 * stdDev)

      if (keys[1]) data[keys[1]] = prefillUndefined(baselineArray as NumberArray, startIdx) as DataVector
      if (keys[2]) data[keys[2]] = prefillUndefined(lowerArray as NumberArray, startIdx) as DataVector
      if (keys[3]) data[keys[3]] = prefillUndefined(upperArray as NumberArray, startIdx) as DataVector
    }
  }

  if (firstKey) calculateExcess(data, firstKey)
}

const calculateBaselines = async (
  data: Dataset,
  labels: string[],
  startIdx: number,
  endIdx: number,
  keys: (keyof DatasetEntry)[],
  method: string,
  chartType: string,
  cumulative: boolean,
  progressCb?: (progress: number, total: number) => void
) => {
  let count = 0
  const total = Object.keys(data || {}).reduce(
    (sum, ag) => sum + Object.keys(data[ag] || {}).length,
    0
  )

  const promises = []
  for (const ag of Object.keys(data || {})) {
    for (const iso of Object.keys(data[ag] || {})) {
      promises.push(
        calculateBaseline(
          data[ag]?.[iso] || ({} as DatasetEntry),
          labels,
          startIdx,
          endIdx,
          keys,
          method,
          chartType,
          cumulative
        ).then((result) => {
          if (!progressCb) return
          count++
          progressCb(count, total)
          return result
        })
      )
    }
  }
  if (progressCb) progressCb(0, total)
  await Promise.all(promises)
}

export const getAllChartData = async (
  dataKey: keyof CountryData,
  chartType: string,
  rawData: DatasetRaw,
  allLabels: string[],
  startDateIndex: number,
  cumulative: boolean,
  ageGroupFilter?: string[],
  countryCodeFilter?: string[],
  baselineMethod?: string,
  baselineDateFrom?: string,
  baselineDateTo?: string,
  keys?: (keyof NumberEntryFields)[],
  progressCb?: (progress: number, total: number) => void
): Promise<AllChartData> => {
  const data: Dataset = {}
  const ageGroups = ageGroupFilter ?? Object.keys(rawData || {})
  const countryCodes = countryCodeFilter ?? Object.keys(rawData?.all || {})
  const noData: Record<string, Set<string>> = {}
  const noAsmr: Set<string> = new Set<string>()

  // Get Country data and labels
  for (const ag of ageGroups) {
    for (const iso3c of countryCodes) {
      if (!rawData[ag] || !rawData[ag][iso3c]) {
        if (!noData[iso3c]) noData[iso3c] = new Set<string>()
        noData[iso3c].add(ag)
        continue
      }
      const cd = getDataForCountry(
        rawData[ag][iso3c],
        iso3c,
        allLabels[startDateIndex] || ''
      )
      if (!data[ag]) data[ag] = {}
      if (
        !cd
        || (!baselineMethod && cd[dataKey].filter(x => x).length == 0)
      ) {
        if (dataKey.startsWith('asmr')) {
          noAsmr.add(iso3c)
        } else {
          if (!noData[iso3c]) noData[iso3c] = new Set<string>()
          noData[iso3c].add(ag)
        }

        continue
      }
      data[ag][iso3c] = cd
    }
  }

  const labels = getLabels(
    chartType,
    startDateIndex > 0 ? allLabels.slice(startDateIndex) : allLabels
  )

  // Align time series for all countries
  for (const ag of ageGroups) {
    if (!data[ag]) continue
    for (const iso3c of countryCodes) {
      if (!data[ag][iso3c]) continue
      let n = 0
      for (const label of labels) {
        if (data[ag][iso3c].date.includes(label)) break
        else n++
      }
      if (n > 0) {
        for (const key of stringKeys) {
          data[ag][iso3c][key] = prefillUndefined(
            data[ag][iso3c][key],
            n
          ) as StringArray
        }

        for (const key of numberKeys) {
          data[ag][iso3c][key] = prefillUndefined(
            data[ag][iso3c][key],
            n
          ) as NumberArray
        }
      }
    }
  }

  if (
    baselineDateFrom
    && baselineDateTo
    && keys
    && baselineMethod
    && dataKey !== 'population'
  ) {
    await calculateBaselines(
      data,
      labels,
      labels.indexOf(baselineDateFrom),
      labels.indexOf(baselineDateTo),
      keys,
      baselineMethod,
      chartType,
      cumulative,
      progressCb
    )
  }

  return { data, labels, notes: { noData, noAsmr } }
}

// Remove CDC deaths < 10 and their derivatives
const hideCdcSuppressed = (result: Record<string, unknown[]>) => {
  for (let i = 0; i < (result.deaths?.length || 0); i++) {
    const val = result.deaths?.[i] as number
    if (val >= 10) continue
    for (const [k, v] of Object.entries(result)) {
      if (!k.startsWith('deaths') && !k.startsWith('cmr')) continue
      v[i] = NaN
    }
  }
}

export const getDataForCountry = (
  rawData: CountryData[],
  iso3c: string,
  startDate: string
): DatasetEntry | undefined => {
  const data = rawData.filter((v: CountryData) => v.iso3c === iso3c)
  if (!data || !data.length) return undefined

  // Find skipIndex, which skips all entries until startDate.
  let skipIndex = undefined
  for (let i = 0; i < data.length; i++) {
    if (data[i]?.date === startDate) {
      skipIndex = i
      break
    }
  }

  const result = getObjectOfArrays(data.slice(skipIndex))
  if (iso3c.startsWith('USA')) hideCdcSuppressed(result)
  return result
}

export const getSourceDescription = (source: string) => {
  switch (source) {
    case 'un':
      return '<a href="https://population.un.org/wpp/Download/Standard/MostUsed/" target="_blank">United Nations</a>'
    case 'world_mortality':
      return '<a href="https://github.com/akarlinsky/world_mortality" target="_blank">World Mortality</a>'
    case 'mortality_org':
      return '<a href="https://mortality.org/Data/STMF" target="_blank">Human Mortality Database (STMF)</a>'
    case 'eurostat':
      return '<a href="https://ec.europa.eu/eurostat/data/database?node_code=demomwk" target="_blank">Eurostat</a>'
    case 'cdc':
      return '<a href="https://wonder.cdc.gov/mcd.html" target="_blank">CDC</a>'
    case 'statcan':
      return 'Statistics Canada: <a href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1310070901" target="_blank">1</a> <a href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1310076801" target="_blank">2</a>'
    case 'destatis':
      return 'Statistisches Bundesamt: <a href="https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Sterbefaelle-Lebenserwartung/Publikationen/Downloads-Sterbefaelle/statistischer-bericht-sterbefaelle-tage-wochen-monate-aktuell-5126109.html" target="_blank">1</a> <a href="https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Sterbefaelle-Lebenserwartung/Publikationen/Downloads-Sterbefaelle/statistischer-bericht-sterbefaelle-tage-wochen-monate-endg-5126108.html?nn=209016" target="_blank">2</a>'
    default:
      return 'unknown'
  }
}

export const getStartIndex = (
  allYearlyChartLabels: string[],
  sliderStart: string
): number => {
  if (!allYearlyChartLabels) return 0
  let i = 0
  for (const value of allYearlyChartLabels) {
    if (value === sliderStart) return i
    i++
  }
  return 0
}
