/**
 * Ranking Constraints Tests
 *
 * Tests for ranking state constraint definitions.
 */

import { describe, it, expect } from 'vitest'
import { RANKING_CONSTRAINTS } from './constraints'

describe('RANKING_CONSTRAINTS', () => {
  describe('absolute mode constraint', () => {
    const absoluteConstraint = RANKING_CONSTRAINTS.find(c =>
      c.reason.includes('baseline')
    )!

    it('exists', () => {
      expect(absoluteConstraint).toBeDefined()
    })

    it('applies when view is absolute', () => {
      expect(absoluteConstraint.when({ view: 'absolute' })).toBe(true)
    })

    it('does not apply when view is relative', () => {
      expect(absoluteConstraint.when({ view: 'relative' })).toBe(false)
    })

    it('forces showPercentage and showPI to false', () => {
      expect(absoluteConstraint.apply.showPercentage).toBe(false)
      expect(absoluteConstraint.apply.showPI).toBe(false)
    })

    it('is a hard constraint (cannot be overridden)', () => {
      expect(absoluteConstraint.allowUserOverride).toBe(false)
    })

    it('has priority 2 (highest)', () => {
      expect(absoluteConstraint.priority).toBe(2)
    })
  })

  describe('totalsOnly constraint', () => {
    const totalsOnlyConstraint = RANKING_CONSTRAINTS.find(c =>
      c.reason.includes('totals only requires')
    )!

    it('exists', () => {
      expect(totalsOnlyConstraint).toBeDefined()
    })

    it('applies when showTotals is false', () => {
      expect(totalsOnlyConstraint.when({ showTotals: false })).toBe(true)
    })

    it('does not apply when showTotals is true', () => {
      expect(totalsOnlyConstraint.when({ showTotals: true })).toBe(false)
    })

    it('forces showTotalsOnly to false', () => {
      expect(totalsOnlyConstraint.apply.showTotalsOnly).toBe(false)
    })
  })

  describe('PI cumulative constraint', () => {
    const piCumulativeConstraint = RANKING_CONSTRAINTS.find(c =>
      c.reason.includes('cumulative mode')
    )!

    it('exists', () => {
      expect(piCumulativeConstraint).toBeDefined()
    })

    it('applies when cumulative is true', () => {
      expect(piCumulativeConstraint.when({ cumulative: true })).toBe(true)
    })

    it('does not apply when cumulative is false', () => {
      expect(piCumulativeConstraint.when({ cumulative: false })).toBe(false)
    })

    it('forces showPI to false', () => {
      expect(piCumulativeConstraint.apply.showPI).toBe(false)
    })
  })

  describe('PI totalsOnly constraint', () => {
    const piTotalsOnlyConstraint = RANKING_CONSTRAINTS.find(c =>
      c.reason.includes('totals-only mode')
    )!

    it('exists', () => {
      expect(piTotalsOnlyConstraint).toBeDefined()
    })

    it('applies when showTotalsOnly is true', () => {
      expect(piTotalsOnlyConstraint.when({ showTotalsOnly: true })).toBe(true)
    })

    it('does not apply when showTotalsOnly is false', () => {
      expect(piTotalsOnlyConstraint.when({ showTotalsOnly: false })).toBe(false)
    })

    it('forces showPI to false', () => {
      expect(piTotalsOnlyConstraint.apply.showPI).toBe(false)
    })
  })

  describe('constraint priorities', () => {
    it('has a range of priorities including priority 2', () => {
      const priorities = RANKING_CONSTRAINTS.map(c => c.priority ?? 1)

      // The constraints array should have a range of priorities
      expect(Math.max(...priorities)).toBeGreaterThanOrEqual(2)
      expect(Math.min(...priorities)).toBeGreaterThanOrEqual(1)
    })
  })
})
