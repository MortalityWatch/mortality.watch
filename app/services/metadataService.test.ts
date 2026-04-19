/**
 * Tests for MetadataService — specifically the chart-type-aware
 * filtering that gates which age groups the Explorer selector exposes.
 *
 * Issue #518: USA weekly mortality was exposing age groups that only
 * existed for the monthly data source (e.g. 10-19), which then failed
 * to render because no weekly_10-19.csv file exists.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MetadataService } from './metadataService'

// Mirror of the real world_meta.csv for USA + a peer with different
// age-group sets per resolution. Parsed by load() via dataLoader.fetchMetadata()
// in production, but here we bypass by populating the private cache directly.
const WORLD_META_CSV = [
  'iso3c,jurisdiction,type,source,min_date,max_date,age_groups',
  // type 1 = yearly, type 2 = monthly, type 3 = weekly
  'USA,United States,1,un,1950-01-01,2023-01-01,"all"',
  'USA,United States,2,cdc,1999-01-01,2026-03-01,"0-9, 10-19, 20-29, 30-39, 40-49, 50-59, 60-69, 70-79, 80+, all"',
  'USA,United States,3,cdc,2015-01-05,2026-02-09,"0-24, 25-44, 45-64, 65-74, 75-84, 85+, all"',
  'USA,United States,3,mortality_org,2015-01-05,2026-01-26,"0-14, 15-64, 65-74, 75-84, 85+, all"',
  'USA,United States,3,world_mortality,2015-01-05,2024-12-23,"all"',
  'NLD,Netherlands,3,eurostat,2000-01-03,2025-12-31,"0-64, 65-74, 75-84, 85+, all"'
].join('\n')

describe('MetadataService', () => {
  let service: MetadataService

  beforeEach(async () => {
    service = new MetadataService()
    // Use the dataLoader via a stub — easier to just inject parsed metadata
    // by replicating the load logic inline.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(service as any).metadata = parseFixture(WORLD_META_CSV)
  })

  describe('getAvailableAgeGroups — chart-type gating (regression #518)', () => {
    it('returns only weekly-compatible age groups for USA weekly', () => {
      const result = service.getAvailableAgeGroups(['USA'], 'weekly')

      // Weekly sources (cdc + mortality_org + world_mortality) union
      expect(result).toEqual(expect.arrayContaining([
        '0-24', '25-44', '45-64', '65-74', '75-84', '85+',
        '0-14', '15-64',
        'all'
      ]))

      // Must NOT include monthly-only age groups (they have no weekly CSV)
      expect(result).not.toContain('0-9')
      expect(result).not.toContain('10-19')
      expect(result).not.toContain('20-29')
      expect(result).not.toContain('80+')
    })

    it('returns monthly age groups for USA monthly', () => {
      const result = service.getAvailableAgeGroups(['USA'], 'monthly')

      // Monthly can also aggregate from weekly (data-derivation rule in service)
      expect(result).toContain('0-9')
      expect(result).toContain('10-19')
      expect(result).toContain('80+')
      expect(result).toContain('all')
    })

    it('intersects across multiple countries (common age groups only)', () => {
      const result = service.getAvailableAgeGroups(['USA', 'NLD'], 'weekly')

      // Only age groups available for both countries
      expect(result).toContain('65-74')
      expect(result).toContain('75-84')
      expect(result).toContain('85+')
      expect(result).toContain('all')

      // USA-only age groups should be excluded
      expect(result).not.toContain('0-24')
      expect(result).not.toContain('25-44')
      expect(result).not.toContain('15-64')

      // NLD-only age group should be excluded
      expect(result).not.toContain('0-64')
    })
  })
})

// ---------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------

type MetadataEntry = {
  iso3c: string
  jurisdiction: string
  type: '1' | '2' | '3'
  source: string
  minDate: string
  maxDate: string
  ageGroups: string[]
}

function parseFixture(csv: string): MetadataEntry[] {
  const lines = csv.split('\n')
  const [header, ...rows] = lines
  const cols = header!.split(',')
  return rows.map((line) => {
    // Simple CSV parse — handle quoted commas only inside age_groups
    const fields: string[] = []
    let inQuote = false
    let cur = ''
    for (const ch of line) {
      if (ch === '"') {
        inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        fields.push(cur)
        cur = ''
      } else {
        cur += ch
      }
    }
    fields.push(cur)

    const obj: Record<string, string> = {}
    cols.forEach((c, i) => {
      obj[c] = fields[i] ?? ''
    })

    return {
      iso3c: obj.iso3c!,
      jurisdiction: obj.jurisdiction!,
      type: obj.type! as '1' | '2' | '3',
      source: obj.source!,
      minDate: obj.min_date!,
      maxDate: obj.max_date!,
      ageGroups: obj.age_groups!.split(',').map(s => s.trim())
    }
  })
}
