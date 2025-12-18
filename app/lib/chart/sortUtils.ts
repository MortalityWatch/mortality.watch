/**
 * Chart Sorting Utilities
 *
 * Pure functions for sorting chart data
 */

export interface DataPoint {
  y: number | null
}

export interface DatasetWithLabel {
  label?: string
  // Chart.js has many data point types - we use 'any' to accept all of them
  // and extract 'y' values at runtime when needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any[]
}

/**
 * Extract the last valid (non-null, non-NaN) value from a dataset
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLastValidValue(data: any[] | undefined): number {
  if (!data || !Array.isArray(data)) return 0

  for (let i = data.length - 1; i >= 0; i--) {
    const point = data[i]
    if (typeof point === 'number' && !isNaN(point) && point !== null) {
      return point
    } else if (point && typeof point === 'object' && 'y' in point) {
      const y = (point as DataPoint).y
      if (y !== null && !isNaN(y)) {
        return y
      }
    }
  }
  return 0
}

/**
 * Sort datasets by their last valid value (absolute value, descending)
 * Returns an array of labels in sorted order
 */
export function sortDatasetsByLatestValue(datasets: DatasetWithLabel[]): string[] {
  const labeled = datasets.filter(ds => ds.label && ds.label.trim() !== '')

  const withValues = labeled.map(ds => ({
    label: ds.label!,
    value: getLastValidValue(ds.data)
  }))

  withValues.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))

  return withValues.map(d => d.label)
}

/**
 * Reorder country codes based on sorted labels
 *
 * @param sortedLabels - Labels sorted by value
 * @param currentCountries - Current country codes
 * @param nameToCode - Map of country names to country codes
 */
export function reorderCountriesByLabels(
  sortedLabels: string[],
  currentCountries: string[],
  nameToCode: Record<string, string>
): string[] {
  const sortedCountries = sortedLabels
    .map(label => nameToCode[label])
    .filter((code): code is string => !!code)

  // Add any countries that weren't in the sorted list (safety)
  for (const code of currentCountries) {
    if (!sortedCountries.includes(code)) {
      sortedCountries.push(code)
    }
  }

  return sortedCountries
}
