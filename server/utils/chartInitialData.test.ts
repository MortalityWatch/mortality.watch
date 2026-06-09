import { describe, expect, it, vi } from 'vitest'
import { loadInitialChartDataForRendering } from './chartInitialData'

function createLoader() {
  return {
    loadMortalityData: vi.fn(),
    getAllChartLabels: vi.fn()
  }
}

describe('loadInitialChartDataForRendering', () => {
  it('falls back to yearly when the implicit default chart type has no data', async () => {
    const loader = createLoader()
    loader.loadMortalityData
      .mockRejectedValueOnce(new Error('Failed to fetch mortality data from S3: 404 Not Found'))
      .mockResolvedValueOnce({ all: { AUS: [{ date: '2010' }], SWE: [{ date: '2010' }] } })
    loader.getAllChartLabels.mockReturnValueOnce(['2010', '2011'])

    const result = await loadInitialChartDataForRendering(
      { c: 'SWE,AUS', t: 'le', df: '2010/11', dt: '2024/25' },
      loader
    )

    expect(loader.loadMortalityData).toHaveBeenCalledTimes(2)
    expect(loader.loadMortalityData).toHaveBeenNthCalledWith(1, {
      chartType: 'fluseason',
      countries: ['SWE', 'AUS'],
      ageGroups: ['all']
    })
    expect(loader.loadMortalityData).toHaveBeenNthCalledWith(2, {
      chartType: 'yearly',
      countries: ['SWE', 'AUS'],
      ageGroups: ['all']
    })
    expect(result.queryParams).toEqual({
      c: 'SWE,AUS',
      t: 'le',
      df: '2010/11',
      dt: '2024/25',
      ct: 'yearly'
    })
    expect(result.preliminaryState.chartType).toBe('yearly')
    expect(result.allLabels).toEqual(['2010', '2011'])
  })

  it('does not fall back when chart type is explicit', async () => {
    const loader = createLoader()
    const error = new Error('Failed to fetch mortality data from S3: 404 Not Found')
    loader.loadMortalityData.mockRejectedValueOnce(error)

    await expect(loadInitialChartDataForRendering(
      { c: 'SWE,AUS', t: 'le', ct: 'fluseason', df: '2010/11', dt: '2024/25' },
      loader
    )).rejects.toThrow(error)

    expect(loader.loadMortalityData).toHaveBeenCalledTimes(1)
    expect(loader.loadMortalityData).toHaveBeenCalledWith({
      chartType: 'fluseason',
      countries: ['SWE', 'AUS'],
      ageGroups: ['all']
    })
  })

  it('does not fall back for non-availability errors', async () => {
    const loader = createLoader()
    const error = new Error('S3 request timed out')
    loader.loadMortalityData.mockRejectedValueOnce(error)

    await expect(loadInitialChartDataForRendering(
      { c: 'SWE,AUS', t: 'le', df: '2010/11', dt: '2024/25' },
      loader
    )).rejects.toThrow(error)

    expect(loader.loadMortalityData).toHaveBeenCalledTimes(1)
  })
})
