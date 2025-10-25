/**
 * Data module - Public API
 * Exports all data-related functionality in an organized manner
 */

// Queries - Loading metadata and fetching data
export {
  loadCountryMetadataFlat,
  loadCountryMetadata,
  fetchData
} from './queries'

// Transformations - Data processing and manipulation
export {
  updateDataset,
  getDataForCountry
} from './transformations'

// Labels - Label extraction and sorting
export {
  getLabels,
  getAllChartLabels,
  getStartIndex
} from './labels'

// Baselines - Baseline calculations
export {
  calculateBaselines
} from './baselines'

// Aggregations - Chart data aggregation
export {
  getAllChartData
} from './aggregations'

// Utils - Utility functions
export {
  getSourceDescription
} from './utils'
