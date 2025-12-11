/**
 * Miscellaneous utilities that don't fit into other categories
 */

import { datasetEntryKeys, type CountryData, type DatasetEntry } from '@/model'
import { color_scale_diverging_css } from '@/lib/chart/chartColors'
import { CSS_CLASSES } from '@/lib/config/constants'

export const getObjectOfArrays = (rows: CountryData[]): DatasetEntry => {
  const result = {} as Record<keyof DatasetEntry, unknown[]>

  if (!rows || rows.length < 1) return result as DatasetEntry

  for (const key of datasetEntryKeys) {
    result[key] = []
  }

  for (const row of rows) {
    for (const key of Object.keys(row) as (keyof CountryData)[]) {
      result[key]?.push(row[key])
    }
  }

  return result as DatasetEntry
}

export const getByValue = (
  map: Record<string, string>,
  searchValue: string
) => {
  for (const [key, value] of Object.entries(map)) {
    if (value === searchValue) return key
  }
}

export const getColor = (value: number) => {
  const colors = color_scale_diverging_css()
  if (!value || isNaN(value) || value === Number.MIN_SAFE_INTEGER)
    return CSS_CLASSES.COLOR_SCALE_NA
  const n = colors.length
  if (value <= -0.5) return colors[0]
  if (value >= 0.5) return colors[n - 1]
  const col_index = (value + 0.5) * n
  const idx = Math.floor(col_index)
  return colors[idx]
}

const DATA_TYPE_MAP: Record<string, string> = {
  1: 'yearly',
  2: 'monthly',
  3: 'weekly'
} as const

export const getDataTypeDescription = (type: string): string => {
  return DATA_TYPE_MAP[type] ?? type
}
