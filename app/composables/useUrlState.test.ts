import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUrlState, useUrlObjectState } from './useUrlState'

// Mock vue-router
const mockRoute = {
  query: {} as Record<string, string | string[]>
}

const mockRouter = {
  replace: vi.fn(),
  push: vi.fn().mockResolvedValue(undefined)
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter
}))

// Mock vue's computed
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    computed: (options: { get?: () => unknown, set?: (val: unknown) => void }) => {
      // Simple mock that returns a writable ref-like object with get/set
      let internalValue = options.get ? options.get() : undefined
      const result = {
        get value() {
          return options.get ? options.get() : internalValue
        },
        set value(val: unknown) {
          if (options.set) {
            options.set(val)
          }
          internalValue = val
        }
      }
      // Make value writable
      Object.defineProperty(result, 'value', {
        get() {
          return options.get ? options.get() : internalValue
        },
        set(val: unknown) {
          if (options.set) {
            options.set(val)
          }
          internalValue = val
        },
        configurable: true,
        enumerable: true
      })
      return result
    }
  }
})

describe('useUrlState', () => {
  beforeEach(() => {
    mockRoute.query = {}
    mockRouter.replace.mockClear()
    mockRouter.push.mockClear()
  })

  describe('basic functionality', () => {
    it('should return default value when query param is not present', () => {
      const state = useUrlState('test', 'default')
      expect(state.value).toBe('default')
    })

    it('should return query param value when present', () => {
      mockRoute.query.test = 'value'
      const state = useUrlState('test', 'default')
      expect(state.value).toBe('value')
    })

    it('should update URL when value is set', async () => {
      const state = useUrlState('test', 'default')
      state.value = 'newValue'

      // Wait for next tick for async router.push
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockRouter.push).toHaveBeenCalledWith({
        query: { test: 'newValue' }
      })
    })

    it('should preserve existing query params when updating', async () => {
      mockRoute.query = { existing: 'param', test: 'old' }
      const state = useUrlState('test', 'default')
      state.value = 'new'

      // Wait for next tick for async router.push
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockRouter.push).toHaveBeenCalledWith({
        query: { existing: 'param', test: 'new' }
      })
    })
  })

  describe('with encoder/decoder', () => {
    const encodeBool = (val: boolean) => val ? 1 : 0
    const decodeBool = (val: string) => val === '1'

    it('should decode query param using decoder', () => {
      mockRoute.query.enabled = '1'
      const state = useUrlState('enabled', false, encodeBool, decodeBool)
      expect(state.value).toBe(true)
    })

    it('should encode value using encoder when setting', async () => {
      const state = useUrlState('enabled', false, encodeBool, decodeBool)
      state.value = true

      // Wait for next tick for async router.push
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockRouter.push).toHaveBeenCalledWith({
        query: { enabled: '1' }
      })
    })

    it('should handle false boolean correctly', () => {
      mockRoute.query.enabled = '0'
      const state = useUrlState('enabled', true, encodeBool, decodeBool)
      expect(state.value).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty string query param', () => {
      mockRoute.query.test = ''
      const state = useUrlState('test', 'default')
      expect(state.value).toBe('default')
    })

    it('should handle number default values', () => {
      const state = useUrlState('count', 42)
      expect(state.value).toBe(42)
    })

    it('should handle number query params', () => {
      mockRoute.query.count = '123'
      const state = useUrlState('count', 0)
      expect(state.value).toBe('123')
    })

    it('should handle encoder returning number', async () => {
      const encodeNumber = (val: number) => val as number | undefined
      mockRoute.query = {}
      const state = useUrlState('num', 10, encodeNumber)
      state.value = 42 as typeof state.value

      // Wait for next tick for async router.push
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockRouter.push).toHaveBeenCalledWith({
        query: { num: '42' }
      })
    })
  })
})

describe('useUrlObjectState', () => {
  const options = [
    { label: 'Option 1', name: 'Option 1', value: 'opt1' },
    { label: 'Option 2', name: 'Option 2', value: 'opt2' },
    { label: 'Option 3', name: 'Option 3', value: 'opt3' }
  ]

  beforeEach(() => {
    mockRoute.query = {}
    mockRouter.replace.mockClear()
    mockRouter.push.mockClear()
  })

  describe('basic functionality', () => {
    it('should return default object when query param is not present', () => {
      const state = useUrlObjectState('option', options[0]!, options)
      const value = state.value

      expect(value).toEqual({
        label: 'Option 1',
        name: 'Option 1',
        value: 'opt1'
      })
    })

    it('should return matching object when query param is present', () => {
      mockRoute.query.option = 'opt2'
      const state = useUrlObjectState('option', options[0]!, options)
      const value = state.value

      expect(value).toEqual({
        label: 'Option 2',
        name: 'Option 2',
        value: 'opt2'
      })
    })

    it('should update URL with object value when set', async () => {
      const state = useUrlObjectState('option', options[0]!, options)
      // @ts-expect-error - mock computed setter works at runtime
      state.value = { label: 'Option 3', name: 'Option 3', value: 'opt3' }

      // Wait for next tick for async router.push
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockRouter.push).toHaveBeenCalledWith({
        query: { option: 'opt3' }
      })
    })

    it('should preserve existing query params', async () => {
      mockRoute.query = { other: 'value' }
      const state = useUrlObjectState('option', options[0]!, options)
      // @ts-expect-error - mock computed setter works at runtime
      state.value = { label: 'Option 2', name: 'Option 2', value: 'opt2' }

      // Wait for next tick for async router.push
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(mockRouter.push).toHaveBeenCalledWith({
        query: { other: 'value', option: 'opt2' }
      })
    })
  })

  describe('fallback behavior', () => {
    it('should return default when query value does not match any option', () => {
      mockRoute.query.option = 'invalid'
      const state = useUrlObjectState('option', options[0]!, options)
      const value = state.value

      expect(value).toEqual({
        label: 'Option 1',
        name: 'Option 1',
        value: 'opt1'
      })
    })

    it('should use default value when available', () => {
      const state = useUrlObjectState('option', options[1]!, options)
      const value = state.value

      expect(value).toEqual({
        label: 'Option 2',
        name: 'Option 2',
        value: 'opt2'
      })
    })
  })

  describe('object structure', () => {
    it('should always include label, name, and value properties', () => {
      mockRoute.query.option = 'opt3'
      const state = useUrlObjectState('option', options[0]!, options)
      const value = state.value

      expect(value).toHaveProperty('label')
      expect(value).toHaveProperty('name')
      expect(value).toHaveProperty('value')
    })

    it('should set label equal to name', () => {
      mockRoute.query.option = 'opt2'
      const state = useUrlObjectState('option', options[0]!, options)
      const value = state.value

      expect(value.label).toBe(value.name)
      expect(value.label).toBe('Option 2')
    })
  })

  describe('integration with select components', () => {
    it('should work with component expecting label/value objects', () => {
      // Simulate a select component receiving the value
      mockRoute.query.option = 'opt2'
      const state = useUrlObjectState('option', options[0]!, options)
      const value = state.value

      // Component can access both label and value
      expect(value.label).toBe('Option 2')
      expect(value.value).toBe('opt2')
    })

    it('should accept object from component with any structure', async () => {
      const state = useUrlObjectState('option', options[0]!, options)

      // Component might send back object with extra properties
      // @ts-expect-error - mock computed setter works at runtime
      state.value = {
        label: 'Option 3',
        name: 'Option 3',
        value: 'opt3',
        extra: 'ignored'
      } as { label: string, name: string, value: string }

      // Wait for next tick for async router.push
      await new Promise(resolve => setTimeout(resolve, 0))

      // Should still work and only use the value
      expect(mockRouter.push).toHaveBeenCalledWith({
        query: { option: 'opt3' }
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty options array gracefully', () => {
      const state = useUrlObjectState('option', options[0]!, [])
      const value = state.value

      // Should fall back to default
      expect(value).toEqual({
        label: 'Option 1',
        name: 'Option 1',
        value: 'opt1'
      })
    })

    it('should handle options with same value', () => {
      const duplicateOptions = [
        { name: 'First', value: 'same' },
        { name: 'Second', value: 'same' }
      ]

      mockRoute.query.option = 'same'
      const state = useUrlObjectState('option', duplicateOptions[0]!, duplicateOptions)
      const value = state.value

      // Should return first match
      expect(value.name).toBe('First')
    })
  })
})
