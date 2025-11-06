import { watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Ref } from 'vue'

/**
 * Browser Navigation Composable
 *
 * Handles browser back/forward button navigation for pages that store state in URL query parameters.
 * Watches specified query parameters and triggers a callback when they change due to navigation.
 *
 * This solves the common problem where:
 * 1. User changes page state (triggers URL update)
 * 2. User clicks browser back/forward
 * 3. URL changes but page doesn't update
 *
 * @example
 * ```ts
 * useBrowserNavigation({
 *   queryParams: ['c', 't', 'df', 'dt'],
 *   onNavigate: () => update('_countries'),
 *   isReady: isDataLoaded,
 *   isUpdating: computed(() => isCurrentlyUpdating)
 * })
 * ```
 */
export function useBrowserNavigation(options: {
  /**
   * Array of query parameter keys to watch (e.g., ['c', 't', 'df', 'dt'])
   * Changes to any of these params will trigger the onNavigate callback
   */
  queryParams: string[]

  /**
   * Callback function to execute when watched query params change
   * Typically a data reload or state update function
   */
  onNavigate: () => void

  /**
   * Ref indicating whether initial data load is complete
   * Navigation handling is disabled until this is true
   */
  isReady: Ref<boolean>

  /**
   * Ref indicating whether an update is currently in progress
   * Prevents cascading updates and race conditions
   */
  isUpdating: Ref<boolean>
}) {
  const route = useRoute()

  // Watch array of query params for changes
  watch(
    // Create array of getter functions for each param
    options.queryParams.map(param => () => route.query[param]),
    (newVal, oldVal) => {
      // Only trigger navigation callback if:
      // 1. Initial load is complete (isReady)
      // 2. Not the first render (oldVal exists)
      // 3. Values actually changed (JSON comparison)
      // 4. Not currently updating (prevents race conditions)
      if (
        options.isReady.value
        && oldVal
        && JSON.stringify(newVal) !== JSON.stringify(oldVal)
        && !options.isUpdating.value
      ) {
        options.onNavigate()
      }
    },
    // Run after component updates to ensure DOM is in sync
    { flush: 'post' }
  )
}
