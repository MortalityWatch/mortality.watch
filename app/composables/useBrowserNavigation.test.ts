import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick, reactive } from 'vue'
import { useBrowserNavigation } from './useBrowserNavigation'

// Mock vue-router with reactive route
const mockRoute = reactive({ query: {} as Record<string, string | string[] | undefined> })
vi.mock('vue-router', () => ({
  useRoute: () => mockRoute
}))

describe('useBrowserNavigation', () => {
  beforeEach(() => {
    // Reset query before each test
    mockRoute.query = {}
  })

  it('should not call onNavigate when isReady is false', async () => {
    const onNavigate = vi.fn()
    const isReady = ref(false)
    const isUpdating = ref(false)

    useBrowserNavigation({
      queryParams: ['c', 't'],
      onNavigate,
      isReady,
      isUpdating
    })

    // Change params while not ready
    mockRoute.query.c = 'USA'
    await nextTick()

    mockRoute.query.c = 'SWE'
    await nextTick()

    // Should NOT call onNavigate because isReady is false
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('should not call onNavigate when isUpdating is true', async () => {
    const onNavigate = vi.fn()
    const isReady = ref(true)
    const isUpdating = ref(true)

    useBrowserNavigation({
      queryParams: ['c', 't'],
      onNavigate,
      isReady,
      isUpdating
    })

    // Set initial value
    mockRoute.query.c = 'USA'
    await nextTick()

    // Change while updating
    mockRoute.query.c = 'SWE'
    await nextTick()

    // Should NOT call onNavigate because isUpdating is true
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('should call onNavigate when watched params change and conditions are met', async () => {
    const onNavigate = vi.fn()
    const isReady = ref(true)
    const isUpdating = ref(false)

    // Set initial query state BEFORE setting up composable
    mockRoute.query.c = 'USA'
    mockRoute.query.t = 'asmr'

    useBrowserNavigation({
      queryParams: ['c', 't'],
      onNavigate,
      isReady,
      isUpdating
    })

    await nextTick()

    // Now change a param
    mockRoute.query.c = 'SWE'
    await nextTick()

    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('should NOT call onNavigate when values have not changed', async () => {
    const onNavigate = vi.fn()
    const isReady = ref(true)
    const isUpdating = ref(false)

    mockRoute.query.c = 'USA'
    mockRoute.query.t = 'asmr'

    useBrowserNavigation({
      queryParams: ['c', 't'],
      onNavigate,
      isReady,
      isUpdating
    })

    await nextTick()

    // Set same values again (JSON.stringify comparison should catch this)
    const oldC = mockRoute.query.c
    const oldT = mockRoute.query.t
    mockRoute.query.c = oldC
    mockRoute.query.t = oldT
    await nextTick()

    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('should only watch specified query params', async () => {
    const onNavigate = vi.fn()
    const isReady = ref(true)
    const isUpdating = ref(false)

    mockRoute.query.c = 'USA'
    mockRoute.query.t = 'asmr'
    mockRoute.query.other = 'value1'

    useBrowserNavigation({
      queryParams: ['c', 't'], // Only watching c and t
      onNavigate,
      isReady,
      isUpdating
    })

    await nextTick()

    // Change only non-watched param (should NOT trigger onNavigate)
    mockRoute.query.other = 'value2'
    await nextTick()

    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('should trigger when any watched param changes', async () => {
    const onNavigate = vi.fn()
    const isReady = ref(true)
    const isUpdating = ref(false)

    mockRoute.query.c = 'USA'
    mockRoute.query.t = 'asmr'
    mockRoute.query.df = '2020-01'
    mockRoute.query.dt = '2020-12'

    useBrowserNavigation({
      queryParams: ['c', 't', 'df', 'dt'],
      onNavigate,
      isReady,
      isUpdating
    })

    await nextTick()

    // Change just one param
    mockRoute.query.df = '2021-01'
    await nextTick()

    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('should handle isReady becoming true after initial setup', async () => {
    const onNavigate = vi.fn()
    const isReady = ref(false) // Start not ready
    const isUpdating = ref(false)

    mockRoute.query.c = 'USA'

    useBrowserNavigation({
      queryParams: ['c', 't'],
      onNavigate,
      isReady,
      isUpdating
    })

    await nextTick()

    // Change while not ready
    mockRoute.query.c = 'SWE'
    await nextTick()

    expect(onNavigate).not.toHaveBeenCalled()

    // Now become ready
    isReady.value = true
    await nextTick()

    // Change params (should trigger onNavigate now)
    mockRoute.query.c = 'GBR'
    await nextTick()

    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('should not trigger during update', async () => {
    const onNavigate = vi.fn()
    const isReady = ref(true)
    const isUpdating = ref(false)

    mockRoute.query.c = 'USA'

    useBrowserNavigation({
      queryParams: ['c'],
      onNavigate,
      isReady,
      isUpdating
    })

    await nextTick()

    // Start updating
    isUpdating.value = true

    // Change params while updating (should NOT trigger)
    mockRoute.query.c = 'SWE'
    await nextTick()

    expect(onNavigate).not.toHaveBeenCalled()

    // Stop updating
    isUpdating.value = false

    // Change params after updating stopped (should trigger)
    mockRoute.query.c = 'GBR'
    await nextTick()

    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('should handle undefined query param values', async () => {
    const onNavigate = vi.fn()
    const isReady = ref(true)
    const isUpdating = ref(false)

    mockRoute.query.c = 'USA'
    mockRoute.query.t = undefined

    useBrowserNavigation({
      queryParams: ['c', 't'],
      onNavigate,
      isReady,
      isUpdating
    })

    await nextTick()

    // Change undefined to defined value
    mockRoute.query.t = 'asmr'
    await nextTick()

    expect(onNavigate).toHaveBeenCalledTimes(1)
  })
})
