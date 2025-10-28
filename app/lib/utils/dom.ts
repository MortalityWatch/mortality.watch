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

/**
 * Display a base64 URL inside an iframe in another window.
 */
export const openNewWindowWithBase64Url = (base64: string) => {
  const win = getGlobal().window
  if (!win) throw new Error('Window not available')
  const newWin = win.open()
  if (!newWin) throw new Error('Cannot open new window')
  newWin.document.write(
    '<iframe src="'
    + base64
    + '" frameborder="0" style="border:0; '
    + 'top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" '
    + 'allowfullscreen></iframe>'
  )
}

export const appearanceChanged = (cb: () => void) => {
  const win = getGlobal().window
  if (!win) return
  win.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', cb)
}

const timeoutIds: Record<number, ReturnType<typeof setTimeout> | undefined> = {}
export const delay = (fun: () => void, time: number = 333) => {
  const hash = hashCode(fun.toString())
  if (timeoutIds[hash]) clearTimeout(timeoutIds[hash])
  timeoutIds[hash] = setTimeout(async () => {
    fun()
    timeoutIds[hashCode(fun.toString())] = undefined
  }, time)
}

export const removeMetaTag = (name: string) =>
  new Promise<void>((resolve) => {
    const doc = getGlobal().document
    if (!doc) {
      resolve()
      return
    }
    const tag = doc.querySelector(`meta[name="${name}"]`)
    if (tag) {
      tag.remove()
    }
    resolve()
  })
