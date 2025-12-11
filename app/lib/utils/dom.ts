/**
 * Browser/DOM utilities
 */

import { hashCode } from './strings'

/**
 * Minimal Window interface for type safety
 */
interface BrowserWindow {
  innerWidth: number
  innerHeight: number
  open: () => BrowserWindow | null
  document: BrowserDocument
  matchMedia: (query: string) => { addEventListener: (event: string, callback: () => void) => void }
}

/**
 * Minimal Document interface for type safety
 */
interface BrowserDocument {
  write: (content: string) => void
  querySelector: (selector: string) => { remove: () => void } | null
}

/**
 * Type-safe interface for globalThis in browser context
 */
interface GlobalWithBrowser {
  window?: BrowserWindow
  document?: BrowserDocument
}

/**
 * Get globalThis with proper typing for browser APIs
 */
function getGlobal(): GlobalWithBrowser {
  return globalThis as GlobalWithBrowser
}

/**
 * Check if code is running in browser environment
 */
export const isBrowser = (): boolean => typeof globalThis !== 'undefined' && 'window' in globalThis

/**
 * Safely get window object (returns undefined in SSR)
 */
export const getWindow = (): BrowserWindow | undefined => {
  if (isBrowser()) {
    return getGlobal().window
  }
  return undefined
}

const timeoutIds: Record<number, ReturnType<typeof setTimeout> | undefined> = {}
export const delay = (fun: () => void, time: number = 333) => {
  const hash = hashCode(fun.toString())
  if (timeoutIds[hash]) clearTimeout(timeoutIds[hash])
  timeoutIds[hash] = setTimeout(() => {
    fun()
    timeoutIds[hash] = undefined
  }, time)
}
