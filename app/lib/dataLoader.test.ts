import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DataLoader } from './dataLoader'

describe('DataLoader', () => {
  let loader: DataLoader

  beforeEach(() => {
    loader = new DataLoader()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('fetchMetadata', () => {
    it('should fetch metadata successfully', async () => {
      const mockResponse = 'iso3c,name,source\nUSA,United States,cdc'
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockResponse
      })

      const result = await loader.fetchMetadata()

      expect(result).toBe(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('world_meta.csv'))
    })

    it('should throw error on failed fetch', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await expect(loader.fetchMetadata()).rejects.toThrow('Failed to fetch metadata: 404 Not Found')
    })
  })

  describe('fetchData', () => {
    it('should fetch country data with "all" age group', async () => {
      const mockData = 'date,deaths,cmr\n2020-01,1000,10.5'
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockData
      })

      const result = await loader.fetchData('USA', 'weekly', 'all')

      expect(result).toBe(mockData)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('USA/weekly.csv'),
        expect.any(Object)
      )
    })

    it('should fetch country data with specific age group', async () => {
      const mockData = 'date,deaths,cmr\n2020-01,500,5.0'
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockData
      })

      const result = await loader.fetchData('GBR', 'monthly', '65-74')

      expect(result).toBe(mockData)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('GBR/monthly_65-74.csv'),
        expect.any(Object)
      )
    })

    it('should throw error on failed fetch', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      await expect(loader.fetchData('USA', 'weekly', 'all')).rejects.toThrow(
        'Failed to fetch data for USA/weekly/all: 500'
      )
    })

    it('should include timeout in fetch options', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => 'data'
      })

      await loader.fetchData('USA', 'weekly', 'all')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal)
        })
      )
    })
  })

  describe('fetchBaseline', () => {
    it('should fetch baseline data from external URL', async () => {
      const mockResponse = '{"y":[1,2,3],"lower":[0.5,1.5,2.5],"upper":[1.5,2.5,3.5]}'
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => mockResponse
      })

      const url = 'https://stats.mortality.watch/?y=1,2,3&h=5'
      const result = await loader.fetchBaseline(url)

      expect(result).toBe(mockResponse)
      // Check that fetch was called with the URL (signal is added by implementation)
      expect(global.fetch).toHaveBeenCalledWith(url, expect.objectContaining({
        signal: expect.any(AbortSignal)
      }))
    })

    it('should throw error on failed baseline fetch', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      })

      // Implementation throws "HTTP ${status}: ${statusText}"
      await expect(loader.fetchBaseline('https://stats.mortality.watch/?y=1,2,3'))
        .rejects.toThrow('HTTP 503: Service Unavailable')
    })

    it('should handle timeout with AbortError', async () => {
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'

      global.fetch = vi.fn().mockRejectedValue(abortError)

      await expect(loader.fetchBaseline('https://stats.mortality.watch/?y=1,2,3'))
        .rejects.toThrow('Baseline calculation timeout after 10s')
    })

    it('should retry on network errors', async () => {
      const networkError = new Error('Network error')

      // Fail twice, succeed on third attempt
      global.fetch = vi.fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          ok: true,
          text: async () => '{"result":"success"}'
        })

      const result = await loader.fetchBaseline('https://stats.mortality.watch/?y=1,2,3')

      expect(result).toBe('{"result":"success"}')
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('should throw error after max retries', async () => {
      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)

      await expect(loader.fetchBaseline('https://stats.mortality.watch/?y=1,2,3'))
        .rejects.toThrow('Network error')

      // Should try 3 times (initial + 2 retries)
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('should respect custom retry count', async () => {
      const networkError = new Error('Network error')
      global.fetch = vi.fn().mockRejectedValue(networkError)

      await expect(loader.fetchBaseline('https://stats.mortality.watch/?y=1,2,3', 0))
        .rejects.toThrow('Network error')

      // Should only try once (no retries)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })
})
