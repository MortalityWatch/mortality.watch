/**
 * Label Visibility Logic
 *
 * Calculates whether chart labels should be shown based on data density.
 * Prevents chart clutter when there are many data points relative to chart width.
 */

/**
 * Calculate whether labels should be shown based on data density
 *
 * Formula: Disable labels if dataPoints > (chartWidth / 20)
 * This ensures at least 20px per data point to avoid overcrowding
 *
 * @param dataPointCount - Number of data points in the chart
 * @param chartWidth - Width of the chart in pixels (optional, defaults to 800)
 * @param userOverride - User's explicit preference (true = force show, false = force hide, undefined = auto)
 * @returns Whether labels should be displayed
 *
 * @example
 * shouldShowLabels(10, 800, undefined) // true (10 < 800/20=40)
 * shouldShowLabels(50, 800, undefined) // false (50 > 800/20=40)
 * shouldShowLabels(50, 1000, undefined) // true (50 = 1000/20=50)
 * shouldShowLabels(50, 800, true) // true (user override)
 */
export function shouldShowLabels(
  dataPointCount: number,
  chartWidth: number = 800,
  userOverride?: boolean
): boolean {
  // If user has explicitly set a preference, respect it
  if (userOverride !== undefined) {
    return userOverride
  }

  // Auto-calculate based on data density
  // Disable labels if dataPoints > (chartWidth / 20)
  const maxDataPoints = chartWidth / 20
  return dataPointCount <= maxDataPoints
}

/**
 * Get the number of data points from chart labels
 *
 * @param labels - Array of chart labels (x-axis values)
 * @returns Number of data points
 */
export function getDataPointCount(labels: string[]): number {
  return labels.length
}

/**
 * Get chart width from DOM element
 * Falls back to default if chart element not found
 *
 * @param chartElementId - ID of the chart canvas element
 * @returns Chart width in pixels
 */
export function getChartWidth(chartElementId: string = 'chart'): number {
  const chartElement = document.getElementById(chartElementId)
  if (chartElement) {
    return chartElement.offsetWidth || 800
  }
  return 800 // Default fallback width
}

/**
 * Determine if labels should be shown, checking both data density and user preference
 *
 * This is the main function to use when determining label visibility.
 * It checks for user override first, then calculates based on data density.
 *
 * @param labels - Array of chart labels
 * @param userShowLabels - User's explicit preference from settings
 * @param chartWidth - Chart width in pixels (optional)
 * @returns Whether labels should be displayed
 */
export function calculateLabelVisibility(
  labels: string[],
  userShowLabels: boolean | undefined,
  chartWidth?: number
): boolean {
  const dataPointCount = getDataPointCount(labels)
  const width = chartWidth || getChartWidth()

  return shouldShowLabels(dataPointCount, width, userShowLabels)
}
