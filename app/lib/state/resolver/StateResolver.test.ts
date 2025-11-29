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

// Mock stateFieldEncoders
vi.mock('@/composables/useExplorerState', () => ({
  stateFieldEncoders: {
    countries: { key: 'c', decode: (v: any) => (Array.isArray(v) ? v : [v]) },
    type: { key: 't' },
    chartType: { key: 'ct' },
    chartStyle: { key: 'cs' },
    ageGroups: { key: 'ag', decode: (v: any) => (Array.isArray(v) ? v : [v]) },
    standardPopulation: { key: 'sp' },
    // NOTE: isExcess removed - view is determined by URL params (e, zs), not part of state
    showBaseline: { key: 'sb', decode: (v: any) => v === '1' || v === true },
    showPredictionInterval: { key: 'pi', decode: (v: any) => v === '1' || v === true },
    cumulative: { key: 'cum', decode: (v: any) => v === '1' || v === true },
    showPercentage: { key: 'pct', decode: (v: any) => v === '1' || v === true },
    showTotal: { key: 'tot', decode: (v: any) => v === '1' || v === true },
    maximize: { key: 'max', decode: (v: any) => v === '1' || v === true },
    showLogarithmic: { key: 'lg', decode: (v: any) => v === '1' || v === true },
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

      // These should match Defaults in stateSerializer.ts (the single source of truth)
      expect(resolved.state.countries).toEqual(['USA', 'SWE'])
      expect(resolved.state.type).toBe('asmr')
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
      expect(resolved.userOverrides.has('countries')).toBe(true)
      expect(resolved.userOverrides.has('type')).toBe(true)
    })

    it('should apply constraints after URL params', () => {
      const route = createMockRoute({
        t: 'population' // population type
      })
      const resolved = StateResolver.resolveInitial(route)

      // Hard constraint: population disables baseline
      expect(resolved.state.showBaseline).toBe(false)
      // Hard constraint: population disables PI
      expect(resolved.state.showPredictionInterval).toBe(false)
    })

    it('should apply view defaults for excess view', () => {
      const route = createMockRoute({
        e: '1' // excess view
      })
      const resolved = StateResolver.resolveInitial(route)

      // View defaults from VIEWS.excess.defaults
      expect(resolved.state.view).toBe('excess')
      expect(resolved.state.chartStyle).toBe('bar') // excess default
      expect(resolved.state.showBaseline).toBe(true) // forced by constraint
      expect(resolved.state.showPercentage).toBe(true) // excess default
      expect(resolved.state.cumulative).toBe(false) // excess default
      expect(resolved.state.showLogarithmic).toBe(false) // excess default (forced)
    })

    it('should apply view defaults for zscore view', () => {
      const route = createMockRoute({
        zs: '1' // zscore view
      })
      const resolved = StateResolver.resolveInitial(route)

      // View defaults from VIEWS.zscore.defaults
      expect(resolved.state.view).toBe('zscore')
      expect(resolved.state.chartStyle).toBe('line') // zscore default
      expect(resolved.state.showBaseline).toBe(true) // forced by constraint
      expect(resolved.state.showPredictionInterval).toBe(false) // zscore default
      expect(resolved.state.showLogarithmic).toBe(false) // zscore default (forced)
    })

    it('should respect user overrides over view defaults', () => {
      const route = createMockRoute({
        e: '1', // excess view
        cs: 'line' // user explicitly sets line chart
      })
      const resolved = StateResolver.resolveInitial(route)

      // User override wins over view default
      expect(resolved.state.chartStyle).toBe('line') // user set, not 'bar'
      expect(resolved.userOverrides.has('chartStyle')).toBe(true)
    })

    it('should use view defaults without logging changes', () => {
      const route = createMockRoute({
        e: '1' // excess view
      })
      const resolved = StateResolver.resolveInitial(route)

      // View defaults are now the starting state - no "change" to log
      // chartStyle is 'bar' from the start for excess view
      expect(resolved.state.chartStyle).toBe('bar')
      // No chartStyle change is logged since it starts with the view default
      const chartStyleChange = resolved.log.changes.find(c => c.field === 'chartStyle')
      expect(chartStyleChange).toBeUndefined()
    })
  })

  describe('createSnapshot', () => {
    it('should create a complete snapshot from resolved state', () => {
      const resolvedState = {
        countries: ['USA', 'GBR'],
        type: 'deaths',
        chartType: 'fluseason',
        chartStyle: 'bar',
        view: 'excess',
        isExcess: true
      }

      const snapshot = StateResolver.createSnapshot(resolvedState)

      expect(snapshot.countries).toEqual(['USA', 'GBR'])
      expect(snapshot.type).toBe('deaths')
      expect(snapshot.chartType).toBe('fluseason')
      expect(snapshot.chartStyle).toBe('bar')
      expect(snapshot.view).toBe('excess')
      expect(snapshot.isExcess).toBe(true)
    })

    it('should use defaults for missing fields', () => {
      const resolvedState = {
        countries: ['USA']
      }

      const snapshot = StateResolver.createSnapshot(resolvedState)

      expect(snapshot.countries).toEqual(['USA'])
      // Default values should be used for missing fields
      expect(snapshot.type).toBe('asmr')
      expect(snapshot.chartStyle).toBe('line')
      expect(snapshot.view).toBe('mortality')
      expect(snapshot.isExcess).toBe(false)
      expect(snapshot.isZScore).toBe(false)
      expect(snapshot.showBaseline).toBe(true)
      expect(snapshot.showPredictionInterval).toBe(true)
    })

    it('should merge resolved state with current state', () => {
      const resolvedState = {
        countries: ['FRA'],
        type: 'deaths'
      }
      const currentState = {
        countries: ['USA'],
        type: 'asmr',
        chartType: 'year',
        chartStyle: 'matrix',
        showBaseline: false
      }

      const snapshot = StateResolver.createSnapshot(resolvedState, currentState)

      // Resolved state takes precedence
      expect(snapshot.countries).toEqual(['FRA'])
      expect(snapshot.type).toBe('deaths')
      // Current state used for missing resolved fields
      expect(snapshot.chartType).toBe('year')
      expect(snapshot.chartStyle).toBe('matrix')
      expect(snapshot.showBaseline).toBe(false)
    })

    it('should handle all ChartStateSnapshot fields', () => {
      const resolvedState = {
        countries: ['USA'],
        type: 'asmr',
        chartType: 'fluseason',
        chartStyle: 'line',
        ageGroups: ['all'],
        standardPopulation: 'who',
        view: 'mortality',
        isExcess: false,
        isZScore: false,
        dateFrom: '2020-01',
        dateTo: '2023-12',
        sliderStart: '2010',
        baselineDateFrom: '2015-01',
        baselineDateTo: '2019-12',
        showBaseline: true,
        baselineMethod: 'mean',
        cumulative: false,
        showTotal: false,
        maximize: false,
        showPredictionInterval: true,
        showLabels: true,
        showPercentage: false,
        showLogarithmic: false,
        userColors: ['#ff0000', '#00ff00'],
        decimals: 'auto'
      }

      const snapshot = StateResolver.createSnapshot(resolvedState)

      // All fields should be present
      expect(snapshot).toEqual(resolvedState)
    })

    it('should handle undefined date fields', () => {
      const resolvedState = {
        countries: ['USA'],
        dateFrom: undefined,
        dateTo: undefined,
        baselineDateFrom: undefined,
        baselineDateTo: undefined,
        userColors: undefined
      }

      const snapshot = StateResolver.createSnapshot(resolvedState)

      expect(snapshot.dateFrom).toBeUndefined()
      expect(snapshot.dateTo).toBeUndefined()
      expect(snapshot.baselineDateFrom).toBeUndefined()
      expect(snapshot.baselineDateTo).toBeUndefined()
      expect(snapshot.userColors).toBeUndefined()
    })
  })
})
