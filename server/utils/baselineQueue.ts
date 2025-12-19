/**
 * Server-side Baseline Request Queue
 *
 * Limits concurrent requests to the stats API during SSR to prevent overwhelming the server.
 */

import { RequestQueue } from '../../app/lib/queue/RequestQueue'
import { EXTERNAL_SERVICES } from '../../app/lib/config/constants'

/**
 * Global server-side baseline request queue
 * Limits concurrent stats API requests during SSR
 */
export const serverBaselineQueue = new RequestQueue({
  maxConcurrent: EXTERNAL_SERVICES.BASELINE_MAX_CONCURRENT_REQUESTS,
  timeoutMs: EXTERNAL_SERVICES.BASELINE_REQUEST_TIMEOUT_MS
})
