/**
 * Discovery Preset Generation
 *
 * Generates all 80 valid preset combinations for the discovery feature.
 * 6 metrics × 5 chart types × 3 views = 90, minus 10 for Population (no excess/zscore)
 */

export const metrics = ['le', 'asd', 'asmr', 'cmr', 'deaths', 'population'] as const
export const chartTypes = ['weekly', 'monthly', 'quarterly', 'yearly', 'fluseason'] as const
export const views = ['normal', 'excess', 'zscore'] as const

export type Metric = typeof metrics[number]
export type ChartType = typeof chartTypes[number]
export type View = typeof views[number]

export interface DiscoveryPreset {
  id: string
  metric: Metric
  chartType: ChartType
  view: View
  baselineMethod: 'mean'
  baselineDateFrom: string
  baselineDateTo: string
}

/**
 * Default baseline period for discovery presets.
 * Uses 2017-2019 as the pre-pandemic baseline period, which is the standard
 * reference period for excess mortality analysis. This is intentionally
 * hardcoded to provide consistent, comparable charts across all presets.
 */
const DEFAULT_BASELINE = {
  method: 'mean' as const,
  dateFrom: '2017',
  dateTo: '2019'
}

/**
 * Generate all valid presets (80 total)
 */
function createAllPresets(): DiscoveryPreset[] {
  const presets: DiscoveryPreset[] = []

  for (const metric of metrics) {
    for (const chartType of chartTypes) {
      for (const view of views) {
        // Population: only normal view (no excess/zscore)
        if (metric === 'population' && view !== 'normal') continue

        presets.push({
          id: `${metric}-${chartType}-${view}`,
          metric,
          chartType,
          view,
          baselineMethod: DEFAULT_BASELINE.method,
          baselineDateFrom: DEFAULT_BASELINE.dateFrom,
          baselineDateTo: DEFAULT_BASELINE.dateTo
        })
      }
    }
  }

  return presets
}

// Memoized preset list - generated once at module load
const ALL_PRESETS = createAllPresets()

/**
 * Get all presets (memoized)
 */
export function generateAllPresets(): DiscoveryPreset[] {
  return ALL_PRESETS
}

/**
 * Get all presets for a specific metric
 */
export function getPresetsByMetric(metric: Metric): DiscoveryPreset[] {
  return ALL_PRESETS.filter(p => p.metric === metric)
}

/**
 * Get preset count for a metric
 */
export function getPresetCountByMetric(metric: Metric): number {
  return metric === 'population' ? 5 : 15
}

/**
 * Get a preset by its ID
 */
export function getPresetById(id: string): DiscoveryPreset | undefined {
  return ALL_PRESETS.find(p => p.id === id)
}

/**
 * Parse preset ID into components
 */
export function parsePresetId(id: string): { metric: Metric, chartType: ChartType, view: View } | null {
  const parts = id.split('-')
  if (parts.length !== 3) return null

  const [metric, chartType, view] = parts
  if (!metrics.includes(metric as Metric)) return null
  if (!chartTypes.includes(chartType as ChartType)) return null
  if (!views.includes(view as View)) return null

  return {
    metric: metric as Metric,
    chartType: chartType as ChartType,
    view: view as View
  }
}

/**
 * Check if a metric is valid
 */
export function isValidMetric(value: string): value is Metric {
  return metrics.includes(value as Metric)
}

/**
 * Check if a preset ID is valid
 */
export function isValidPresetId(id: string): boolean {
  return getPresetById(id) !== undefined
}

/**
 * Generate explorer URL for a preset and country
 */
export function presetToExplorerUrl(preset: DiscoveryPreset, country: string): string {
  const params = new URLSearchParams()

  params.set('c', country)
  params.set('t', preset.metric)
  params.set('ct', preset.chartType)

  if (preset.view === 'excess') {
    params.set('e', '1')
    params.set('sb', '1') // show baseline
    params.set('bm', preset.baselineMethod)
    params.set('bdf', preset.baselineDateFrom)
    params.set('bdt', preset.baselineDateTo)
  }

  if (preset.view === 'zscore') {
    params.set('zs', '1')
    params.set('sb', '1') // show baseline
    params.set('bm', preset.baselineMethod)
    params.set('bdf', preset.baselineDateFrom)
    params.set('bdt', preset.baselineDateTo)
  }

  return `/explorer?${params.toString()}`
}

/**
 * Generate thumbnail URL for a preset and country
 */
export function presetToThumbnailUrl(
  preset: DiscoveryPreset,
  country: string,
  options: {
    darkMode?: boolean
    width?: number
    height?: number
    zoom?: number
    hideSteepDrop?: boolean
  } = {}
): string {
  const {
    darkMode = false,
    width = 352,
    height = 198,
    zoom = 1.33,
    hideSteepDrop = true // Default to true for thumbnails
  } = options

  const params = new URLSearchParams()

  params.set('c', country)
  params.set('t', preset.metric)
  params.set('ct', preset.chartType)

  if (preset.view === 'excess') {
    params.set('e', '1')
    params.set('sb', '1')
    params.set('bm', preset.baselineMethod)
    params.set('bdf', preset.baselineDateFrom)
    params.set('bdt', preset.baselineDateTo)
  }

  if (preset.view === 'zscore') {
    params.set('zs', '1')
    params.set('sb', '1')
    params.set('bm', preset.baselineMethod)
    params.set('bdf', preset.baselineDateFrom)
    params.set('bdt', preset.baselineDateTo)
  }

  // Normal view: show baseline (except for population)
  if (preset.view === 'normal' && preset.metric !== 'population') {
    params.set('sb', '1')
    params.set('bm', preset.baselineMethod)
    params.set('bdf', preset.baselineDateFrom)
    params.set('bdt', preset.baselineDateTo)
  }

  // Thumbnail display options
  params.set('ti', '0') // hide title
  params.set('qr', '0') // hide QR code
  params.set('l', '0') // hide logo
  params.set('cap', '0') // hide caption
  params.set('sle', '0') // hide legend
  params.set('sxa', '0') // hide x-axis title
  params.set('dp', '2') // 2x device pixel ratio
  params.set('z', zoom.toString())
  params.set('width', width.toString())
  params.set('height', height.toString())

  if (darkMode) {
    params.set('dm', '1')
  }

  // Hide steep drop by default for thumbnails to avoid misleading charts
  if (hideSteepDrop) {
    params.set('hsd', '1')
  }

  return `/chart.png?${params.toString()}`
}

/**
 * Group presets by chart type for display
 */
export function groupPresetsByChartType(presets: DiscoveryPreset[]): Record<ChartType, DiscoveryPreset[]> {
  const grouped: Record<ChartType, DiscoveryPreset[]> = {
    weekly: [],
    monthly: [],
    quarterly: [],
    yearly: [],
    fluseason: []
  }

  for (const preset of presets) {
    grouped[preset.chartType].push(preset)
  }

  return grouped
}
