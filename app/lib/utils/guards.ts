/**
 * TypeScript type guards and type utilities
 */

export const isNumberArray = (arr: unknown[]): arr is number[] =>
  arr.every(item => typeof item === 'number' && !isNaN(item))

export const typedKeys = <T extends object>(obj: T): Array<keyof T> =>
  Object.keys(obj) as Array<keyof T>

export const isStringArray = (
  value: unknown[]
): value is (string | undefined)[] =>
  value.every(v => typeof v === 'string' || v === undefined)
