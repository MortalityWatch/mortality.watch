/**
 * Map chart type to seasonal period for Guerrero lambda estimation.
 * Returns null for non-seasonal chart types (yearly variants), in which case
 * variance-stabilized z-scores fall back to the standard z-score path —
 * fabricating a period for non-seasonal data has no statistical justification.
 */
export function getSeasonalPeriod(chartType: string): number | null {
  if (chartType.startsWith('weekly')) return 52
  if (chartType === 'monthly') return 12
  if (chartType === 'quarterly') return 4
  // yearly, fluseason, midyear: no within-year seasonality to stabilize
  return null
}
