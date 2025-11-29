/**
 * StateResolver Constraints Tests
 *
 * Tests constraint definitions and business rules.
 * Verifies that constraints apply correctly in different scenarios.
 */

import { describe, it, expect } from 'vitest'
import {
  STATE_CONSTRAINTS,
  FIELD_UPDATE_STRATEGY,
  getFieldUpdateType,
  requiresDataDownload,
  requiresDatasetUpdate,
  requiresFilterUpdate
} from './constraints'
import { VIEWS } from './views'

// Single source of truth for defaults is VIEWS.mortality.defaults
const DEFAULT_VALUES = VIEWS.mortality.defaults

describe('StateResolver Constraints', () => {
  describe('DEFAULT_VALUES (via VIEWS.mortality.defaults)', () => {
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
      expect(DEFAULT_VALUES).toHaveProperty('showLogarithmic')
      expect(DEFAULT_VALUES).toHaveProperty('showLabels')
      // NOTE: isExcess removed - view is determined by URL params, not stored in defaults
      expect(DEFAULT_VALUES).toHaveProperty('baselineMethod')
    })

    it('should have sensible defaults (single source of truth in views.ts)', () => {
      expect(DEFAULT_VALUES.countries).toEqual(['USA', 'SWE'])
      expect(DEFAULT_VALUES.type).toBe('asmr')
      expect(DEFAULT_VALUES.chartType).toBe('fluseason')
      expect(DEFAULT_VALUES.chartStyle).toBe('line')
      expect(DEFAULT_VALUES.ageGroups).toEqual(['all'])
      expect(DEFAULT_VALUES.standardPopulation).toBe('who')
      expect(DEFAULT_VALUES.showPredictionInterval).toBe(true)
      expect(DEFAULT_VALUES.showBaseline).toBe(true)
      expect(DEFAULT_VALUES.cumulative).toBe(false)
      expect(DEFAULT_VALUES.showPercentage).toBe(false)
      expect(DEFAULT_VALUES.showTotal).toBe(false)
      expect(DEFAULT_VALUES.maximize).toBe(false)
      expect(DEFAULT_VALUES.showLogarithmic).toBe(false)
      expect(DEFAULT_VALUES.showLabels).toBe(true)
      expect(DEFAULT_VALUES.sliderStart).toBe('2010')
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

  // NOTE: Excess Mode Constraints tests removed
  // Excess is now a view type (not a state field)
  // Excess-related constraints are tested in app/lib/state/viewConstraints.test.ts

  describe('Baseline Off Constraints', () => {
    it('should disable PI when baseline is off', () => {
      const state = { showBaseline: false }
      const constraint = STATE_CONSTRAINTS.find(
        c => c.when(state) && c.apply.showPredictionInterval === false
      )

      expect(constraint).toBeDefined()
      expect(constraint?.apply.showPredictionInterval).toBe(false)
      expect(constraint?.allowUserOverride).toBe(false)
    })

    // NOTE: Test for "PI when baseline off but excess on" removed
    // Excess view has its own constraints that override baseline requirements
    // These are tested in viewConstraints.test.ts
  })

  describe('Population Type Constraints', () => {
    // NOTE: Test for "disable excess for population type" removed
    // Population incompatibility with excess is handled by view.compatibleMetrics

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
        c => c.when(state) && c.apply.showLogarithmic === false
      )

      expect(constraint).toBeDefined()
      expect(constraint?.apply.showLogarithmic).toBe(false)
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

    // NOTE: Test for priority 0 (soft defaults) removed
    // All priority 0 constraints were excess-related and moved to view system
    // If we add new priority 0 constraints in the future, they should allow user override

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

  // NOTE: Complex Scenarios tests for excess constraints removed
  // These were testing how excess constraints interact with other constraints
  // Excess is now a view type with view-specific constraints tested in viewConstraints.test.ts
})

describe('Field Update Strategy', () => {
  describe('FIELD_UPDATE_STRATEGY', () => {
    it('should classify download fields correctly', () => {
      expect(FIELD_UPDATE_STRATEGY.countries).toBe('download')
      expect(FIELD_UPDATE_STRATEGY.type).toBe('download')
      expect(FIELD_UPDATE_STRATEGY.chartType).toBe('download')
      expect(FIELD_UPDATE_STRATEGY.ageGroups).toBe('download')
    })

    it('should classify update fields correctly', () => {
      expect(FIELD_UPDATE_STRATEGY.baselineMethod).toBe('update')
      expect(FIELD_UPDATE_STRATEGY.standardPopulation).toBe('update')
      expect(FIELD_UPDATE_STRATEGY.baselineDateFrom).toBe('update')
      expect(FIELD_UPDATE_STRATEGY.baselineDateTo).toBe('update')
      expect(FIELD_UPDATE_STRATEGY.sliderStart).toBe('update')
    })

    it('should classify filter fields correctly', () => {
      expect(FIELD_UPDATE_STRATEGY.dateFrom).toBe('filter')
      expect(FIELD_UPDATE_STRATEGY.dateTo).toBe('filter')
      expect(FIELD_UPDATE_STRATEGY.chartStyle).toBe('filter')
      expect(FIELD_UPDATE_STRATEGY.view).toBe('filter')
      expect(FIELD_UPDATE_STRATEGY.isExcess).toBe('filter')
      expect(FIELD_UPDATE_STRATEGY.showBaseline).toBe('filter')
      expect(FIELD_UPDATE_STRATEGY.cumulative).toBe('filter')
    })

    it('should classify none fields correctly', () => {
      expect(FIELD_UPDATE_STRATEGY.showLabels).toBe('none')
      expect(FIELD_UPDATE_STRATEGY.maximize).toBe('none')
      expect(FIELD_UPDATE_STRATEGY.showLogarithmic).toBe('none')
      expect(FIELD_UPDATE_STRATEGY.showLogo).toBe('none')
    })
  })

  describe('getFieldUpdateType', () => {
    it('should handle underscore-prefixed keys', () => {
      expect(getFieldUpdateType('_countries')).toBe('download')
      expect(getFieldUpdateType('_type')).toBe('download')
      expect(getFieldUpdateType('_chartStyle')).toBe('filter')
      expect(getFieldUpdateType('_showLabels')).toBe('none')
    })

    it('should handle dateRange special case', () => {
      expect(getFieldUpdateType('dateRange')).toBe('filter')
    })

    it('should return none for unknown fields', () => {
      expect(getFieldUpdateType('unknownField')).toBe('none')
    })

    describe('cumulative conditional logic', () => {
      it('should return filter when baselineMethod is auto', () => {
        const state = { baselineMethod: 'auto' }
        expect(getFieldUpdateType('cumulative', state)).toBe('filter')
      })

      it('should return update when baselineMethod is not auto', () => {
        const state = { baselineMethod: 'mean' }
        expect(getFieldUpdateType('cumulative', state)).toBe('update')
      })

      it('should return filter when no state is provided', () => {
        expect(getFieldUpdateType('cumulative')).toBe('filter')
      })

      it('should handle underscore prefix for cumulative', () => {
        const state = { baselineMethod: 'mean' }
        expect(getFieldUpdateType('_cumulative', state)).toBe('update')
      })
    })
  })

  describe('requiresDataDownload', () => {
    it('should return true for download fields', () => {
      expect(requiresDataDownload('countries')).toBe(true)
      expect(requiresDataDownload('_type')).toBe(true)
    })

    it('should return false for non-download fields', () => {
      expect(requiresDataDownload('dateFrom')).toBe(false)
      expect(requiresDataDownload('showLabels')).toBe(false)
    })
  })

  describe('requiresDatasetUpdate', () => {
    it('should return true for update fields', () => {
      expect(requiresDatasetUpdate('baselineMethod')).toBe(true)
      expect(requiresDatasetUpdate('_standardPopulation')).toBe(true)
    })

    it('should return false for non-update fields', () => {
      expect(requiresDatasetUpdate('countries')).toBe(false)
      expect(requiresDatasetUpdate('dateFrom')).toBe(false)
    })

    it('should handle cumulative conditional', () => {
      expect(requiresDatasetUpdate('cumulative', { baselineMethod: 'auto' })).toBe(false)
      expect(requiresDatasetUpdate('cumulative', { baselineMethod: 'mean' })).toBe(true)
    })
  })

  describe('requiresFilterUpdate', () => {
    it('should return true for download fields', () => {
      expect(requiresFilterUpdate('countries')).toBe(true)
    })

    it('should return true for update fields', () => {
      expect(requiresFilterUpdate('baselineMethod')).toBe(true)
    })

    it('should return true for filter fields', () => {
      expect(requiresFilterUpdate('dateFrom')).toBe(true)
      expect(requiresFilterUpdate('chartStyle')).toBe(true)
    })

    it('should return false for none fields', () => {
      expect(requiresFilterUpdate('showLabels')).toBe(false)
      expect(requiresFilterUpdate('maximize')).toBe(false)
    })
  })
})
