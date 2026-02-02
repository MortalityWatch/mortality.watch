import { inflateSync } from 'zlib'

/**
 * Checks if a qr parameter value is a legacy compressed QR code.
 * Legacy QR codes are deflate-compressed, base64-encoded JSON strings.
 * Current QR codes use simple '0' or '1' toggle values.
 */
export function isLegacyCompressedQr(qrParam: unknown): qrParam is string {
  return typeof qrParam === 'string'
    && qrParam !== '0'
    && qrParam !== '1'
    && qrParam.length >= 10
}

/**
 * Decompresses a legacy QR code parameter and returns URL search params.
 *
 * Legacy QR codes contain deflate-compressed, base64-encoded JSON state.
 * Example: "eJwlyKsKgEAURdF..." decompresses to {"c":["FRA","BEL"],"e":1,...}
 *
 * @param qrParam - The compressed QR parameter value
 * @returns URLSearchParams with the decompressed state, or null if decompression fails
 */
export function decompressLegacyQr(qrParam: string): URLSearchParams | null {
  try {
    const decoded = Buffer.from(qrParam, 'base64')
    const decompressed = inflateSync(decoded)
    const stateJson = decompressed.toString('utf-8')
    const state = JSON.parse(stateJson)

    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(state)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          params.append(key, String(item))
        }
      }
      else if (value !== null && value !== undefined) {
        params.append(key, String(value))
      }
    }

    return params
  }
  catch {
    return null
  }
}
