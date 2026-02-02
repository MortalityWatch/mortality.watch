import { inflateSync } from 'zlib'
import { defineEventHandler, getQuery, sendRedirect, getRequestURL } from 'h3'

/**
 * Middleware to handle legacy QR codes from the old site.
 *
 * Old QR codes contain a `qr` parameter with deflate-compressed, base64-encoded JSON state.
 * This middleware decompresses the state and redirects to /explorer with the proper parameters.
 *
 * Example old URL: https://mortality.watch/?qr=eJwlyKsKgEAURdF...
 * Decompresses to: {"c":["FRA","BEL"],"e":1,"df":"2020","ce":1,"st":1,"pi":0,"p":1}
 * Redirects to: /explorer?c=FRA&c=BEL&e=1&df=2020&ce=1&st=1&pi=0&p=1
 */
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  // Only handle root path or /explorer requests with a qr parameter
  if (url.pathname !== '/' && url.pathname !== '/explorer') {
    return
  }

  const query = getQuery(event)
  const qrParam = query.qr

  // Check if this is a legacy compressed QR code (not a simple 0/1 toggle)
  if (typeof qrParam !== 'string' || qrParam === '0' || qrParam === '1') {
    return
  }

  // Must be a longer base64-encoded compressed string
  if (qrParam.length < 10) {
    return
  }

  try {
    // Decode base64 and decompress
    const decoded = Buffer.from(qrParam, 'base64')
    const decompressed = inflateSync(decoded)
    const stateJson = decompressed.toString('utf-8')
    const state = JSON.parse(stateJson)

    // Build query string from decompressed state
    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(state)) {
      if (Array.isArray(value)) {
        // Handle array values (e.g., c=FRA&c=BEL)
        for (const item of value) {
          params.append(key, String(item))
        }
      }
      else if (value !== null && value !== undefined) {
        params.append(key, String(value))
      }
    }

    const redirectUrl = `/explorer?${params.toString()}`

    return sendRedirect(event, redirectUrl, 301)
  }
  catch {
    // If decompression fails, it's not a legacy QR code - continue normally
    return
  }
})
