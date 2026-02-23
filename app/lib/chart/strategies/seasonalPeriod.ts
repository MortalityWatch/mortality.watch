/**
 * Map chart type to seasonal period for Guerrero lambda estimation
 */
export function getSeasonalPeriod(chartType: string): number {
  if (chartType.startsWith('weekly')) return 52
  if (chartType === 'monthly') return 12
  if (chartType === 'quarterly') return 4
  // Yearly-type periods (yearly, fluseason, midyear) - no strong seasonality
  return 4
}
