/**
 * View Detector Unit Tests
 *
 * Tests URL parameter detection and view type determination
 */

import { describe, it, expect } from 'vitest'
import { detectView } from './viewDetector'

describe('viewDetector', () => {
  describe('basic detection', () => {
    it('detects zscore view from zs=1', () => {
      expect(detectView({ zs: '1' })).toBe('zscore')
    })

    it('detects excess view from e=1', () => {
      expect(detectView({ e: '1' })).toBe('excess')
    })

    it('detects mortality view as default (no params)', () => {
      expect(detectView({})).toBe('mortality')
    })

    it('detects mortality view when other params present but no view params', () => {
      expect(detectView({ c: 'USA', t: 'cmr' })).toBe('mortality')
    })
  })

  describe('precedence rules', () => {
    it('zscore takes precedence over excess', () => {
      expect(detectView({ zs: '1', e: '1' })).toBe('zscore')
    })

    it('zscore takes precedence over explicit view param', () => {
      expect(detectView({ zs: '1', view: 'excess' })).toBe('zscore')
    })

    it('excess takes precedence over explicit view param', () => {
      expect(detectView({ e: '1', view: 'mortality' })).toBe('excess')
    })

    it('explicit view param works when no shorthand present', () => {
      expect(detectView({ view: 'excess' })).toBe('excess')
      expect(detectView({ view: 'zscore' })).toBe('zscore')
      expect(detectView({ view: 'mortality' })).toBe('mortality')
    })
  })

  describe('invalid inputs', () => {
    it('ignores invalid view parameter', () => {
      expect(detectView({ view: 'invalid' })).toBe('mortality')
    })

    it('ignores zs with non-1 value', () => {
      expect(detectView({ zs: '0' })).toBe('mortality')
      expect(detectView({ zs: 'true' })).toBe('mortality')
    })

    it('ignores e with non-1 value', () => {
      expect(detectView({ e: '0' })).toBe('mortality')
      expect(detectView({ e: 'false' })).toBe('mortality')
    })

    it('handles null/undefined params gracefully', () => {
      expect(detectView({ zs: null })).toBe('mortality')
      expect(detectView({ e: undefined })).toBe('mortality')
    })
  })

  describe('backward compatibility', () => {
    it('detects excess from old isExcess=true param', () => {
      expect(detectView({ isExcess: 'true' })).toBe('excess')
    })

    it('e=1 takes precedence over isExcess=true', () => {
      expect(detectView({ e: '1', isExcess: 'true' })).toBe('excess')
    })
  })
})
