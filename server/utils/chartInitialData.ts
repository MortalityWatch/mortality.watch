import { dataLoader } from '../services/dataLoader'
import {
  resolveChartStateForRendering,
  type ChartRenderState
} from '../../app/lib/state/resolution'

type ChartDataLoader = Pick<typeof dataLoader, 'loadMortalityData' | 'getAllChartLabels'>

export interface InitialChartData {
  queryParams: Record<string, string | string[]>
  preliminaryState: ChartRenderState
  allLabels: string[]
  isAsmrType: boolean
}

const IMPLICIT_CHART_TYPE_FALLBACKS: Record<string, string[]> = {
  fluseason: ['yearly'],
  midyear: ['yearly']
}

function hasExplicitChartType(queryParams: Record<string, string | string[]>): boolean {
  return queryParams.ct !== undefined
}

function getFallbackQueryParams(
  queryParams: Record<string, string | string[]>,
  chartType: string
): Array<Record<string, string | string[]>> {
  if (hasExplicitChartType(queryParams)) {
    return []
  }

  return (IMPLICIT_CHART_TYPE_FALLBACKS[chartType] ?? []).map(fallbackChartType => ({
    ...queryParams,
    ct: fallbackChartType
  }))
}

function makeNoDataError(preliminaryState: ChartRenderState): Error {
  const countriesStr = preliminaryState.countries.join(', ')
  return new Error(
    `No data available for ${countriesStr} (${preliminaryState.chartType}). `
    + 'The requested data may not exist or failed to load.'
  )
}

function isFallbackEligibleError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('404') || message.includes('No data available')
}

/**
 * Resolve enough chart state to load the initial dataset and labels.
 *
 * URLs without an explicit chart type inherit the explorer default. Some country
 * pairs do not have files for that default aggregation, so SSR retries with a
 * compatible yearly aggregation before treating the request as unrenderable.
 */
export async function loadInitialChartDataForRendering(
  queryParams: Record<string, string | string[]>,
  loader: ChartDataLoader = dataLoader
): Promise<InitialChartData> {
  const attempts: Array<Record<string, string | string[]>> = [queryParams]
  let lastError: unknown

  for (let i = 0; i < attempts.length; i += 1) {
    const attemptQueryParams = attempts[i]!
    const preliminaryState = resolveChartStateForRendering(attemptQueryParams, [])

    try {
      const rawData = await loader.loadMortalityData({
        chartType: preliminaryState.chartType,
        countries: preliminaryState.countries,
        ageGroups: preliminaryState.ageGroups
      })

      const isAsmrType = preliminaryState.type.startsWith('asmr')
      const allLabels = loader.getAllChartLabels(
        rawData,
        isAsmrType,
        preliminaryState.ageGroups,
        preliminaryState.countries,
        preliminaryState.chartType
      )

      if (allLabels.length === 0) {
        throw makeNoDataError(preliminaryState)
      }

      return {
        queryParams: attemptQueryParams,
        preliminaryState,
        allLabels,
        isAsmrType
      }
    } catch (error) {
      lastError = error

      if (isFallbackEligibleError(error)) {
        for (const fallbackQueryParams of getFallbackQueryParams(attemptQueryParams, preliminaryState.chartType)) {
          attempts.push(fallbackQueryParams)
        }
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}
