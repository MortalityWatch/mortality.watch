/**
 * Array utility functions
 */

import type { NumberArray, StringArray } from '~/model'

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

export const repeat = <T>(x: T, times: number): T[] => {
  const result: T[] = []
  for (let i = 0; i < times; i++) result.push(x)
  return result
}

export const shuffleArray = (array: unknown[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
  return array
}

/**
 * Get the last element of an array
 * Replacement for Array.prototype.last() to avoid prototype pollution
 */
export const last = <T>(arr: T[]): T | undefined => arr[arr.length - 1]
