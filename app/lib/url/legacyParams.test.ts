import { describe, it, expect } from 'vitest'
import {
  LEGACY_PARAM_MAPPINGS,
  migrateLegacyParams,
  migrateLegacyQuery,
  hasLegacyParams
} from './legacyParams'

describe('legacyParams', () => {
  describe('LEGACY_PARAM_MAPPINGS', () => {
    it('maps bdf to bf (baseline date from)', () => {
      expect(LEGACY_PARAM_MAPPINGS.bdf).toBe('bf')
    })

    it('maps bdt to bt (baseline date to)', () => {
      expect(LEGACY_PARAM_MAPPINGS.bdt).toBe('bt')
    })

    it('maps cum to ce (cumulative)', () => {
      expect(LEGACY_PARAM_MAPPINGS.cum).toBe('ce')
    })

    it('maps pct to p (show percentage)', () => {
      expect(LEGACY_PARAM_MAPPINGS.pct).toBe('p')
    })
  })

  describe('migrateLegacyParams', () => {
    it('returns empty string for empty input', () => {
      expect(migrateLegacyParams('')).toBe('')
    })

    it('returns original string if no legacy params', () => {
      const input = 'c=USA&t=asmr&ct=yearly'
      expect(migrateLegacyParams(input)).toBe(input)
    })

    it('migrates bdf to bf', () => {
      const input = 'c=USA&bdf=2015'
      const output = migrateLegacyParams(input)
      expect(output).toContain('bf=2015')
      expect(output).not.toContain('bdf=')
    })

    it('migrates bdt to bt', () => {
      const input = 'c=USA&bdt=2019'
      const output = migrateLegacyParams(input)
      expect(output).toContain('bt=2019')
      expect(output).not.toContain('bdt=')
    })

    it('migrates cum to ce', () => {
      const input = 'e=1&cum=1'
      const output = migrateLegacyParams(input)
      expect(output).toContain('ce=1')
      expect(output).not.toContain('cum=')
    })

    it('migrates pct to p', () => {
      const input = 'e=1&pct=1'
      const output = migrateLegacyParams(input)
      expect(output).toContain('p=1')
      expect(output).not.toContain('pct=')
    })

    it('migrates multiple legacy params at once', () => {
      const input = 'c=USA&bdf=2015&bdt=2019&cum=1&pct=1'
      const output = migrateLegacyParams(input)
      expect(output).toContain('bf=2015')
      expect(output).toContain('bt=2019')
      expect(output).toContain('ce=1')
      expect(output).toContain('p=1')
      expect(output).toContain('c=USA')
      expect(output).not.toContain('bdf=')
      expect(output).not.toContain('bdt=')
      expect(output).not.toContain('cum=')
      expect(output).not.toContain('pct=')
    })

    it('preserves current params when legacy and current both exist', () => {
      // If both old (bdf) and new (bf) are present, prefer the new one
      const input = 'bf=2020&bdf=2015'
      const output = migrateLegacyParams(input)
      expect(output).toContain('bf=2020')
      expect(output).not.toContain('bdf=')
    })

    it('preserves non-legacy params unchanged', () => {
      const input = 'c=USA,SWE&t=asmr&ct=yearly&bdf=2015'
      const output = migrateLegacyParams(input)
      expect(output).toContain('c=USA%2CSWE')
      expect(output).toContain('t=asmr')
      expect(output).toContain('ct=yearly')
    })
  })

  describe('migrateLegacyQuery', () => {
    it('returns original query if no legacy params', () => {
      const input = { c: 'USA', t: 'asmr' }
      expect(migrateLegacyQuery(input)).toBe(input)
    })

    it('migrates legacy params in query object', () => {
      const input = { c: 'USA', bdf: '2015', bdt: '2019' }
      const output = migrateLegacyQuery(input)
      expect(output.bf).toBe('2015')
      expect(output.bt).toBe('2019')
      expect(output.c).toBe('USA')
      expect(output.bdf).toBeUndefined()
      expect(output.bdt).toBeUndefined()
    })

    it('preserves current params when both exist', () => {
      const input = { bf: '2020', bdf: '2015' }
      const output = migrateLegacyQuery(input)
      expect(output.bf).toBe('2020')
      expect(output.bdf).toBeUndefined()
    })

    it('handles undefined values', () => {
      const input = { c: 'USA', bdf: undefined }
      const output = migrateLegacyQuery(input)
      expect(output.c).toBe('USA')
      expect(output.bdf).toBeUndefined()
      expect(output.bf).toBeUndefined()
    })
  })

  describe('hasLegacyParams', () => {
    it('returns false for empty string', () => {
      expect(hasLegacyParams('')).toBe(false)
    })

    it('returns false when no legacy params present', () => {
      expect(hasLegacyParams('c=USA&t=asmr')).toBe(false)
    })

    it('returns true when bdf is present', () => {
      expect(hasLegacyParams('c=USA&bdf=2015')).toBe(true)
    })

    it('returns true when bdt is present', () => {
      expect(hasLegacyParams('c=USA&bdt=2019')).toBe(true)
    })

    it('returns true when cum is present', () => {
      expect(hasLegacyParams('e=1&cum=1')).toBe(true)
    })

    it('returns true when pct is present', () => {
      expect(hasLegacyParams('e=1&pct=1')).toBe(true)
    })
  })
})
