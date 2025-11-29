/**
 * View Constraints Unit Tests
 *
 * Tests constraint generation from view configurations
 */

import { describe, it, expect } from 'vitest'
import { getViewConstraints } from './viewConstraints'

describe('viewConstraints', () => {
  describe('getViewConstraints', () => {
    it('generates constraints for mortality view', () => {
      const constraints = getViewConstraints('mortality')
      expect(Array.isArray(constraints)).toBe(true)
    })

    it('generates hard constraint for required baseline in excess', () => {
      const constraints = getViewConstraints('excess')

      const baselineConstraint = constraints.find(c =>
        c.apply.showBaseline === true
      )

      expect(baselineConstraint).toBeDefined()
      expect(baselineConstraint?.priority).toBe(2) // Hard constraint
      expect(baselineConstraint?.allowUserOverride).toBe(false)
      expect(baselineConstraint?.reason.toLowerCase()).toContain('excess')
      expect(baselineConstraint?.reason.toLowerCase()).toContain('baseline')
    })

    it('generates hard constraint for disabled logarithmic in excess', () => {
      const constraints = getViewConstraints('excess')

      const logarithmicConstraint = constraints.find(c =>
        c.apply.showLogarithmic === false
      )

      expect(logarithmicConstraint).toBeDefined()
      expect(logarithmicConstraint?.priority).toBe(2)
      expect(logarithmicConstraint?.allowUserOverride).toBe(false)
    })

    it('includes view-specific constraints from config', () => {
      const constraints = getViewConstraints('excess')

      // Should include both generated constraints AND config.constraints
      expect(constraints.length).toBeGreaterThan(0)

      // Check for a constraint that disables showTotal when cumulative is false
      const totalConstraint = constraints.find(c =>
        c.apply.showTotal === false
        && typeof c.when === 'function'
      )
      expect(totalConstraint).toBeDefined()
    })

    it('generates baseline constraint for zscore view', () => {
      const constraints = getViewConstraints('zscore')

      const baselineConstraint = constraints.find(c =>
        c.apply.showBaseline === true
      )

      expect(baselineConstraint).toBeDefined()
      expect(baselineConstraint?.priority).toBe(2)
      expect(baselineConstraint?.allowUserOverride).toBe(false)
    })

    it('hard constraints have priority 2 and no user override', () => {
      const constraints = getViewConstraints('excess')

      // Find hard constraints (priority 2)
      const hardConstraints = constraints.filter(c => c.priority === 2)

      // Excess should have hard constraints (baseline, logarithmic)
      expect(hardConstraints.length).toBeGreaterThan(0)

      hardConstraints.forEach((constraint) => {
        expect(constraint.priority).toBe(2)
        expect(constraint.allowUserOverride).toBe(false)
      })
    })

    it('constraint when functions check for correct view', () => {
      const constraints = getViewConstraints('excess')

      // Constraints from view config should be included
      const baselineConstraint = constraints.find(c =>
        c.apply.showBaseline === true
      )

      expect(baselineConstraint).toBeDefined()

      // Test the when function - config constraints use when: () => true for view-specific
      // Since they're only included in that view's constraints
      expect(typeof baselineConstraint?.when).toBe('function')
    })
  })

  describe('constraint retrieval', () => {
    it('returns view-specific constraints from config', () => {
      const constraints = getViewConstraints('excess')

      // Excess view should have constraints defined in views.ts
      expect(constraints.length).toBeGreaterThan(0)

      // Should include baseline and logarithmic constraints
      const baselineConstraint = constraints.find(c => c.apply.showBaseline === true)
      const logarithmicConstraint = constraints.find(c => c.apply.showLogarithmic === false)

      expect(baselineConstraint).toBeDefined()
      expect(logarithmicConstraint).toBeDefined()
    })

    it('mortality view has minimal constraints', () => {
      const constraints = getViewConstraints('mortality')

      // Mortality should have constraint for baseline OFF -> PI OFF
      const piConstraint = constraints.find(c =>
        c.apply.showPredictionInterval === false
      )

      expect(piConstraint).toBeDefined()
    })

    it('zscore view has baseline and logarithmic constraints', () => {
      const constraints = getViewConstraints('zscore')

      // Z-score should require baseline
      const baselineConstraint = constraints.find(c =>
        c.apply.showBaseline === true
      )
      expect(baselineConstraint).toBeDefined()

      // Z-score should disable logarithmic
      const logConstraint = constraints.find(c =>
        c.apply.showLogarithmic === false
      )
      expect(logConstraint).toBeDefined()
    })
  })
})
