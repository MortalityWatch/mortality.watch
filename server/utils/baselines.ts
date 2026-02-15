/**
 * Server-side baseline calculations
 *
 * This module provides baseline calculation functionality for SSR chart rendering.
 * Uses shared calculation logic from app/lib/baseline/ with server-specific
 * fetch implementation (circuit breaker pattern).
 */

import type {
  Dataset,
  DatasetEntry
} from '../../app/model'
import { fetchBaselineWithCircuitBreaker } from './baselineApi'
import { serverBaselineQueue } from './baselineQueue'
import {
  calculateBaselines as sharedCalculateBaselines,
  type BaselineDependencies
} from '../../app/lib/baseline'

/**
 * Server-side dependencies for baseline calculation
 */
const serverDeps: BaselineDependencies = {
  fetchBaseline: (endpoint: string, body: Record<string, unknown>) =>
    fetchBaselineWithCircuitBreaker(endpoint, body),
  enqueue: <T>(fn: () => Promise<T>) => serverBaselineQueue.enqueue(fn)
}

/**
 * Calculate baselines for all entries in dataset
 *
 * @param statsUrl - Optional stats API URL (defaults to https://stats.mortality.watch/)
 */
export const calculateBaselines = async (
  data: Dataset,
  labels: string[],
  startIdx: number,
  endIdx: number,
  keys: (keyof DatasetEntry)[],
  method: string,
  chartType: string,
  cumulative: boolean,
  progressCb?: (progress: number, total: number) => void,
  statsUrl?: string
): Promise<void> => {
  return sharedCalculateBaselines(
    serverDeps,
    data,
    labels,
    startIdx,
    endIdx,
    keys,
    method,
    chartType,
    cumulative,
    progressCb,
    statsUrl
  )
}
