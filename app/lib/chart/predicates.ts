/**
 * Chart key predicates
 */

export const isBl = (key: string) => key.includes('_baseline')

export const isPredictionIntervalKey = (key: string) =>
  key.includes('_lower') || key.includes('_upper')
