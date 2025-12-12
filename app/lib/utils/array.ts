/**
 * Array utility functions
 */

import type { NumberArray, StringArray } from '@/model'

export const prefillUndefined = (
  ds: StringArray | NumberArray,
  n: number
): StringArray | NumberArray => {
  // Create new array with undefined prefix (O(n) vs O(n²) with repeated unshift)
  return [...new Array(n).fill(undefined), ...ds]
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

export const repeat = <T>(x: T, times: number): T[] => {
  const result: T[] = []
  for (let i = 0; i < times; i++) result.push(x)
  return result
}

/**
 * Get the last element of an array
 * Replacement for Array.prototype.last() to avoid prototype pollution
 */
export const last = <T>(arr: T[]): T | undefined => arr[arr.length - 1]
