/**
 * Browser/DOM utilities
 */

import { hashCode } from './strings'

/**
 * Check if code is running in browser environment
 */
export const isBrowser = (): boolean => typeof globalThis !== 'undefined' && 'window' in globalThis

/**
 * Safely get window object (returns undefined in SSR)
 */
export const getWindow = (): Window | undefined => {
  if (isBrowser()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (globalThis as any).window as Window
  }
  return undefined
}

/**
 * Display a base64 URL inside an iframe in another window.
 */
export const openNewWindowWithBase64Url = (base64: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (globalThis as any).window === 'undefined') throw new Error('Window not available')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = (globalThis as any).window.open()
  if (!win) throw new Error('Cannot open new window')
  win.document.write(
    '<iframe src="'
    + base64
    + '" frameborder="0" style="border:0; '
    + 'top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" '
    + 'allowfullscreen></iframe>'
  )
}

export const appearanceChanged = (cb: () => void) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (globalThis as any).window === 'undefined') return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).window
    .matchMedia('(prefers-color-scheme: dark)')
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (globalThis as any).document === 'undefined') {
      resolve()
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tag = (globalThis as any).document.querySelector(`meta[name="${name}"]`)
    if (tag) {
      tag.remove()
    }
    resolve()
  })
