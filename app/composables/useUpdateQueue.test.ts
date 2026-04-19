/**
 * useUpdateQueue Tests
 *
 * Tests for update queue behavior, specifically:
 * - Merging pending updates by priority (most expensive wins)
 * - Preventing stale state from dropped dataset updates (#508)
 */

import { describe, it, expect, vi } from 'vitest'
import { useUpdateQueue } from './useUpdateQueue'

// Mock @/lib/state to provide field update type resolution
vi.mock('@/lib/state', () => {
  const FIELD_UPDATE_STRATEGY: Record<string, string> = {
    countries: 'download',
    type: 'download',
    chartType: 'download',
    ageGroups: 'download',
    baselineMethod: 'update',
    standardPopulation: 'update',
    baselineDateFrom: 'update',
    baselineDateTo: 'update',
    sliderStart: 'update',
    dateFrom: 'filter',
    dateTo: 'filter',
    chartStyle: 'filter',
    view: 'filter',
    showBaseline: 'filter',
    cumulative: 'filter',
    showPredictionInterval: 'filter',
    showPercentage: 'filter',
    showTotal: 'filter',
    userColors: 'filter',
    showLabels: 'none',
    maximize: 'none',
    showLogarithmic: 'none'
  }

  function getFieldUpdateType(field: string, _currentState?: Record<string, unknown>) {
    const normalizedField = field.startsWith('_') ? field.slice(1) : field
    if (normalizedField === 'dateRange') return 'filter'
    return FIELD_UPDATE_STRATEGY[normalizedField] ?? 'none'
  }

  return {
    getFieldUpdateType,
    requiresDataDownload: (field: string, state?: Record<string, unknown>) =>
      getFieldUpdateType(field, state) === 'download',
    requiresDatasetUpdate: (field: string, state?: Record<string, unknown>) =>
      getFieldUpdateType(field, state) === 'update',
    requiresFilterUpdate: (field: string, state?: Record<string, unknown>) => {
      const type = getFieldUpdateType(field, state)
      return type === 'download' || type === 'update' || type === 'filter'
    }
  }
})

describe('useUpdateQueue', () => {
  /**
   * Helper: creates a queue with a controllable onUpdate callback.
   * Returns a deferred that can be resolved to let the update finish.
   */
  function createTestQueue() {
    const updateCalls: Array<{ shouldDownload: boolean, shouldUpdate: boolean }> = []
    let resolveCurrentUpdate: (() => void) | null = null

    const queue = useUpdateQueue({
      onUpdate: async (shouldDownload, shouldUpdate) => {
        updateCalls.push({ shouldDownload, shouldUpdate })
        // Wait for test to explicitly resolve
        await new Promise<void>((resolve) => {
          resolveCurrentUpdate = resolve
        })
      },
      getCurrentState: () => ({})
    })

    return {
      queue,
      updateCalls,
      finishCurrentUpdate: () => {
        if (resolveCurrentUpdate) {
          resolveCurrentUpdate()
          resolveCurrentUpdate = null
        }
      }
    }
  }

  it('should process a single update normally', async () => {
    const { queue, updateCalls, finishCurrentUpdate } = createTestQueue()

    const updatePromise = queue.queueUpdate('_chartStyle')
    // Should have started processing
    expect(updateCalls).toHaveLength(1)
    expect(updateCalls[0]).toEqual({ shouldDownload: false, shouldUpdate: false })

    finishCurrentUpdate()
    await updatePromise
  })

  it('should keep more expensive pending update when cheaper arrives later (#508)', async () => {
    const { queue, updateCalls, finishCurrentUpdate } = createTestQueue()

    // Start a filter-only update (chartStyle)
    const firstUpdate = queue.queueUpdate('_chartStyle')
    expect(updateCalls).toHaveLength(1)

    // While processing, queue a dataset update (baselineMethod)
    queue.queueUpdate('_baselineMethod')

    // Then queue a cheaper filter update (showPercentage) - should NOT overwrite
    queue.queueUpdate('_showPercentage')

    // Finish the first update - pending should be baselineMethod (more expensive)
    finishCurrentUpdate()
    await vi.waitFor(() => expect(updateCalls).toHaveLength(2))

    // The pending update should have been baselineMethod (update), not showPercentage (filter)
    expect(updateCalls[1]).toEqual({ shouldDownload: false, shouldUpdate: true })

    finishCurrentUpdate()
    await firstUpdate
  })

  it('should upgrade pending filter to download when download arrives', async () => {
    const { queue, updateCalls, finishCurrentUpdate } = createTestQueue()

    // Start a filter update
    const firstUpdate = queue.queueUpdate('_chartStyle')
    expect(updateCalls).toHaveLength(1)

    // Queue a filter update
    queue.queueUpdate('_showBaseline')
    // Then queue a download update (countries) - should upgrade pending
    queue.queueUpdate('_countries')

    finishCurrentUpdate()
    await vi.waitFor(() => expect(updateCalls).toHaveLength(2))

    // Should have processed the download
    expect(updateCalls[1]).toEqual({ shouldDownload: true, shouldUpdate: false })

    finishCurrentUpdate()
    await firstUpdate
  })

  it('should not downgrade pending download to filter', async () => {
    const { queue, updateCalls, finishCurrentUpdate } = createTestQueue()

    // Start an update
    const firstUpdate = queue.queueUpdate('_chartStyle')
    expect(updateCalls).toHaveLength(1)

    // Queue a download (countries)
    queue.queueUpdate('_countries')
    // Then queue a filter (chartStyle) - should NOT downgrade
    queue.queueUpdate('_chartStyle')

    finishCurrentUpdate()
    await vi.waitFor(() => expect(updateCalls).toHaveLength(2))

    // Should still process as download (not downgraded to filter)
    expect(updateCalls[1]).toEqual({ shouldDownload: true, shouldUpdate: false })

    finishCurrentUpdate()
    await firstUpdate
  })
})
