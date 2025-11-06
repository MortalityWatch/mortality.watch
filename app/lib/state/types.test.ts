/**
 * StateResolver Type Tests
 *
 * Tests type definitions for the StateResolver system.
 * These tests verify type safety and interface contracts.
 */

import { describe, it, expect } from 'vitest'
import type {
  StateChange,
  StateFieldMetadata,
  ResolvedState,
  StateResolutionLog,
  StateConstraint
} from './types'

describe('StateResolver Types', () => {
  describe('StateChange', () => {
    it('should accept valid state change objects', () => {
      const change: StateChange = {
        field: 'isExcess',
        value: true,
        source: 'user'
      }

      expect(change.field).toBe('isExcess')
      expect(change.value).toBe(true)
      expect(change.source).toBe('user')
    })

    it('should accept all valid source types', () => {
      const userChange: StateChange = {
        field: 'test',
        value: 'value',
        source: 'user'
      }

      const urlChange: StateChange = {
        field: 'test',
        value: 'value',
        source: 'url'
      }

      const defaultChange: StateChange = {
        field: 'test',
        value: 'value',
        source: 'default'
      }

      expect(userChange.source).toBe('user')
      expect(urlChange.source).toBe('url')
      expect(defaultChange.source).toBe('default')
    })

    it('should accept any value type', () => {
      const stringChange: StateChange = {
        field: 'test',
        value: 'string',
        source: 'user'
      }

      const booleanChange: StateChange = {
        field: 'test',
        value: true,
        source: 'user'
      }

      const arrayChange: StateChange = {
        field: 'test',
        value: ['a', 'b'],
        source: 'user'
      }

      const undefinedChange: StateChange = {
        field: 'test',
        value: undefined,
        source: 'user'
      }

      expect(stringChange.value).toBe('string')
      expect(booleanChange.value).toBe(true)
      expect(arrayChange.value).toEqual(['a', 'b'])
      expect(undefinedChange.value).toBeUndefined()
    })
  })

  describe('StateFieldMetadata', () => {
    it('should accept valid metadata objects', () => {
      const metadata: StateFieldMetadata = {
        value: true,
        priority: 'user',
        reason: 'User clicked toggle',
        changed: true,
        urlKey: 'e'
      }

      expect(metadata.value).toBe(true)
      expect(metadata.priority).toBe('user')
      expect(metadata.reason).toBe('User clicked toggle')
      expect(metadata.changed).toBe(true)
      expect(metadata.urlKey).toBe('e')
    })

    it('should accept all valid priority types', () => {
      const defaultMeta: StateFieldMetadata = {
        value: true,
        priority: 'default',
        reason: 'Default value',
        changed: false
      }

      const constraintMeta: StateFieldMetadata = {
        value: false,
        priority: 'constraint',
        reason: 'Constraint applied',
        changed: true
      }

      const userMeta: StateFieldMetadata = {
        value: true,
        priority: 'user',
        reason: 'User override',
        changed: true
      }

      expect(defaultMeta.priority).toBe('default')
      expect(constraintMeta.priority).toBe('constraint')
      expect(userMeta.priority).toBe('user')
    })

    it('should allow optional urlKey', () => {
      const withUrlKey: StateFieldMetadata = {
        value: true,
        priority: 'user',
        reason: 'Test',
        changed: true,
        urlKey: 'e'
      }

      const withoutUrlKey: StateFieldMetadata = {
        value: true,
        priority: 'user',
        reason: 'Test',
        changed: true
      }

      expect(withUrlKey.urlKey).toBe('e')
      expect(withoutUrlKey.urlKey).toBeUndefined()
    })
  })

  describe('ResolvedState', () => {
    it('should accept valid resolved state objects', () => {
      const resolved: ResolvedState = {
        state: {
          isExcess: true,
          showBaseline: true
        },
        metadata: {
          isExcess: {
            value: true,
            priority: 'user',
            reason: 'User clicked',
            changed: true,
            urlKey: 'e'
          }
        },
        changedFields: ['isExcess'],
        userOverrides: new Set(['isExcess']),
        log: {
          timestamp: new Date().toISOString(),
          trigger: {
            field: 'isExcess',
            value: true,
            source: 'user'
          },
          before: { isExcess: false },
          after: { isExcess: true },
          changes: [
            {
              field: 'isExcess',
              urlKey: 'e',
              oldValue: false,
              newValue: true,
              priority: 'user',
              reason: 'User clicked'
            }
          ],
          userOverridesFromUrl: []
        }
      }

      expect(resolved.state.isExcess).toBe(true)
      expect(resolved.metadata.isExcess).toBeDefined()
      expect(resolved.changedFields).toContain('isExcess')
      expect(resolved.userOverrides.has('isExcess')).toBe(true)
      expect(resolved.log.changes).toHaveLength(1)
    })
  })

  describe('StateResolutionLog', () => {
    it('should accept StateChange as trigger', () => {
      const log: StateResolutionLog = {
        timestamp: '2025-01-01T00:00:00.000Z',
        trigger: {
          field: 'isExcess',
          value: true,
          source: 'user'
        },
        before: {},
        after: {},
        changes: [],
        userOverridesFromUrl: []
      }

      expect(log.trigger).toHaveProperty('field')
      expect(log.trigger).toHaveProperty('value')
      expect(log.trigger).toHaveProperty('source')
    })

    it('should accept "initial" as trigger', () => {
      const log: StateResolutionLog = {
        timestamp: '2025-01-01T00:00:00.000Z',
        trigger: 'initial',
        before: {},
        after: {},
        changes: [],
        userOverridesFromUrl: []
      }

      expect(log.trigger).toBe('initial')
    })

    it('should track changes with full metadata', () => {
      const log: StateResolutionLog = {
        timestamp: '2025-01-01T00:00:00.000Z',
        trigger: 'initial',
        before: { isExcess: false },
        after: { isExcess: true },
        changes: [
          {
            field: 'isExcess',
            urlKey: 'e',
            oldValue: false,
            newValue: true,
            priority: 'constraint (p2)',
            reason: 'Excess mode requires baseline'
          }
        ],
        userOverridesFromUrl: ['isExcess']
      }

      expect(log.changes).toHaveLength(1)
      expect(log.changes[0]).toMatchObject({
        field: 'isExcess',
        urlKey: 'e',
        oldValue: false,
        newValue: true,
        priority: 'constraint (p2)',
        reason: 'Excess mode requires baseline'
      })
    })
  })

  describe('StateConstraint', () => {
    it('should accept valid constraint objects', () => {
      const constraint: StateConstraint = {
        when: state => state.isExcess === true,
        apply: {
          showBaseline: true,
          isLogarithmic: false
        },
        reason: 'Excess mode requires baseline and disables logarithmic scale',
        allowUserOverride: false,
        priority: 2
      }

      expect(typeof constraint.when).toBe('function')
      expect(constraint.apply.showBaseline).toBe(true)
      expect(constraint.reason).toBe('Excess mode requires baseline and disables logarithmic scale')
      expect(constraint.allowUserOverride).toBe(false)
      expect(constraint.priority).toBe(2)
    })

    it('should allow optional priority', () => {
      const withPriority: StateConstraint = {
        when: () => true,
        apply: {},
        reason: 'Test',
        allowUserOverride: false,
        priority: 1
      }

      const withoutPriority: StateConstraint = {
        when: () => true,
        apply: {},
        reason: 'Test',
        allowUserOverride: false
      }

      expect(withPriority.priority).toBe(1)
      expect(withoutPriority.priority).toBeUndefined()
    })

    it('should support different priority levels', () => {
      const lowPriority: StateConstraint = {
        when: () => true,
        apply: { showPredictionInterval: false },
        reason: 'Default override',
        allowUserOverride: true,
        priority: 0
      }

      const normalPriority: StateConstraint = {
        when: () => true,
        apply: { cumulative: false },
        reason: 'Business rule',
        allowUserOverride: false,
        priority: 1
      }

      const highPriority: StateConstraint = {
        when: () => true,
        apply: { showBaseline: true },
        reason: 'Hard constraint',
        allowUserOverride: false,
        priority: 2
      }

      expect(lowPriority.priority).toBe(0)
      expect(normalPriority.priority).toBe(1)
      expect(highPriority.priority).toBe(2)
    })

    it('should allow user override flag', () => {
      const canOverride: StateConstraint = {
        when: () => true,
        apply: {},
        reason: 'Soft constraint',
        allowUserOverride: true
      }

      const cannotOverride: StateConstraint = {
        when: () => true,
        apply: {},
        reason: 'Hard constraint',
        allowUserOverride: false
      }

      expect(canOverride.allowUserOverride).toBe(true)
      expect(cannotOverride.allowUserOverride).toBe(false)
    })

    it('should evaluate when condition', () => {
      const constraint: StateConstraint = {
        when: state => state.isExcess === true,
        apply: { showBaseline: true },
        reason: 'Test',
        allowUserOverride: false
      }

      expect(constraint.when({ isExcess: true })).toBe(true)
      expect(constraint.when({ isExcess: false })).toBe(false)
    })
  })
})
