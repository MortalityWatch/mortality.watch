import { describe, it, expect } from 'vitest'
import { deflateSync } from 'zlib'

/**
 * Tests for the legacy QR code decompression logic.
 * The middleware handles deflate-compressed, base64-encoded JSON from old QR codes.
 */

function compressState(state: Record<string, unknown>): string {
  const json = JSON.stringify(state)
  const compressed = deflateSync(Buffer.from(json, 'utf-8'))
  return compressed.toString('base64')
}

function decompressAndBuildParams(qrParam: string): URLSearchParams | null {
  try {
    const decoded = Buffer.from(qrParam, 'base64')
    const { inflateSync } = require('zlib')
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

describe('legacy QR code decompression', () => {
  it('should decompress a simple state object', () => {
    const state = { c: ['FRA'], e: 1 }
    const compressed = compressState(state)

    const params = decompressAndBuildParams(compressed)

    expect(params).not.toBeNull()
    expect(params!.get('c')).toBe('FRA')
    expect(params!.get('e')).toBe('1')
  })

  it('should handle multiple countries as separate params', () => {
    const state = { c: ['FRA', 'BEL', 'NLD'] }
    const compressed = compressState(state)

    const params = decompressAndBuildParams(compressed)

    expect(params).not.toBeNull()
    expect(params!.getAll('c')).toEqual(['FRA', 'BEL', 'NLD'])
  })

  it('should decompress the real example from old site', () => {
    // This is the actual compressed value from the user's example
    const realCompressed = 'eJwlyKsKgEAURdF/2fmEGeNtPkYMg0EcEMTkA2yCNvHfBU0L1s2MjdRdjihCRLSxQpRNQFQhIfLUI2IamMSKebFsGJnLHGL+67w+jh1z4sD88wL94hWw'

    const params = decompressAndBuildParams(realCompressed)

    expect(params).not.toBeNull()
    expect(params!.getAll('c')).toEqual(['FRA', 'BEL', 'NLD', 'CHE', 'DEU', 'AUT', 'LUX'])
    expect(params!.get('e')).toBe('1')
    expect(params!.get('df')).toBe('2020')
    expect(params!.get('ce')).toBe('1')
    expect(params!.get('st')).toBe('1')
    expect(params!.get('pi')).toBe('0')
    expect(params!.get('p')).toBe('1')
  })

  it('should handle all state properties', () => {
    const state = {
      c: ['USA', 'GBR'],
      e: 1,
      df: '2019',
      dt: '2023',
      ct: 'yearly',
      ce: 1,
      st: 0,
      pi: 1,
      p: 0,
      bf: '2015',
      bt: '2019'
    }
    const compressed = compressState(state)

    const params = decompressAndBuildParams(compressed)

    expect(params).not.toBeNull()
    expect(params!.getAll('c')).toEqual(['USA', 'GBR'])
    expect(params!.get('e')).toBe('1')
    expect(params!.get('df')).toBe('2019')
    expect(params!.get('dt')).toBe('2023')
    expect(params!.get('ct')).toBe('yearly')
    expect(params!.get('ce')).toBe('1')
    expect(params!.get('st')).toBe('0')
    expect(params!.get('pi')).toBe('1')
    expect(params!.get('p')).toBe('0')
    expect(params!.get('bf')).toBe('2015')
    expect(params!.get('bt')).toBe('2019')
  })

  it('should return null for invalid compressed data', () => {
    const params = decompressAndBuildParams('not-valid-base64-compressed')
    expect(params).toBeNull()
  })

  it('should return null for simple toggle values', () => {
    // These are not legacy compressed values, they're the current qr toggle
    const params0 = decompressAndBuildParams('0')
    const params1 = decompressAndBuildParams('1')

    // Short strings that aren't valid compressed data should fail
    expect(params0).toBeNull()
    expect(params1).toBeNull()
  })
})
