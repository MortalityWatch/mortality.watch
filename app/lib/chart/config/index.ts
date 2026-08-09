/**
 * Chart Configuration Exports
 *
 * Re-exports all chart configuration functions for easy importing
 */

export { getLabelText, computeChartPrecision, extractYValues, resolveDecimals } from './chartLabels'
export { createTooltipCallbacks } from './chartTooltips'
export {
  createBackgroundPlugin,
  createOnResizeHandler,
  createDatalabelsConfig,
  createPluginsConfig,
  wrapTitleText
} from './chartPlugins'
export { createScalesConfig } from './chartScales'
