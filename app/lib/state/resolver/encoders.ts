/**
 * URL Encoding Utilities
 *
 * Generic encoder/decoder functions for URL state serialization.
 * These are framework-agnostic and can be used with any field definitions.
 */

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
