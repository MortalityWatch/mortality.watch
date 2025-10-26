import { describe, it, expect } from 'vitest'
import { getSourceDescription } from './utils'

describe('app/lib/data/utils', () => {
  describe('getSourceDescription', () => {
    it('should return UN description with link', () => {
      const result = getSourceDescription('un')
      expect(result).toContain('United Nations')
      expect(result).toContain('href="https://population.un.org')
      expect(result).toContain('target="_blank"')
    })

    it('should return World Mortality description with link', () => {
      const result = getSourceDescription('world_mortality')
      expect(result).toContain('World Mortality')
      expect(result).toContain('href="https://github.com/akarlinsky/world_mortality"')
    })

    it('should return HMD description with link', () => {
      const result = getSourceDescription('mortality_org')
      expect(result).toContain('Human Mortality Database')
      expect(result).toContain('href="https://mortality.org/Data/STMF"')
    })

    it('should return Eurostat description with link', () => {
      const result = getSourceDescription('eurostat')
      expect(result).toContain('Eurostat')
      expect(result).toContain('href="https://ec.europa.eu/eurostat')
    })

    it('should return CDC description with link', () => {
      const result = getSourceDescription('cdc')
      expect(result).toContain('CDC')
      expect(result).toContain('href="https://wonder.cdc.gov/mcd.html"')
    })

    it('should return Statistics Canada description with multiple links', () => {
      const result = getSourceDescription('statcan')
      expect(result).toContain('Statistics Canada')
      expect(result).toContain('href="https://www150.statcan.gc.ca')
      // Should have two links
      expect((result.match(/href=/g) || []).length).toBe(2)
    })

    it('should return Destatis description with multiple links', () => {
      const result = getSourceDescription('destatis')
      expect(result).toContain('Statistisches Bundesamt')
      expect(result).toContain('href="https://www.destatis.de')
      // Should have two links
      expect((result.match(/href=/g) || []).length).toBe(2)
    })

    it('should return "unknown" for unrecognized source', () => {
      expect(getSourceDescription('invalid_source')).toBe('unknown')
      expect(getSourceDescription('')).toBe('unknown')
      expect(getSourceDescription('random')).toBe('unknown')
    })

    it('should handle case sensitivity', () => {
      // Test that it's case-sensitive (as written)
      expect(getSourceDescription('UN')).toBe('unknown')
      expect(getSourceDescription('CDC')).toBe('unknown')
    })
  })
})
