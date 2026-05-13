import type { CountryData, DatasetRaw } from '@/model'

export interface SourceSegment {
  source: string
  from: string
  to: string
  ageGroups?: string[]
}

export interface CountrySourceInfo {
  source: string
  ageGroups?: string[]
  segments: SourceSegment[]
  breakpointWarnings: string[]
}

function sortAgeGroups(ageGroups?: string[]): string[] | undefined {
  if (!ageGroups || ageGroups.length === 0) return undefined

  return [...ageGroups].sort((a, b) => {
    const numA = parseInt(a.split('-')[0] || a.replace('+', '')) || 0
    const numB = parseInt(b.split('-')[0] || b.replace('+', '')) || 0
    return numA - numB
  })
}

function getSourceValue(row: CountryData, metricType: string): string | undefined {
  if (metricType === 'asmr') {
    return row.source_asmr || row.source || undefined
  }

  return row.source || undefined
}

function buildBreakpointWarning(segments: SourceSegment[]): string[] {
  if (segments.length <= 1) return []

  const uniqueSources = new Set(segments.map(segment => segment.source))
  const uniqueAgeSchemas = new Set(
    segments.map(segment => JSON.stringify(segment.ageGroups ?? []))
  )
  const breakpoint = segments[1]?.from

  if (!breakpoint) return []

  const changedParts: string[] = []
  if (uniqueSources.size > 1) changedParts.push('source')
  if (uniqueAgeSchemas.size > 1) changedParts.push('age stratification')

  if (changedParts.length === 0) return []

  return [
    `Warning: ${changedParts.join(' and ')} change in ${breakpoint}; values across the breakpoint may not be directly comparable.`
  ]
}

export function extractCountrySourceInfoFromSeries(
  rows: CountryData[],
  metricType: string,
  selectedLabels?: string[],
  sourceAgeGroups?: Map<string, string[]>
): CountrySourceInfo | null {
  const selectedLabelSet = selectedLabels?.length ? new Set(selectedLabels) : null
  const candidateRows = rows.filter((row) => {
    const source = getSourceValue(row, metricType)
    if (!source) return false
    if (!selectedLabelSet) return true
    return selectedLabelSet.has(row.date)
  })

  const rowsToUse = candidateRows.length > 0
    ? candidateRows
    : rows.filter(row => !!getSourceValue(row, metricType))

  if (rowsToUse.length === 0) return null

  const segments: SourceSegment[] = []

  for (const row of rowsToUse) {
    const source = getSourceValue(row, metricType)
    if (!source) continue

    const ageGroups = sortAgeGroups(sourceAgeGroups?.get(source))
    const previousSegment = segments[segments.length - 1]
    const ageGroupsKey = JSON.stringify(ageGroups ?? [])
    const previousAgeGroupsKey = JSON.stringify(previousSegment?.ageGroups ?? [])

    if (
      previousSegment
      && previousSegment.source === source
      && ageGroupsKey === previousAgeGroupsKey
    ) {
      previousSegment.to = row.date
      continue
    }

    segments.push({
      source,
      from: row.date,
      to: row.date,
      ageGroups
    })
  }

  if (segments.length === 0) return null

  const latestSegment = segments[segments.length - 1]!

  return {
    source: latestSegment.source,
    ageGroups: latestSegment.ageGroups,
    segments,
    breakpointWarnings: buildBreakpointWarning(segments)
  }
}

export async function extractSourceInfoFromDataset(
  dataset: DatasetRaw,
  countries: string[],
  metricType: string,
  selectedLabels?: string[],
  getSourceAgeGroups?: (country: string) => Promise<Map<string, string[]>>
): Promise<Map<string, CountrySourceInfo>> {
  const result = new Map<string, CountrySourceInfo>()

  for (const country of countries) {
    const sourceAgeGroups = getSourceAgeGroups ? await getSourceAgeGroups(country) : undefined

    for (const ageGroup of Object.keys(dataset)) {
      const rows = dataset[ageGroup]?.[country]
      if (!rows || rows.length === 0) continue

      const info = extractCountrySourceInfoFromSeries(
        rows,
        metricType,
        selectedLabels,
        sourceAgeGroups
      )

      if (info) {
        result.set(country, info)
        break
      }
    }
  }

  return result
}
