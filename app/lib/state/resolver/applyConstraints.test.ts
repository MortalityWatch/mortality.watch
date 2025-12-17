import { describe, it, expect } from 'vitest'
import { applyConstraints } from './applyConstraints'

describe('applyConstraints', () => {
  describe('mortality view', () => {
    it('should not modify state without conflicting constraints', () => {
      const state = {
        view: 'mortality',
        showBaseline: true,
        showPredictionInterval: true,
        showLogarithmic: false
      }

      const result = applyConstraints(state, 'mortality')

      expect(result.showBaseline).toBe(true)
      expect(result.showPredictionInterval).toBe(true)
      expect(result.showLogarithmic).toBe(false)
    })

    it('should enforce PI=false when baseline is off', () => {
      const state = {
        view: 'mortality',
        showBaseline: false,
        showPredictionInterval: true // should be forced off
      }

      const result = applyConstraints(state, 'mortality')

      expect(result.showBaseline).toBe(false)
      expect(result.showPredictionInterval).toBe(false)
    })
  })

  describe('excess view', () => {
    it('should force showBaseline=true', () => {
      const state = {
        view: 'excess',
        showBaseline: false // should be forced on
      }

      const result = applyConstraints(state, 'excess')

      expect(result.showBaseline).toBe(true)
    })

    it('should force showLogarithmic=false', () => {
      const state = {
        view: 'excess',
        showLogarithmic: true // should be forced off
      }

      const result = applyConstraints(state, 'excess')

      expect(result.showLogarithmic).toBe(false)
    })

    it('should force showTotal=false when cumulative=false', () => {
      const state = {
        view: 'excess',
        cumulative: false,
        showTotal: true // should be forced off
      }

      const result = applyConstraints(state, 'excess')

      expect(result.showTotal).toBe(false)
    })

    it('should allow showTotal=true when cumulative=true', () => {
      const state = {
        view: 'excess',
        cumulative: true,
        showTotal: true
      }

      const result = applyConstraints(state, 'excess')

      expect(result.showTotal).toBe(true)
    })
  })

  describe('zscore view', () => {
    it('should force showBaseline=true', () => {
      const state = {
        view: 'zscore',
        showBaseline: false // should be forced on
      }

      const result = applyConstraints(state, 'zscore')

      expect(result.showBaseline).toBe(true)
    })

    it('should force showLogarithmic=false', () => {
      const state = {
        view: 'zscore',
        showLogarithmic: true // should be forced off
      }

      const result = applyConstraints(state, 'zscore')

      expect(result.showLogarithmic).toBe(false)
    })

    it('should force cumulative=false and showPercentage=false', () => {
      const state = {
        view: 'zscore',
        cumulative: true, // should be forced off
        showPercentage: true // should be forced off
      }

      const result = applyConstraints(state, 'zscore')

      expect(result.cumulative).toBe(false)
      expect(result.showPercentage).toBe(false)
    })
  })

  describe('population type constraints', () => {
    it('should force showBaseline=false for population type', () => {
      const state = {
        view: 'mortality',
        type: 'population',
        showBaseline: true // should be forced off
      }

      const result = applyConstraints(state, 'mortality')

      expect(result.showBaseline).toBe(false)
    })

    it('should force showPredictionInterval=false for population type', () => {
      const state = {
        view: 'mortality',
        type: 'population',
        showPredictionInterval: true // should be forced off
      }

      const result = applyConstraints(state, 'mortality')

      expect(result.showPredictionInterval).toBe(false)
    })
  })

  describe('matrix style constraints', () => {
    it('should force showBaseline=false for matrix style', () => {
      const state = {
        view: 'mortality',
        chartStyle: 'matrix',
        showBaseline: true // should be forced off
      }

      const result = applyConstraints(state, 'mortality')

      expect(result.showBaseline).toBe(false)
    })

    it('should force showPredictionInterval=false for matrix style', () => {
      const state = {
        view: 'mortality',
        chartStyle: 'matrix',
        showPredictionInterval: true // should be forced off
      }

      const result = applyConstraints(state, 'mortality')

      expect(result.showPredictionInterval).toBe(false)
    })

    it('should force showLogarithmic=false for matrix style', () => {
      const state = {
        view: 'mortality',
        chartStyle: 'matrix',
        showLogarithmic: true // should be forced off
      }

      const result = applyConstraints(state, 'mortality')

      expect(result.showLogarithmic).toBe(false)
    })

    it('should force maximize=false for matrix style', () => {
      const state = {
        view: 'mortality',
        chartStyle: 'matrix',
        maximize: true // should be forced off
      }

      const result = applyConstraints(state, 'mortality')

      expect(result.maximize).toBe(false)
    })
  })

  describe('ASMR type constraints', () => {
    it('should force ageGroups=["all"] for asmr type', () => {
      const state = {
        view: 'mortality',
        type: 'asmr',
        ageGroups: ['0-14', '15-64'] // should be forced to ['all']
      }

      const result = applyConstraints(state, 'mortality')

      expect(result.ageGroups).toEqual(['all'])
    })

    it('should NOT force ageGroups for le type (Pro feature gated in UI)', () => {
      const state = {
        view: 'mortality',
        type: 'le',
        ageGroups: ['65-74', '75+'] // should NOT be forced - LE single age groups is a Pro feature
      }

      const result = applyConstraints(state, 'mortality')

      // LE age group selection is now a Pro feature gated in the UI,
      // not enforced by constraints - age groups should remain unchanged
      expect(result.ageGroups).toEqual(['65-74', '75+'])
    })
  })

  describe('view sync constraints', () => {
    it('should set isExcess=true and isZScore=false for excess view', () => {
      const state = {
        view: 'excess',
        isExcess: false,
        isZScore: true
      }

      const result = applyConstraints(state, 'excess')

      expect(result.isExcess).toBe(true)
      expect(result.isZScore).toBe(false)
    })

    it('should set isExcess=false and isZScore=true for zscore view', () => {
      const state = {
        view: 'zscore',
        isExcess: true,
        isZScore: false
      }

      const result = applyConstraints(state, 'zscore')

      expect(result.isExcess).toBe(false)
      expect(result.isZScore).toBe(true)
    })

    it('should set isExcess=false and isZScore=false for mortality view', () => {
      const state = {
        view: 'mortality',
        isExcess: true,
        isZScore: true
      }

      const result = applyConstraints(state, 'mortality')

      expect(result.isExcess).toBe(false)
      expect(result.isZScore).toBe(false)
    })
  })

  describe('constraint priority', () => {
    it('should apply higher priority constraints first', () => {
      // Population type (priority 2) should override baseline even if user tried to set it
      const state = {
        view: 'mortality',
        type: 'population',
        showBaseline: true
      }

      const result = applyConstraints(state, 'mortality')

      // Priority 2 constraint should win
      expect(result.showBaseline).toBe(false)
    })
  })
})
