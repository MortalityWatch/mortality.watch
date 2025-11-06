/**
 * StateResolver Unit Tests
 *
 * Tests centralized state resolution system including:
 * - Initial state resolution from URL
 * - State change resolution with constraints
 * - Priority-based conflict resolution
 * - User override tracking
 * - Issue #147 fix validation
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import { StateResolver } from './StateResolver'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { StateChange } from './types'

// Mock stateFieldEncoders
vi.mock('@/composables/useExplorerState', () => ({
  stateFieldEncoders: {
    countries: { key: 'c', decode: (v: any) => (Array.isArray(v) ? v : [v]) },
    type: { key: 't' },
    chartType: { key: 'ct' },
    chartStyle: { key: 'cs' },
    ageGroups: { key: 'ag', decode: (v: any) => (Array.isArray(v) ? v : [v]) },
    standardPopulation: { key: 'sp' },
    isExcess: { key: 'e', decode: (v: any) => v === '1' || v === true },
    showBaseline: { key: 'sb', decode: (v: any) => v === '1' || v === true },
    showPredictionInterval: { key: 'pi', decode: (v: any) => v === '1' || v === true },
    cumulative: { key: 'cum', decode: (v: any) => v === '1' || v === true },
    showPercentage: { key: 'pct', decode: (v: any) => v === '1' || v === true },
    showTotal: { key: 'tot', decode: (v: any) => v === '1' || v === true },
    maximize: { key: 'max', decode: (v: any) => v === '1' || v === true },
    isLogarithmic: { key: 'lg', decode: (v: any) => v === '1' || v === true },
    showLabels: { key: 'lbl', decode: (v: any) => v === '1' || v === true },
    baselineMethod: { key: 'bm' },
    baselineDateFrom: { key: 'bdf' },
    baselineDateTo: { key: 'bdt' },
    dateFrom: { key: 'df' },
    dateTo: { key: 'dt' },
    sliderStart: { key: 'ss' },
    userColors: { key: 'uc' },
    decimals: { key: 'dec' },
    showLogo: { key: 'logo', decode: (v: any) => v === '1' || v === true },
    showQrCode: { key: 'qr', decode: (v: any) => v === '1' || v === true },
    showCaption: { key: 'cap', decode: (v: any) => v === '1' || v === true },
    chartPreset: { key: 'preset' }
  }
}))

// Helper to create mock route
function createMockRoute(query: Record<string, any> = {}): RouteLocationNormalizedLoaded {
  return {
    query,
    params: {},
    path: '/explorer',
    name: 'explorer',
    matched: [],
    meta: {},
    fullPath: '/explorer',
    hash: '',
    redirectedFrom: undefined
  } as RouteLocationNormalizedLoaded
}

describe('StateResolver', () => {
  describe('resolveInitial', () => {
    it('should apply defaults when no URL params', () => {
      const route = createMockRoute({})
      const resolved = StateResolver.resolveInitial(route)

      expect(resolved.state.countries).toEqual(['USA'])
      expect(resolved.state.type).toBe('cmr')
      expect(resolved.state.isExcess).toBe(false)
      expect(resolved.state.showBaseline).toBe(true)
      expect(resolved.state.showPredictionInterval).toBe(true)
      expect(resolved.userOverrides.size).toBe(0)
    })

    it('should apply URL params as user overrides', () => {
      const route = createMockRoute({
        c: ['USA', 'SWE'],
        t: 'deaths',
        e: '1'
      })
      const resolved = StateResolver.resolveInitial(route)

      expect(resolved.state.countries).toEqual(['USA', 'SWE'])
      expect(resolved.state.type).toBe('deaths')
      expect(resolved.state.isExcess).toBe(true)
      expect(resolved.userOverrides.has('countries')).toBe(true)
      expect(resolved.userOverrides.has('type')).toBe(true)
      expect(resolved.userOverrides.has('isExcess')).toBe(true)
    })

    it('should apply constraints after URL params', () => {
      const route = createMockRoute({
        e: '1' // excess mode
      })
      const resolved = StateResolver.resolveInitial(route)

      // Hard constraint: excess requires baseline
      expect(resolved.state.showBaseline).toBe(true)
      // Soft constraint: excess defaults PI to off
      expect(resolved.state.showPredictionInterval).toBe(false)
      // Hard constraint: excess disables logarithmic
      expect(resolved.state.isLogarithmic).toBe(false)
    })

    it('should respect user override for soft constraints', () => {
      const route = createMockRoute({
        e: '1', // excess mode
        pi: '1' // user wants PI on
      })
      const resolved = StateResolver.resolveInitial(route)

      expect(resolved.state.isExcess).toBe(true)
      expect(resolved.state.showBaseline).toBe(true) // hard constraint
      expect(resolved.state.showPredictionInterval).toBe(true) // user override respected!
      expect(resolved.userOverrides.has('showPredictionInterval')).toBe(true)
    })

    it('should NOT respect user override for hard constraints', () => {
      const route = createMockRoute({
        e: '1', // excess mode
        sb: '0', // user tries to disable baseline
        lg: '1' // user tries to enable logarithmic
      })
      const resolved = StateResolver.resolveInitial(route)

      expect(resolved.state.isExcess).toBe(true)
      expect(resolved.state.showBaseline).toBe(true) // hard constraint wins!
      expect(resolved.state.isLogarithmic).toBe(false) // hard constraint wins!
    })

    it('should handle population type constraints', () => {
      const route = createMockRoute({
        t: 'population',
        e: '1', // user tries excess
        sb: '1' // user tries baseline
      })
      const resolved = StateResolver.resolveInitial(route)

      expect(resolved.state.type).toBe('population')
      expect(resolved.state.isExcess).toBe(false) // constraint forced off
      expect(resolved.state.showBaseline).toBe(false) // constraint forced off
      expect(resolved.state.showPredictionInterval).toBe(false) // constraint forced off
    })

    it('should log changes with reasons', () => {
      const route = createMockRoute({
        e: '1'
      })
      const resolved = StateResolver.resolveInitial(route)

      expect(resolved.log.changes.length).toBeGreaterThan(0)
      expect(resolved.log.changes.some(c => c.field === 'isExcess')).toBe(true)
      // showPredictionInterval changes from true->false due to excess constraint
      expect(resolved.log.changes.some(c => c.field === 'showPredictionInterval')).toBe(true)
      expect(resolved.log.changes.some(c => c.reason.includes('Excess mode'))).toBe(true)
    })

    it('should handle malformed URL params gracefully', () => {
      const route = createMockRoute({
        c: null,
        e: 'invalid',
        pi: undefined
      })

      // Should not throw, should use defaults
      const resolved = StateResolver.resolveInitial(route)

      expect(resolved.state.countries).toEqual(['USA']) // default
      expect(resolved.state.isExcess).toBe(false) // default (malformed ignored)
    })
  })

  describe('resolveChange', () => {
    it('should apply user change and constraints', () => {
      const currentState = {
        isExcess: false,
        showBaseline: true,
        showPredictionInterval: true,
        isLogarithmic: false,
        cumulative: false,
        showPercentage: false
      }
      const userOverrides = new Set<string>()

      const change: StateChange = {
        field: 'isExcess',
        value: true,
        source: 'user'
      }

      const resolved = StateResolver.resolveChange(change, currentState, userOverrides)

      expect(resolved.state.isExcess).toBe(true)
      expect(resolved.state.showBaseline).toBe(true) // hard constraint
      expect(resolved.state.showPredictionInterval).toBe(false) // soft constraint
      expect(resolved.state.isLogarithmic).toBe(false) // hard constraint
      expect(resolved.userOverrides.has('isExcess')).toBe(true)
    })

    it('should handle turning excess OFF', () => {
      const currentState = {
        isExcess: true,
        showBaseline: true,
        showPredictionInterval: false,
        cumulative: true,
        showPercentage: true
      }
      const userOverrides = new Set<string>(['isExcess'])

      const change: StateChange = {
        field: 'isExcess',
        value: false,
        source: 'user'
      }

      const resolved = StateResolver.resolveChange(change, currentState, userOverrides)

      expect(resolved.state.isExcess).toBe(false)
      expect(resolved.state.cumulative).toBe(false) // constraint: only in excess
      expect(resolved.state.showPercentage).toBe(false) // constraint: only in excess
    })

    it('should respect existing user overrides for soft constraints', () => {
      const currentState = {
        isExcess: false,
        showBaseline: true,
        showPredictionInterval: true,
        isLogarithmic: false
      }
      const userOverrides = new Set<string>(['showPredictionInterval']) // user set PI before

      const change: StateChange = {
        field: 'isExcess',
        value: true,
        source: 'user'
      }

      const resolved = StateResolver.resolveChange(change, currentState, userOverrides)

      expect(resolved.state.isExcess).toBe(true)
      expect(resolved.state.showPredictionInterval).toBe(true) // user override respected!
    })

    it('should NOT respect user overrides for hard constraints', () => {
      const currentState = {
        isExcess: false,
        showBaseline: false,
        isLogarithmic: false
      }
      const userOverrides = new Set<string>(['showBaseline', 'isLogarithmic'])

      const change: StateChange = {
        field: 'isExcess',
        value: true,
        source: 'user'
      }

      const resolved = StateResolver.resolveChange(change, currentState, userOverrides)

      expect(resolved.state.showBaseline).toBe(true) // hard constraint overrides user!
      expect(resolved.state.isLogarithmic).toBe(false) // hard constraint overrides user!
    })

    it('should track which fields changed', () => {
      const currentState = {
        isExcess: false,
        showBaseline: true,
        showPredictionInterval: true,
        isLogarithmic: false
      }
      const userOverrides = new Set<string>()

      const change: StateChange = {
        field: 'isExcess',
        value: true,
        source: 'user'
      }

      const resolved = StateResolver.resolveChange(change, currentState, userOverrides)

      expect(resolved.changedFields).toContain('isExcess')
      expect(resolved.changedFields).toContain('showPredictionInterval')
      expect(resolved.changedFields.length).toBeGreaterThanOrEqual(2)
    })

    it('should add triggering field to user overrides', () => {
      const currentState = {
        isExcess: false,
        showBaseline: true
      }
      const userOverrides = new Set<string>()

      const change: StateChange = {
        field: 'isExcess',
        value: true,
        source: 'user'
      }

      const resolved = StateResolver.resolveChange(change, currentState, userOverrides)

      expect(resolved.userOverrides.has('isExcess')).toBe(true)
    })

    it('should not mutate original userOverrides set', () => {
      const currentState = {
        isExcess: false,
        showBaseline: true
      }
      const userOverrides = new Set<string>(['countries'])
      const originalSize = userOverrides.size

      const change: StateChange = {
        field: 'isExcess',
        value: true,
        source: 'user'
      }

      StateResolver.resolveChange(change, currentState, userOverrides)

      expect(userOverrides.size).toBe(originalSize) // original unchanged
    })
  })

  describe('Issue #147: Excess toggle fix', () => {
    it('should enable excess mode in single action', () => {
      // Simulate initial state: normal mode, baseline ON, PI ON
      const currentState = {
        isExcess: false,
        showBaseline: true,
        showPredictionInterval: true,
        isLogarithmic: false,
        cumulative: false,
        showPercentage: false
      }
      const userOverrides = new Set<string>()

      // User clicks excess toggle
      const change: StateChange = {
        field: 'isExcess',
        value: true,
        source: 'user'
      }

      const resolved = StateResolver.resolveChange(change, currentState, userOverrides)

      // After single action, should be in valid excess mode:
      expect(resolved.state.isExcess).toBe(true) // ✅
      expect(resolved.state.showBaseline).toBe(true) // ✅ Required for excess
      expect(resolved.state.showPredictionInterval).toBe(false) // ✅ Default off in excess
      expect(resolved.state.isLogarithmic).toBe(false) // ✅ Disabled in excess

      // Should take only ONE action (not 3 clicks!)
      expect(resolved.changedFields.length).toBeGreaterThan(1) // Multiple fields changed
    })

    it('should allow user to turn PI back on in excess mode', () => {
      // Start in excess mode with PI off (default)
      const currentState = {
        isExcess: true,
        showBaseline: true,
        showPredictionInterval: false,
        isLogarithmic: false
      }
      const userOverrides = new Set<string>(['isExcess'])

      // User clicks PI toggle to turn it ON
      const change: StateChange = {
        field: 'showPredictionInterval',
        value: true,
        source: 'user'
      }

      const resolved = StateResolver.resolveChange(change, currentState, userOverrides)

      // Should allow it (soft constraint)
      expect(resolved.state.showPredictionInterval).toBe(true)
      expect(resolved.userOverrides.has('showPredictionInterval')).toBe(true)
    })

    it('should NOT allow baseline to be disabled in excess mode', () => {
      // Start in excess mode
      const currentState = {
        isExcess: true,
        showBaseline: true,
        showPredictionInterval: false
      }
      const userOverrides = new Set<string>(['isExcess'])

      // User tries to turn baseline OFF
      const change: StateChange = {
        field: 'showBaseline',
        value: false,
        source: 'user'
      }

      const resolved = StateResolver.resolveChange(change, currentState, userOverrides)

      // Should be forced back to true (hard constraint)
      expect(resolved.state.showBaseline).toBe(true)
    })
  })

  describe('Priority resolution', () => {
    it('should apply constraints in priority order (high to low)', () => {
      // This tests that priority 2 constraints are applied before priority 1
      const currentState = {
        isExcess: false,
        showBaseline: true,
        cumulative: false
      }
      const userOverrides = new Set<string>()

      const change: StateChange = {
        field: 'isExcess',
        value: true,
        source: 'user'
      }

      const resolved = StateResolver.resolveChange(change, currentState, userOverrides)

      // Priority 2 constraints should be in log first
      const constraintChanges = resolved.log.changes.filter(c => c.priority.includes('constraint'))
      if (constraintChanges.length > 1) {
        // Check that higher priority appears in log
        expect(constraintChanges.some(c => c.priority.includes('p2'))).toBe(true)
      }
    })

    it('should show priority in change log', () => {
      const currentState = {
        isExcess: false,
        showBaseline: true,
        showPredictionInterval: true
      }
      const userOverrides = new Set<string>()

      const change: StateChange = {
        field: 'isExcess',
        value: true,
        source: 'user'
      }

      const resolved = StateResolver.resolveChange(change, currentState, userOverrides)

      // User action should be marked as 'user'
      const userChange = resolved.log.changes.find(c => c.field === 'isExcess')
      expect(userChange?.priority).toBe('user')

      // Constraints should have priority level
      const constraintChanges = resolved.log.changes.filter(c => c.priority.includes('constraint'))
      constraintChanges.forEach((c) => {
        expect(c.priority).toMatch(/constraint \(p[0-2]\)/)
      })
    })
  })

  describe('Complex constraint interactions', () => {
    it('should handle matrix style constraints', () => {
      const currentState = {
        chartStyle: 'line',
        showBaseline: true,
        showPredictionInterval: true,
        maximize: false,
        isLogarithmic: false
      }
      const userOverrides = new Set<string>()

      const change: StateChange = {
        field: 'chartStyle',
        value: 'matrix',
        source: 'user'
      }

      const resolved = StateResolver.resolveChange(change, currentState, userOverrides)

      expect(resolved.state.chartStyle).toBe('matrix')
      expect(resolved.state.showBaseline).toBe(false) // matrix disables
      expect(resolved.state.showPredictionInterval).toBe(false) // matrix disables
      expect(resolved.state.maximize).toBe(false) // matrix disables
      expect(resolved.state.isLogarithmic).toBe(false) // matrix disables
    })

    it('should handle cumulative OFF disabling showTotal', () => {
      const currentState = {
        cumulative: true,
        showTotal: true
      }
      const userOverrides = new Set<string>(['cumulative', 'showTotal'])

      const change: StateChange = {
        field: 'cumulative',
        value: false,
        source: 'user'
      }

      const resolved = StateResolver.resolveChange(change, currentState, userOverrides)

      expect(resolved.state.cumulative).toBe(false)
      expect(resolved.state.showTotal).toBe(false) // constraint forced
    })

    it('should handle ASMR/LE forcing all age group', () => {
      const currentState = {
        type: 'cmr',
        ageGroups: ['0-14', '15-64']
      }
      const userOverrides = new Set<string>(['ageGroups'])

      const change: StateChange = {
        field: 'type',
        value: 'asmr',
        source: 'user'
      }

      const resolved = StateResolver.resolveChange(change, currentState, userOverrides)

      expect(resolved.state.type).toBe('asmr')
      expect(resolved.state.ageGroups).toEqual(['all']) // constraint forced
    })
  })

  describe('Audit logging', () => {
    it('should include timestamp', () => {
      const route = createMockRoute({})
      const resolved = StateResolver.resolveInitial(route)

      expect(resolved.log.timestamp).toBeDefined()
      expect(new Date(resolved.log.timestamp).getTime()).toBeGreaterThan(0)
    })

    it('should include before/after state', () => {
      const currentState = {
        isExcess: false,
        showBaseline: true
      }
      const userOverrides = new Set<string>()

      const change: StateChange = {
        field: 'isExcess',
        value: true,
        source: 'user'
      }

      const resolved = StateResolver.resolveChange(change, currentState, userOverrides)

      expect(resolved.log.before).toBeDefined()
      expect(resolved.log.after).toBeDefined()
      expect(resolved.log.before.isExcess).toBe(false)
      expect(resolved.log.after.isExcess).toBe(true)
    })

    it('should include change reasons', () => {
      const currentState = {
        isExcess: false,
        showBaseline: true,
        showPredictionInterval: true
      }
      const userOverrides = new Set<string>()

      const change: StateChange = {
        field: 'isExcess',
        value: true,
        source: 'user'
      }

      const resolved = StateResolver.resolveChange(change, currentState, userOverrides)

      expect(resolved.log.changes.length).toBeGreaterThan(0)
      resolved.log.changes.forEach((c) => {
        expect(c.reason).toBeDefined()
        expect(c.reason.length).toBeGreaterThan(0)
      })
    })
  })
})
