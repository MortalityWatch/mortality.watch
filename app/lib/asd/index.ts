/**
 * ASD (Age-Standardized Deaths) Module
 *
 * Shared utilities for ASD calculation used by both client and SSR.
 */

export {
  fetchASDFromStatsApi,
  fetchASDForCountry,
  buildAgeGroupInputs,
  alignASDToChartLabels,
  type ASDResult,
  type ASDFetchConfig,
  type AgeGroupInput,
  type ASDDataLoader
} from './fetchASD'
