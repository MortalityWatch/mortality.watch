import {
  datasetEntryKeys,
  type CountryData,
  type DatasetEntry,
  type NumberArray,
  type StringArray
} from './model'
import { color_scale_diverging_css } from './colors'

export const maybeTransformFluSeason = (x: string) => {
  if (/^\d{4}-\d{4}$/.test(x)) {
    return `${x.substring(0, 4)}/${x.substring(7, 9)}`
  } else return x
}

export const getYear = (x: string): number => parseInt(x.substring(0, 4))

export const getMonth = (x: string): number => months.indexOf(x.slice(-3))

export const fromYearMonthString = (x: string): number =>
  new Date(getYear(x), getMonth(x)).getTime()

export const months = [
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

export const left = (str: string, n: number) => str.substring(0, n)

export const right = (str: string, n: number) => str.slice(-n)

export const prefillUndefined = (
  ds: StringArray | NumberArray,
  n: number
): StringArray | NumberArray => {
  for (let i = 0; i < n; i++) ds.unshift(undefined)
  return ds
}

export const postfillUndefined = <T>(ds: T[], n: number): (T | undefined)[] => {
  const d = ds as (T | undefined)[]
  for (let i = 0; i < n; i++) d.push(undefined)
  return d
}

export const getFirstIndexOf = (needle: string, haystack: string[]) => {
  let result = -1
  for (let i = 0; i < haystack.length; i++) {
    if (haystack[i]?.includes(needle)) {
      result = i
      break
    }
  }
  return result
}

export const cumulativeSum = (arr: number[]): number[] => {
  const result: number[] = []

  let prev = 0
  for (const row of arr) {
    const curr = prev + row
    result.push(curr)
    if (!isNaN(row)) prev = curr
  }
  return result
}

export const sum = (arr: number[]): number => {
  let result = 0
  for (const row of arr) {
    if (!isNaN(row) && row) result += row
  }
  return result
}

export const getSortedArray = <T>(set: Set<T>): T[] => {
  const countriesArr = Array.from(set)
  countriesArr.sort()
  return countriesArr
}

export const getObjectOfArrays = (rows: CountryData[]): DatasetEntry => {
  const result = {} as Record<keyof DatasetEntry, unknown[]>

  if (!rows || rows.length < 1) return result as DatasetEntry

  for (const key of datasetEntryKeys) {
    result[key] = []
  }

  for (const row of rows) {
    for (const key of Object.keys(row) as (keyof CountryData)[]) {
      result[key]?.push(row[key])
    }
  }

  return result as DatasetEntry
}

/**
 * Display a base64 URL inside an iframe in another window.
 */
export const openNewWindowWithBase64Url = (base64: string) => {
  const win = window.open()
  if (!win) throw new Error('Cannot open new window')
  win.document.write(
    '<iframe src="'
    + base64
    + '" frameborder="0" style="border:0; '
    + 'top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" '
    + 'allowfullscreen></iframe>'
  )
}

export const appearanceChanged = (cb: () => void) =>
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', cb)

export const round = (num: number, decimals = 0): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}
export const roundToStr = (num: number, decimals = 0): string =>
  (Math.round(num * 100) / 100).toFixed(
    decimals || decimals === 0 ? decimals : 1
  )

export const asPercentage = (
  value: number,
  decimals = 0,
  positivePrefix = '+',
  negativePrefix = ''
) => {
  const val = round(value * 100, decimals)
  return `${(val > 0 ? positivePrefix : negativePrefix) + val.toFixed(decimals)}%`
}

export const numberWithCommas = (
  x: number | string,
  forcePlusSign = false,
  decimals = 1
) => {
  const num = typeof x === 'number' ? x : parseFloat(x)
  const rounded = Number(num.toFixed(decimals))
  return (forcePlusSign && num > 0 ? '+' : '')
    + rounded.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
}
export const isMobile = () =>
  typeof window !== 'undefined' && window.innerWidth < 640

export const isDesktop = () =>
  typeof window !== 'undefined' && window.innerWidth >= 1024

export const abbrev = (str: string, n = 20) => {
  if (str.length <= n - 2) return str
  return str.substring(0, n - 3) + '..'
}

export const hashCode = (str: string) => {
  let hash = 0,
    i,
    chr
  if (str.length === 0) return hash
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

const timeoutIds: Record<number, number | undefined> = {}
export const delay = (fun: () => void, time: number = 333) => {
  const hash = hashCode(fun.toString())
  if (timeoutIds[hash]) clearTimeout(timeoutIds[hash])
  timeoutIds[hash] = setTimeout(async () => {
    fun()
    timeoutIds[hashCode(fun.toString())] = undefined
  }, time) as unknown as number
}

export const getByValue = (
  map: Record<string, string>,
  searchValue: string
) => {
  for (const [key, value] of Object.entries(map)) {
    if (value === searchValue) return key
  }
}

export const getCamelCase = (str: string) =>
  str
    .split(' ')
    .map((part: string) => {
      if (part.length < 3) return part
      const start = part.substring(0, 1).toUpperCase()
      const end = part.substring(1, part.length)
      return start + end
    })
    .join(' ')

Array.prototype.last = function () {
  return this.slice(-1)[0]
}

export const getColor = (value: number) => {
  const colors = color_scale_diverging_css()
  if (!value || isNaN(value) || value === Number.MIN_SAFE_INTEGER)
    return 'color-scale-na'
  const n = colors.length
  if (value <= -0.5) return colors[0]
  if (value >= 0.5) return colors[n - 1]
  const col_index = (value + 0.5) * n
  const idx = Math.floor(col_index)
  return colors[idx]
}

export const repeat = <T>(x: T, times: number): T[] => {
  const result: T[] = []
  for (let i = 0; i < times; i++) result.push(x)
  return result
}

export const capitalizeFirstLetter = (str: string): string =>
  str.replace(/^\w/, c => c.toUpperCase())

export const parseFourDigitNumber = (input: string) => {
  const regex = /\b\d{4}\b/
  const match = input.match(regex)
  if (match) return Number(match[0])
  return null
}

export const getFilename = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/ /gi, '_')

export const shuffleArray = (array: unknown[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}

export const removeMetaTag = (name: string) =>
  new Promise<void>((resolve) => {
    const tag = document.querySelector(`meta[name="${name}"]`)
    if (tag) {
      tag.remove()
    }
    resolve()
  })

export const isNumberArray = (arr: unknown[]): arr is number[] =>
  arr.every(item => typeof item === 'number' && !isNaN(item))

export const typedKeys = <T extends object>(obj: T): Array<keyof T> =>
  Object.keys(obj) as Array<keyof T>

export const isStringArray = (
  value: unknown[]
): value is (string | undefined)[] =>
  value.every(v => typeof v === 'string' || v === undefined)
