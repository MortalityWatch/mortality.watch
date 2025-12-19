/**
 * Client-side Baseline Request Queue
 *
 * Limits concurrent requests to the stats API to prevent overwhelming the server.
 */

import { RequestQueue } from '../queue/RequestQueue'
import { EXTERNAL_SERVICES } from '../config/constants'

/**
 * Global baseline request queue for client-side requests
 * Limits concurrent stats API requests
 */
export const baselineQueue = new RequestQueue({
  maxConcurrent: EXTERNAL_SERVICES.BASELINE_MAX_CONCURRENT_REQUESTS,
  timeoutMs: EXTERNAL_SERVICES.BASELINE_REQUEST_TIMEOUT_MS
})
