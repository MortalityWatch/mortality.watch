import type { CountryData, DatasetRaw } from '~/model'
import { fromYearMonthString, left, right } from '~/utils'

/**
 * Sort labels based on chart type
 */
export const getLabels = (chartType: string, labels: string[]): string[] => {
  let labelsArr: string[]
  if (chartType === 'monthly') {
    labelsArr = labels.sort((a: string, b: string) => {
      return fromYearMonthString(a) - fromYearMonthString(b)
    }) as string[]
  } else {
    labelsArr = labels.sort() as string[]
  }
  return labelsArr
}

/**
 * Get empty label filter key based on chart type
 */
const getEmptyLabelFilterKey = (isAsmrType: boolean): keyof CountryData => {
  let key = 'cmr'
  if (isAsmrType) key = 'asmr_who'
  return key as keyof CountryData
}

/**
 * Get all unique chart labels from raw data with optional filtering
 */
export const getAllChartLabels = (
  rawData: DatasetRaw,
  isAsmrType: boolean,
  ageGroupFilter?: string[],
  countryCodeFilter?: string[],
  chartType?: string
): string[] => {
  const allLabels = new Set<string>()
  const ageGroups = ageGroupFilter ?? Object.keys(rawData || {})
  const countryCodes = countryCodeFilter ?? Object.keys(rawData.all ?? {})
  const type = getEmptyLabelFilterKey(isAsmrType)

  for (const ag of ageGroups) {
    for (const iso3c of countryCodes) {
      if (!rawData[ag] || !rawData[ag][iso3c]) continue
      rawData[ag][iso3c].forEach((el) => {
        if (el[type] !== undefined) allLabels.add(el.date)
      })
    }
  }

  const result = Array.from(allLabels)
  if (chartType === 'monthly') {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ]
    const customSort = (a: string, b: string) => {
      const x = parseInt(left(a, 4), 10) + months.indexOf(right(a, 3)) / 12
      const y = parseInt(left(b, 4), 10) + months.indexOf(right(b, 3)) / 12
      return x - y
    }

    return result.sort(customSort)
  }
  return result.sort()
}

/**
 * Get start index from labels array
 */
export const getStartIndex = (
  allYearlyChartLabels: string[],
  sliderStart: string
): number => {
  if (!allYearlyChartLabels) return 0
  let i = 0
  for (const value of allYearlyChartLabels) {
    if (value === sliderStart) return i
    i++
  }
  return 0
}
