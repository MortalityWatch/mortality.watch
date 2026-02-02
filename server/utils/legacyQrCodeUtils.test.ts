import { describe, it, expect } from 'vitest'
import { deflateSync } from 'zlib'
import { isLegacyCompressedQr, decompressLegacyQr } from './legacyQrCodeUtils'

function compressState(state: Record<string, unknown>): string {
  const json = JSON.stringify(state)
  const compressed = deflateSync(Buffer.from(json, 'utf-8'))
  return compressed.toString('base64')
}

describe('isLegacyCompressedQr', () => {
  it('should return false for simple toggle values', () => {
    expect(isLegacyCompressedQr('0')).toBe(false)
    expect(isLegacyCompressedQr('1')).toBe(false)
  })

  it('should return false for non-string values', () => {
    expect(isLegacyCompressedQr(null)).toBe(false)
    expect(isLegacyCompressedQr(undefined)).toBe(false)
    expect(isLegacyCompressedQr(123)).toBe(false)
  })

  it('should return false for short strings', () => {
    expect(isLegacyCompressedQr('abc')).toBe(false)
    expect(isLegacyCompressedQr('123456789')).toBe(false) // 9 chars
  })

  it('should return true for longer strings that could be compressed data', () => {
    expect(isLegacyCompressedQr('1234567890')).toBe(true) // 10 chars
    expect(isLegacyCompressedQr('eJwlyKsKgEAURdF')).toBe(true)
  })
})

describe('decompressLegacyQr', () => {
  it('should decompress a simple state object', () => {
    const state = { c: ['FRA'], e: 1 }
    const compressed = compressState(state)

    const params = decompressLegacyQr(compressed)

    expect(params).not.toBeNull()
    expect(params!.get('c')).toBe('FRA')
    expect(params!.get('e')).toBe('1')
  })

  it('should handle multiple countries as separate params', () => {
    const state = { c: ['FRA', 'BEL', 'NLD'] }
    const compressed = compressState(state)

    const params = decompressLegacyQr(compressed)

    expect(params).not.toBeNull()
    expect(params!.getAll('c')).toEqual(['FRA', 'BEL', 'NLD'])
  })

  it('should decompress the real example from old site', () => {
    // This is the actual compressed value from the user's example
    const realCompressed = 'eJwlyKsKgEAURdF/2fmEGeNtPkYMg0EcEMTkA2yCNvHfBU0L1s2MjdRdjihCRLSxQpRNQFQhIfLUI2IamMSKebFsGJnLHGL+67w+jh1z4sD88wL94hWw'

    const params = decompressLegacyQr(realCompressed)

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

    const params = decompressLegacyQr(compressed)

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
    const params = decompressLegacyQr('not-valid-base64-compressed')
    expect(params).toBeNull()
  })

  it('should return null for short invalid strings', () => {
    expect(decompressLegacyQr('0')).toBeNull()
    expect(decompressLegacyQr('1')).toBeNull()
  })
})
