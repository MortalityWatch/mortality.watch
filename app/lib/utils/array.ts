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

/**
 * Compare two arrays for shallow equality
 *
 * @param a - First array (or undefined)
 * @param b - Second array (or undefined)
 * @returns true if arrays have same length and elements at each index are equal (===)
 */
export function arraysEqual<T>(a: T[] | undefined, b: T[] | undefined): boolean {
  if (a === b) return true
  if (a === undefined || b === undefined) return false
  if (a.length !== b.length) return false
  return a.every((val, idx) => val === b[idx])
}

/**
 * Compare two values for equality (with deep comparison for arrays)
 *
 * @param a - First value
 * @param b - Second value
 * @returns true if values are equal (arrays compared element-wise, primitives with ===)
 */
export function valuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((val, idx) => val === b[idx])
  }
  return a === b
}
