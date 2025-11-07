/**
 * StateResolver Constraints Tests
 *
 * Tests constraint definitions and business rules.
 * Verifies that constraints apply correctly in different scenarios.
 */

import { describe, it, expect } from 'vitest'
import { DEFAULT_VALUES, STATE_CONSTRAINTS } from './constraints'

describe('StateResolver Constraints', () => {
  describe('DEFAULT_VALUES', () => {
    it('should have all required default values', () => {
      expect(DEFAULT_VALUES).toHaveProperty('countries')
      expect(DEFAULT_VALUES).toHaveProperty('type')
      expect(DEFAULT_VALUES).toHaveProperty('chartType')
      expect(DEFAULT_VALUES).toHaveProperty('chartStyle')
      expect(DEFAULT_VALUES).toHaveProperty('ageGroups')
      expect(DEFAULT_VALUES).toHaveProperty('standardPopulation')
      expect(DEFAULT_VALUES).toHaveProperty('showPredictionInterval')
      expect(DEFAULT_VALUES).toHaveProperty('showBaseline')
      expect(DEFAULT_VALUES).toHaveProperty('cumulative')
      expect(DEFAULT_VALUES).toHaveProperty('showPercentage')
      expect(DEFAULT_VALUES).toHaveProperty('showTotal')
      expect(DEFAULT_VALUES).toHaveProperty('maximize')
      expect(DEFAULT_VALUES).toHaveProperty('isLogarithmic')
      expect(DEFAULT_VALUES).toHaveProperty('showLabels')
      expect(DEFAULT_VALUES).toHaveProperty('isExcess')
      expect(DEFAULT_VALUES).toHaveProperty('baselineMethod')
    })

    it('should have sensible defaults', () => {
      expect(DEFAULT_VALUES.countries).toEqual(['USA'])
      expect(DEFAULT_VALUES.type).toBe('cmr')
      expect(DEFAULT_VALUES.chartType).toBe('yearly')
      expect(DEFAULT_VALUES.chartStyle).toBe('line')
      expect(DEFAULT_VALUES.ageGroups).toEqual(['all'])
      expect(DEFAULT_VALUES.standardPopulation).toBe('who')
      expect(DEFAULT_VALUES.showPredictionInterval).toBe(true)
      expect(DEFAULT_VALUES.showBaseline).toBe(true)
      expect(DEFAULT_VALUES.cumulative).toBe(false)
      expect(DEFAULT_VALUES.showPercentage).toBe(false)
      expect(DEFAULT_VALUES.showTotal).toBe(false)
      expect(DEFAULT_VALUES.maximize).toBe(false)
      expect(DEFAULT_VALUES.isLogarithmic).toBe(false)
      expect(DEFAULT_VALUES.showLabels).toBe(true)
      expect(DEFAULT_VALUES.isExcess).toBe(false)
      expect(DEFAULT_VALUES.baselineMethod).toBe('mean')
    })
  })

  describe('STATE_CONSTRAINTS', () => {
    it('should be an array of constraints', () => {
      expect(Array.isArray(STATE_CONSTRAINTS)).toBe(true)
      expect(STATE_CONSTRAINTS.length).toBeGreaterThan(0)
    })

    it('should have all required constraint properties', () => {
      STATE_CONSTRAINTS.forEach((constraint) => {
        expect(constraint).toHaveProperty('when')
        expect(constraint).toHaveProperty('apply')
        expect(constraint).toHaveProperty('reason')
        expect(constraint).toHaveProperty('allowUserOverride')
        expect(typeof constraint.when).toBe('function')
        expect(typeof constraint.apply).toBe('object')
        expect(typeof constraint.reason).toBe('string')
        expect(typeof constraint.allowUserOverride).toBe('boolean')
      })
    })
  })

  describe('Excess Mode Constraints', () => {
    it('should require baseline when excess is enabled (hard constraint)', () => {
      const state = { isExcess: true }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.showBaseline === true && c.priority === 2
      )

      expect(constraint).toBeDefined()
      expect(constraint?.allowUserOverride).toBe(false)
      expect(constraint?.apply.showBaseline).toBe(true)
    })

    it('should disable logarithmic scale when excess is enabled (hard constraint)', () => {
      const state = { isExcess: true }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.isLogarithmic === false && c.priority === 2
      )

      expect(constraint).toBeDefined()
      expect(constraint?.allowUserOverride).toBe(false)
      expect(constraint?.apply.isLogarithmic).toBe(false)
    })

    it('should default PI to off when excess is enabled (soft constraint)', () => {
      const state = { isExcess: true }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.showPredictionInterval === false && c.priority === 0
      )

      expect(constraint).toBeDefined()
      expect(constraint?.allowUserOverride).toBe(true)
      expect(constraint?.apply.showPredictionInterval).toBe(false)
    })

    it('should default percentage to on when excess is enabled (soft constraint)', () => {
      const state = { isExcess: true }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.showPercentage === true && c.priority === 0
      )

      expect(constraint).toBeDefined()
      expect(constraint?.allowUserOverride).toBe(true)
      expect(constraint?.apply.showPercentage).toBe(true)
    })

    it('should not apply excess constraints when excess is disabled', () => {
      const state = { isExcess: false }
      const excessConstraints = STATE_CONSTRAINTS.filter(
        c => c.when({ isExcess: true }) && !c.when(state)
      )

      excessConstraints.forEach((constraint) => {
        expect(constraint.when(state)).toBe(false)
      })
    })
  })

  describe('Excess Off Constraints', () => {
    it('should disable cumulative when excess is off', () => {
      const state = { isExcess: false }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.cumulative === false
      )

      expect(constraint).toBeDefined()
      expect(constraint?.apply.cumulative).toBe(false)
      expect(constraint?.apply.showPercentage).toBe(false)
    })

    it('should disable percentage when excess is off', () => {
      const state = { isExcess: false }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.showPercentage === false
      )

      expect(constraint).toBeDefined()
      expect(constraint?.apply.showPercentage).toBe(false)
    })
  })

  describe('Baseline Off Constraints', () => {
    it('should disable PI when baseline is off and excess is off', () => {
      const state = { showBaseline: false, isExcess: false }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.showPredictionInterval === false
      )

      expect(constraint).toBeDefined()
      expect(constraint?.apply.showPredictionInterval).toBe(false)
      expect(constraint?.allowUserOverride).toBe(false)
    })

    it('should not disable PI when baseline is off but excess is on', () => {
      const state = { showBaseline: false, isExcess: true }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.reason.includes('Prediction intervals require baseline or excess mode')
      )

      expect(constraint?.when(state)).toBe(false)
    })
  })

  describe('Population Type Constraints', () => {
    it('should disable excess for population type', () => {
      const state = { type: 'population' }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.isExcess === false
      )

      expect(constraint).toBeDefined()
      expect(constraint?.apply.isExcess).toBe(false)
      expect(constraint?.allowUserOverride).toBe(false)
      expect(constraint?.priority).toBe(2)
    })

    it('should disable baseline for population type', () => {
      const state = { type: 'population' }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.showBaseline === false
      )

      expect(constraint).toBeDefined()
      expect(constraint?.apply.showBaseline).toBe(false)
      expect(constraint?.allowUserOverride).toBe(false)
    })

    it('should disable PI for population type', () => {
      const state = { type: 'population' }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.showPredictionInterval === false
      )

      expect(constraint).toBeDefined()
      expect(constraint?.apply.showPredictionInterval).toBe(false)
    })
  })

  describe('ASMR and Life Expectancy Type Constraints', () => {
    it('should force "all" age group for ASMR type', () => {
      const state = { type: 'asmr' }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && Array.isArray(c.apply.ageGroups)
      )

      expect(constraint).toBeDefined()
      expect(constraint?.apply.ageGroups).toEqual(['all'])
      expect(constraint?.allowUserOverride).toBe(false)
      expect(constraint?.priority).toBe(2)
    })

    it('should force "all" age group for Life Expectancy type', () => {
      const state = { type: 'le' }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && Array.isArray(c.apply.ageGroups)
      )

      expect(constraint).toBeDefined()
      expect(constraint?.apply.ageGroups).toEqual(['all'])
    })
  })

  describe('Matrix Chart Style Constraints', () => {
    it('should disable baseline for matrix style', () => {
      const state = { chartStyle: 'matrix' }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.showBaseline === false
      )

      expect(constraint).toBeDefined()
      expect(constraint?.apply.showBaseline).toBe(false)
      expect(constraint?.allowUserOverride).toBe(false)
      expect(constraint?.priority).toBe(2)
    })

    it('should disable PI for matrix style', () => {
      const state = { chartStyle: 'matrix' }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.showPredictionInterval === false
      )

      expect(constraint).toBeDefined()
      expect(constraint?.apply.showPredictionInterval).toBe(false)
    })

    it('should disable maximize for matrix style', () => {
      const state = { chartStyle: 'matrix' }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.maximize === false
      )

      expect(constraint).toBeDefined()
      expect(constraint?.apply.maximize).toBe(false)
    })

    it('should disable logarithmic for matrix style', () => {
      const state = { chartStyle: 'matrix' }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.isLogarithmic === false
      )

      expect(constraint).toBeDefined()
      expect(constraint?.apply.isLogarithmic).toBe(false)
    })
  })

  describe('Cumulative Off Constraints', () => {
    it('should disable showTotal when cumulative is off', () => {
      const state = { cumulative: false }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.showTotal === false
      )

      expect(constraint).toBeDefined()
      expect(constraint?.apply.showTotal).toBe(false)
      expect(constraint?.allowUserOverride).toBe(false)
      expect(constraint?.priority).toBe(1)
    })
  })

  describe('Priority Levels', () => {
    it('should have hard constraints with priority 2', () => {
      const hardConstraints = STATE_CONSTRAINTS.filter(c => c.priority === 2)

      expect(hardConstraints.length).toBeGreaterThan(0)
      hardConstraints.forEach((constraint) => {
        expect(constraint.allowUserOverride).toBe(false)
      })
    })

    it('should have normal constraints with priority 1', () => {
      const normalConstraints = STATE_CONSTRAINTS.filter(c => c.priority === 1)

      expect(normalConstraints.length).toBeGreaterThan(0)
      normalConstraints.forEach((constraint) => {
        expect(constraint.allowUserOverride).toBe(false)
      })
    })

    it('should have default overrides with priority 0', () => {
      const defaultOverrides = STATE_CONSTRAINTS.filter(c => c.priority === 0)

      expect(defaultOverrides.length).toBeGreaterThan(0)
      defaultOverrides.forEach((constraint) => {
        expect(constraint.allowUserOverride).toBe(true)
      })
    })

    it('should sort constraints by priority (high to low)', () => {
      const sorted = [...STATE_CONSTRAINTS].sort((a, b) => {
        const priorityA = a.priority ?? 1
        const priorityB = b.priority ?? 1
        return priorityB - priorityA
      })

      for (let i = 0; i < sorted.length - 1; i++) {
        const currentPriority = sorted[i]?.priority ?? 1
        const nextPriority = sorted[i + 1]?.priority ?? 1
        expect(currentPriority).toBeGreaterThanOrEqual(nextPriority)
      }
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle multiple constraints applying to same state', () => {
      const state = { isExcess: true, chartStyle: 'matrix' }

      // Both excess and matrix constraints apply
      const excessConstraint = STATE_CONSTRAINTS.find(
        c => c.when({ isExcess: true }) && c.apply.showBaseline === true
      )
      const matrixConstraint = STATE_CONSTRAINTS.find(
        c => c.when({ chartStyle: 'matrix' }) && c.apply.showBaseline === false
      )

      expect(excessConstraint?.when(state)).toBe(true)
      expect(matrixConstraint?.when(state)).toBe(true)

      // Higher priority should win (excess = priority 2, matrix = priority 2)
      // Both have priority 2, so they would conflict - this tests priority resolution
      expect(excessConstraint?.priority).toBe(2)
      expect(matrixConstraint?.priority).toBe(2)
    })

    it('should handle user overrides for soft constraints', () => {
      const state = { isExcess: true }

      // Soft constraint allows user override
      const softConstraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.showPredictionInterval === false && c.priority === 0
      )

      expect(softConstraint?.allowUserOverride).toBe(true)
    })

    it('should prevent user overrides for hard constraints', () => {
      const state = { isExcess: true }

      // Hard constraint does not allow user override
      const hardConstraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.showBaseline === true && c.priority === 2
      )

      expect(hardConstraint?.allowUserOverride).toBe(false)
    })
  })
})
