import { defineEventHandler, getQuery, sendRedirect, getRequestURL } from 'h3'
import { isLegacyCompressedQr, decompressLegacyQr } from '../utils/legacyQrCodeUtils'

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
export default defineEventHandler((event) => {
  const url = getRequestURL(event)

  // Only handle root path or /explorer requests with a qr parameter
  if (url.pathname !== '/' && url.pathname !== '/explorer') {
    return
  }

  const query = getQuery(event)
  const qrParam = query.qr

  if (!isLegacyCompressedQr(qrParam)) {
    return
  }

  const params = decompressLegacyQr(qrParam)
  if (!params) {
    // Decompression failed - not a valid legacy QR code, continue normally
    return
  }

  const redirectUrl = `/explorer?${params.toString()}`
  return sendRedirect(event, redirectUrl, 301)
})
