/**
 * View Detector
 *
 * Determines the active view type from URL parameters
 */

import type { ViewType } from './viewTypes'

/**
 * Detect view from URL parameters
 *
 * Priority order (highest to lowest):
 * 1. zs=1 → 'zscore'
 * 2. e=1 → 'excess'
 * 3. view=xxx → if valid view name
 * 4. Default → 'mortality'
 *
 * Note: ASD is a metric type (t=asd), not a view
 *
 * @param params - URL query parameters
 * @returns The detected view type
 */
export function detectView(params: Record<string, unknown>): ViewType {
  // Priority 1: Z-score
  if (params.zs === '1') {
    return 'zscore'
  }

  // Priority 3: Excess (backward compat with e=1)
  if (params.e === '1') {
    return 'excess'
  }

  // Priority 3.5: Backward compat with old isExcess param
  if (params.isExcess === 'true') {
    return 'excess'
  }

  // Priority 4: Explicit view parameter (future-proof)
  if (params.view && typeof params.view === 'string' && isValidView(params.view)) {
    return params.view as ViewType
  }

  // Priority 5: Default
  return 'mortality'
}

/**
 * Check if a string is a valid view type
 */
function isValidView(view: string): boolean {
  return ['mortality', 'excess', 'zscore'].includes(view)
}
