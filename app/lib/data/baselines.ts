/**
 * Client-side baseline calculations
 *
 * This module provides baseline calculation functionality for the client.
 * Uses shared calculation logic from app/lib/baseline/ with client-specific
 * fetch implementation.
 */

import type {
  Dataset,
  DatasetEntry
} from '@/model'
import { dataLoader } from '../dataLoader'
import {
  calculateBaselines as sharedCalculateBaselines,
  type BaselineDependencies
} from '../baseline'
import { baselineQueue } from './baselineQueue'

/**
 * Client-side dependencies for baseline calculation
 */
const clientDeps: BaselineDependencies = {
  fetchBaseline: (endpoint: string, body: Record<string, unknown>) =>
    dataLoader.fetchBaseline(endpoint, body),
  enqueue: <T>(fn: () => Promise<T>) => baselineQueue.enqueue(fn)
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
    clientDeps,
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
