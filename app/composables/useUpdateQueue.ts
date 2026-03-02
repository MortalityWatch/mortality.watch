/**
 * Update Queue Composable
 *
 * Manages concurrent update handling for the explorer page.
 * Prevents race conditions by queuing updates when one is already in progress.
 *
 * Features:
 * - Queues updates to prevent concurrent execution
 * - Tracks internal URL updates vs browser navigation
 * - Provides reactive state for UI feedback
 */

import { ref, computed } from 'vue'
import {
  getFieldUpdateType,
  type FieldUpdateType,
  requiresDataDownload,
  requiresDatasetUpdate,
  requiresFilterUpdate
} from '@/lib/state'

interface UpdateQueueOptions {
  /**
   * Callback to execute the actual data update
   * @param shouldDownload - Whether to fetch fresh data from server
   * @param shouldUpdate - Whether to recalculate baseline/dataset
   */
  onUpdate: (shouldDownload: boolean, shouldUpdate: boolean) => Promise<void>

  /**
   * Optional: Get current state for conditional field logic
   * (e.g., cumulative needs 'update' if baselineMethod !== 'auto')
   */
  getCurrentState?: () => Record<string, unknown>
}

export function useUpdateQueue(options: UpdateQueueOptions) {
  const { onUpdate, getCurrentState } = options

  // Internal state
  const isCurrentlyUpdating = ref(false)
  const pendingUpdateKey = ref<string | null>(null)

  // Flag to skip browser navigation handler when WE update the URL
  // (vs when user clicks back/forward)
  const isInternalUrlUpdate = ref(false)

  /**
   * Process an update request based on the field change key
   */
  const processUpdate = async (key: string) => {
    const currentState = getCurrentState?.()

    const shouldDownload = requiresDataDownload(key, currentState)
    const shouldUpdate = requiresDatasetUpdate(key, currentState)
    const shouldFilter = requiresFilterUpdate(key, currentState)

    // Only call onUpdate if any data operation is needed
    if (shouldDownload || shouldUpdate || shouldFilter) {
      await onUpdate(shouldDownload, shouldUpdate)
    }
  }

  /**
   * Priority ranking for update types.
   * Higher number = more expensive operation that subsumes cheaper ones.
   */
  const UPDATE_TYPE_PRIORITY: Record<FieldUpdateType, number> = {
    none: 0,
    filter: 1,
    update: 2,
    download: 3
  }

  /**
   * Queue an update request.
   * If an update is already in progress, the new request is queued.
   * When merging pending requests, the one requiring the most expensive
   * data operation wins. This prevents a cheap filter-only change from
   * overwriting a pending dataset recalculation. (#508)
   *
   * @param key - The field change key (e.g., '_countries', 'dateRange')
   */
  const queueUpdate = async (key: string) => {
    // If already updating, queue this update (most expensive wins)
    if (isCurrentlyUpdating.value) {
      if (pendingUpdateKey.value) {
        const currentState = getCurrentState?.()
        const pendingType = getFieldUpdateType(pendingUpdateKey.value, currentState)
        const newType = getFieldUpdateType(key, currentState)
        const pendingPriority = UPDATE_TYPE_PRIORITY[pendingType] ?? 0
        const newPriority = UPDATE_TYPE_PRIORITY[newType] ?? 0
        // Keep the key that requires the most expensive operation
        if (newPriority > pendingPriority) {
          pendingUpdateKey.value = key
        }
      } else {
        pendingUpdateKey.value = key
      }
      return
    }

    isCurrentlyUpdating.value = true
    try {
      await processUpdate(key)

      // Process any pending update
      if (pendingUpdateKey.value) {
        const nextKey = pendingUpdateKey.value
        pendingUpdateKey.value = null
        await processUpdate(nextKey)
      }
    } finally {
      isCurrentlyUpdating.value = false
    }
  }

  /**
   * Mark the start of an internal URL update.
   * Call this before programmatically updating the URL to prevent
   * the browser navigation handler from triggering a duplicate update.
   */
  const startInternalUrlUpdate = () => {
    isInternalUrlUpdate.value = true
  }

  /**
   * Mark the end of an internal URL update.
   * Call this after the URL update is complete.
   */
  const endInternalUrlUpdate = () => {
    isInternalUrlUpdate.value = false
  }

  /**
   * Check if an update should be skipped (e.g., during internal URL changes)
   */
  const shouldSkipUpdate = computed(() => isInternalUrlUpdate.value)

  return {
    // State
    isUpdating: computed(() => isCurrentlyUpdating.value),
    hasPendingUpdate: computed(() => pendingUpdateKey.value !== null),
    isInternalUrlUpdate: computed(() => isInternalUrlUpdate.value),
    shouldSkipUpdate,

    // Actions
    queueUpdate,
    startInternalUrlUpdate,
    endInternalUrlUpdate
  }
}
