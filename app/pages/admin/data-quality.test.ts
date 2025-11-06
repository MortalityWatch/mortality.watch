/**
 * Unit tests for admin data-quality page
 *
 * Test coverage:
 * - Component rendering and initialization
 * - Filtering logic (country, date range, quality scores)
 * - Override management (CRUD operations)
 * - Table features (pagination, sorting, selection)
 * - Edge cases (empty states, errors, loading)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref, computed, nextTick } from 'vue'
import { useDataQualityFilters } from '~/composables/useDataQualityFilters'
import { useDataQualityOverrides } from '~/composables/useDataQualityOverrides'
import { useDataQualityTable } from '~/composables/useDataQualityTable'
import type { DataQualityReport, CountryQuality } from '~/composables/useDataQualityFilters'

// Mock $fetch globally
interface GlobalWithMocks {
  $fetch: ReturnType<typeof vi.fn>
  useToast: ReturnType<typeof vi.fn>
}

const globalMock = global as unknown as GlobalWithMocks
globalMock.$fetch = vi.fn()

// Mock useToast composable - needs to be global
const mockToastAdd = vi.fn()
globalMock.useToast = vi.fn(() => ({
  add: mockToastAdd
}))

// Helper to create mock report data
const createMockReport = (overrides?: Partial<DataQualityReport>): DataQualityReport => ({
  success: true,
  timestamp: '2025-11-04T00:00:00.000Z',
  summary: {
    total: 3,
    fresh: 2,
    stale: 1,
    medianFreshDays: 5,
    medianStaleDays: 45,
    mostStaleCountry: {
      iso3c: 'USA',
      jurisdiction: 'United States',
      daysSinceUpdate: 45
    },
    mostRecentUpdate: 1
  },
  countries: [
    {
      iso3c: 'USA',
      jurisdiction: 'United States',
      lastUpdate: '2024-09-20',
      lastUpdateTimestamp: 1726790400000,
      daysSinceUpdate: 45,
      status: 'stale',
      overrideStatus: 'monitor',
      dataSource: 'cdc-nchs',
      type: 'deaths',
      ageGroups: '0-14, 15-64, 65+',
      minDate: '2015'
    },
    {
      iso3c: 'GBR',
      jurisdiction: 'United Kingdom',
      lastUpdate: '2024-10-30',
      lastUpdateTimestamp: 1730246400000,
      daysSinceUpdate: 5,
      status: 'fresh',
      overrideStatus: 'monitor',
      dataSource: 'eurostat',
      type: 'deaths',
      ageGroups: 'all',
      minDate: '2010'
    },
    {
      iso3c: 'DEU',
      jurisdiction: 'Germany',
      lastUpdate: '2024-10-29',
      lastUpdateTimestamp: 1730160000000,
      daysSinceUpdate: 6,
      status: 'fresh',
      overrideStatus: 'muted',
      dataSource: 'destatis',
      type: 'deaths',
      ageGroups: 'all',
      minDate: '2016'
    }
  ],
  ...overrides
})

// Helper to create mock country data
const createMockCountry = (overrides?: Partial<CountryQuality>): CountryQuality => ({
  iso3c: 'USA',
  jurisdiction: 'United States',
  lastUpdate: '2024-09-20',
  lastUpdateTimestamp: 1726790400000,
  daysSinceUpdate: 45,
  status: 'stale',
  overrideStatus: 'monitor',
  dataSource: 'cdc-nchs',
  type: 'deaths',
  ageGroups: '0-14, 15-64, 65+',
  minDate: '2015',
  ...overrides
})

describe('admin data-quality page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // COMPOSABLE: useDataQualityFilters
  // ============================================================================

  describe('useDataQualityFilters composable', () => {
    describe('initialization', () => {
      it('should initialize with default filter values', () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        expect(filters.searchQuery.value).toBe('')
        expect(filters.statusFilter.value).toBe('all')
        expect(filters.sourceFilter.value).toBe('all')
        expect(filters.showMuted.value).toBe(true)
        expect(filters.showHidden.value).toBe(false)
      })

      it('should provide status filter options', () => {
        const report = ref<DataQualityReport | null>(null)
        const filters = useDataQualityFilters(report)

        expect(filters.statusOptions).toHaveLength(3)
        expect(filters.statusOptions).toContainEqual({ label: 'All Statuses', value: 'all' })
        expect(filters.statusOptions).toContainEqual({ label: 'Fresh', value: 'fresh' })
        expect(filters.statusOptions).toContainEqual({ label: 'Stale', value: 'stale' })
      })

      it('should compute unique sources from report', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        await nextTick()

        expect(filters.uniqueSources.value).toContain('cdc-nchs')
        expect(filters.uniqueSources.value).toContain('eurostat')
        expect(filters.uniqueSources.value).toContain('destatis')
      })

      it('should provide source filter options', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        await nextTick()

        expect(filters.sourceOptions.value).toHaveLength(4) // 'All Sources' + 3 unique sources
        expect(filters.sourceOptions.value[0]).toEqual({ label: 'All Sources', value: 'all' })
      })
    })

    describe('search filtering', () => {
      it('should filter by jurisdiction name', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        filters.searchQuery.value = 'United States'
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(1)
        expect(filters.filteredCountries.value[0]!.iso3c).toBe('USA')
      })

      it('should filter by ISO code', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        filters.searchQuery.value = 'GBR'
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(1)
        expect(filters.filteredCountries.value[0]!.jurisdiction).toBe('United Kingdom')
      })

      it('should be case-insensitive', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        filters.searchQuery.value = 'germany'
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(1)
        expect(filters.filteredCountries.value[0]!.iso3c).toBe('DEU')
      })

      it('should return empty array when no matches', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        filters.searchQuery.value = 'XYZ'
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(0)
      })

      it('should handle partial matches', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        filters.searchQuery.value = 'Unit'
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(2) // United States, United Kingdom
      })
    })

    describe('status filtering', () => {
      it('should filter by fresh status', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        filters.statusFilter.value = 'fresh'
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(2)
        expect(filters.filteredCountries.value.every(c => c.status === 'fresh')).toBe(true)
      })

      it('should filter by stale status', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        filters.statusFilter.value = 'stale'
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(1)
        expect(filters.filteredCountries.value[0]!.status).toBe('stale')
      })

      it('should show all when status is all', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        filters.statusFilter.value = 'all'
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(3)
      })
    })

    describe('source filtering', () => {
      it('should filter by specific source', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        filters.sourceFilter.value = 'eurostat'
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(1)
        expect(filters.filteredCountries.value[0]!.dataSource).toBe('eurostat')
      })

      it('should show all when source is all', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        filters.sourceFilter.value = 'all'
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(3)
      })
    })

    describe('override visibility filtering', () => {
      it('should hide muted entries when showMuted is false', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        filters.showMuted.value = false
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(2) // USA and GBR
        expect(filters.filteredCountries.value.every(c => c.overrideStatus !== 'muted')).toBe(true)
      })

      it('should show muted entries when showMuted is true', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        filters.showMuted.value = true
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(3)
      })

      it('should hide hidden entries when showHidden is false', async () => {
        const mockReport = createMockReport()
        mockReport.countries[0]!.overrideStatus = 'hidden'
        const report = ref<DataQualityReport | null>(mockReport)
        const filters = useDataQualityFilters(report)

        filters.showHidden.value = false
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(2) // GBR and DEU
        expect(filters.filteredCountries.value.every(c => c.overrideStatus !== 'hidden')).toBe(true)
      })

      it('should show hidden entries when showHidden is true', async () => {
        const mockReport = createMockReport()
        mockReport.countries[0]!.overrideStatus = 'hidden'
        const report = ref<DataQualityReport | null>(mockReport)
        const filters = useDataQualityFilters(report)

        filters.showHidden.value = true
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(3)
      })
    })

    describe('combined filtering', () => {
      it('should apply multiple filters together', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        filters.searchQuery.value = 'Unit'
        filters.statusFilter.value = 'fresh'
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(1)
        expect(filters.filteredCountries.value[0]!.iso3c).toBe('GBR')
      })

      it('should handle all filters at once', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        filters.searchQuery.value = 'Germany'
        filters.statusFilter.value = 'fresh'
        filters.sourceFilter.value = 'destatis'
        filters.showMuted.value = true
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(1)
        expect(filters.filteredCountries.value[0]!.iso3c).toBe('DEU')
      })

      it('should return empty array when filters exclude all', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        filters.statusFilter.value = 'fresh'
        filters.sourceFilter.value = 'cdc-nchs' // CDC is stale in mock data
        await nextTick()

        expect(filters.filteredCountries.value).toHaveLength(0)
      })
    })

    describe('filter change callback', () => {
      it('should call onFilterChange when search query changes', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const callback = vi.fn()
        const filters = useDataQualityFilters(report, callback)

        filters.searchQuery.value = 'test'
        await nextTick()

        expect(callback).toHaveBeenCalled()
      })

      it('should call onFilterChange when status changes', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const callback = vi.fn()
        const filters = useDataQualityFilters(report, callback)

        filters.statusFilter.value = 'fresh'
        await nextTick()

        expect(callback).toHaveBeenCalled()
      })

      it('should call onFilterChange when source changes', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const callback = vi.fn()
        const filters = useDataQualityFilters(report, callback)

        filters.sourceFilter.value = 'eurostat'
        await nextTick()

        expect(callback).toHaveBeenCalled()
      })

      it('should call onFilterChange when visibility toggles change', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const callback = vi.fn()
        const filters = useDataQualityFilters(report, callback)

        filters.showMuted.value = false
        await nextTick()

        expect(callback).toHaveBeenCalled()
      })
    })

    describe('edge cases', () => {
      it('should handle null report', () => {
        const report = ref<DataQualityReport | null>(null)
        const filters = useDataQualityFilters(report)

        expect(filters.filteredCountries.value).toEqual([])
        expect(filters.uniqueSources.value).toEqual([])
      })

      it('should handle empty countries array', () => {
        const mockReport = createMockReport({ countries: [] })
        const report = ref<DataQualityReport | null>(mockReport)
        const filters = useDataQualityFilters(report)

        expect(filters.filteredCountries.value).toEqual([])
      })

      it('should handle report becoming null after initialization', async () => {
        const report = ref<DataQualityReport | null>(createMockReport())
        const filters = useDataQualityFilters(report)

        expect(filters.filteredCountries.value).toHaveLength(3)

        report.value = null
        await nextTick()

        expect(filters.filteredCountries.value).toEqual([])
      })
    })

    describe('getReadableSourceName helper', () => {
      it('should return readable source names', () => {
        const report = ref<DataQualityReport | null>(null)
        const filters = useDataQualityFilters(report)

        // The function should return a readable name
        const name = filters.getReadableSourceName('cdc-nchs')
        expect(typeof name).toBe('string')
        expect(name.length).toBeGreaterThan(0)
      })

      it('should handle unknown sources', () => {
        const report = ref<DataQualityReport | null>(null)
        const filters = useDataQualityFilters(report)

        const name = filters.getReadableSourceName('unknown-source')
        expect(name).toBe('unknown-source')
      })
    })
  })

  // ============================================================================
  // COMPOSABLE: useDataQualityOverrides
  // ============================================================================

  describe('useDataQualityOverrides composable', () => {
    describe('override status cycling', () => {
      it('should cycle from monitor to muted', async () => {
        const mockCountry = createMockCountry({ overrideStatus: 'monitor' })
        const filteredCountries = computed(() => [mockCountry])
        const overrides = useDataQualityOverrides(filteredCountries)

        vi.mocked(globalMock.$fetch).mockResolvedValue({ success: true })

        await overrides.cycleOverrideStatus(mockCountry)
        await nextTick()

        expect(globalMock.$fetch).toHaveBeenCalledWith('/api/admin/data-quality-override', {
          method: 'POST',
          body: {
            iso3c: 'USA',
            source: 'cdc-nchs',
            status: 'muted'
          }
        })
        expect(mockCountry.overrideStatus).toBe('muted')
      })

      it('should cycle from muted to hidden', async () => {
        const mockCountry = createMockCountry({ overrideStatus: 'muted' })
        const filteredCountries = computed(() => [mockCountry])
        const overrides = useDataQualityOverrides(filteredCountries)

        vi.mocked(globalMock.$fetch).mockResolvedValue({ success: true })

        await overrides.cycleOverrideStatus(mockCountry)
        await nextTick()

        expect(globalMock.$fetch).toHaveBeenCalledWith('/api/admin/data-quality-override', {
          method: 'POST',
          body: {
            iso3c: 'USA',
            source: 'cdc-nchs',
            status: 'hidden'
          }
        })
        expect(mockCountry.overrideStatus).toBe('hidden')
      })

      it('should cycle from hidden to monitor', async () => {
        const mockCountry = createMockCountry({ overrideStatus: 'hidden' })
        const filteredCountries = computed(() => [mockCountry])
        const overrides = useDataQualityOverrides(filteredCountries)

        vi.mocked(globalMock.$fetch).mockResolvedValue({ success: true })

        await overrides.cycleOverrideStatus(mockCountry)
        await nextTick()

        expect(globalMock.$fetch).toHaveBeenCalledWith('/api/admin/data-quality-override', {
          method: 'POST',
          body: {
            iso3c: 'USA',
            source: 'cdc-nchs',
            status: 'monitor'
          }
        })
        expect(mockCountry.overrideStatus).toBe('monitor')
      })
    })

    describe('jurisdiction override cycling', () => {
      it('should cycle all entries for a jurisdiction', async () => {
        const countries = [
          createMockCountry({ iso3c: 'USA', jurisdiction: 'United States', overrideStatus: 'monitor' }),
          createMockCountry({ iso3c: 'USA', jurisdiction: 'United States', dataSource: 'hmd', overrideStatus: 'monitor' })
        ]
        const filteredCountries = computed(() => countries)
        const overrides = useDataQualityOverrides(filteredCountries)

        vi.mocked(globalMock.$fetch).mockResolvedValue({ success: true })

        await overrides.cycleJurisdictionOverride('United States')
        await nextTick()

        expect(globalMock.$fetch).toHaveBeenCalledTimes(2)
        expect(countries[0]!.overrideStatus).toBe('muted')
        expect(countries[1]!.overrideStatus).toBe('muted')
      })

      it('should do nothing for non-existent jurisdiction', async () => {
        const filteredCountries = computed(() => [createMockCountry()])
        const overrides = useDataQualityOverrides(filteredCountries)

        vi.mocked(globalMock.$fetch).mockResolvedValue({ success: true })

        overrides.cycleJurisdictionOverride('Non-existent')
        await nextTick()

        expect(globalMock.$fetch).not.toHaveBeenCalled()
      })

      it('should cycle based on most common status', async () => {
        const countries = [
          createMockCountry({ iso3c: 'USA', jurisdiction: 'United States', overrideStatus: 'muted' }),
          createMockCountry({ iso3c: 'USA', jurisdiction: 'United States', dataSource: 'hmd', overrideStatus: 'muted' }),
          createMockCountry({ iso3c: 'USA', jurisdiction: 'United States', dataSource: 'eurostat', overrideStatus: 'monitor' })
        ]
        const filteredCountries = computed(() => countries)
        const overrides = useDataQualityOverrides(filteredCountries)

        vi.mocked(globalMock.$fetch).mockResolvedValue({ success: true })

        // Most common is 'muted' (2 out of 3), so should cycle to 'hidden'
        await overrides.cycleJurisdictionOverride('United States')
        await nextTick()

        expect(countries[0]!.overrideStatus).toBe('hidden')
        expect(countries[1]!.overrideStatus).toBe('hidden')
        expect(countries[2]!.overrideStatus).toBe('hidden')
      })
    })

    describe('getMostCommonOverrideStatus', () => {
      it('should return most common status', () => {
        const countries = [
          createMockCountry({ jurisdiction: 'United States', overrideStatus: 'monitor' }),
          createMockCountry({ jurisdiction: 'United States', overrideStatus: 'monitor' }),
          createMockCountry({ jurisdiction: 'United States', overrideStatus: 'muted' })
        ]
        const filteredCountries = computed(() => countries)
        const overrides = useDataQualityOverrides(filteredCountries)

        const status = overrides.getMostCommonOverrideStatus('United States')
        expect(status).toBe('monitor')
      })

      it('should return first status when there is a tie', () => {
        const countries = [
          createMockCountry({ jurisdiction: 'United States', overrideStatus: 'monitor' }),
          createMockCountry({ jurisdiction: 'United States', overrideStatus: 'hidden' })
        ]
        const filteredCountries = computed(() => countries)
        const overrides = useDataQualityOverrides(filteredCountries)

        const status = overrides.getMostCommonOverrideStatus('United States')
        // With a tie (1 monitor, 1 hidden), the implementation uses > not >=
        // so it returns 'monitor' (the first/default value)
        expect(status).toBe('monitor')
      })

      it('should return monitor for empty jurisdiction', () => {
        const filteredCountries = computed(() => [createMockCountry()])
        const overrides = useDataQualityOverrides(filteredCountries)

        const status = overrides.getMostCommonOverrideStatus('Non-existent')
        expect(status).toBe('monitor')
      })
    })

    describe('getOverrideIcon', () => {
      it('should return bell icon for monitor status', () => {
        const filteredCountries = computed(() => [])
        const overrides = useDataQualityOverrides(filteredCountries)

        const icon = overrides.getOverrideIcon('monitor')
        expect(icon).toBe('i-lucide-bell')
      })

      it('should return bell-off icon for muted status', () => {
        const filteredCountries = computed(() => [])
        const overrides = useDataQualityOverrides(filteredCountries)

        const icon = overrides.getOverrideIcon('muted')
        expect(icon).toBe('i-lucide-bell-off')
      })

      it('should return eye-off icon for hidden status', () => {
        const filteredCountries = computed(() => [])
        const overrides = useDataQualityOverrides(filteredCountries)

        const icon = overrides.getOverrideIcon('hidden')
        expect(icon).toBe('i-lucide-eye-off')
      })
    })

    describe('error handling', () => {
      it('should handle API errors gracefully', async () => {
        const mockCountry = createMockCountry()
        const filteredCountries = computed(() => [mockCountry])
        const overrides = useDataQualityOverrides(filteredCountries)

        vi.mocked(globalMock.$fetch).mockRejectedValue(new Error('Network error'))

        await overrides.cycleOverrideStatus(mockCountry)
        await nextTick()

        // Should not update local state on error
        expect(mockCountry.overrideStatus).toBe('monitor')
      })
    })
  })

  // ============================================================================
  // COMPOSABLE: useDataQualityTable
  // ============================================================================

  describe('useDataQualityTable composable', () => {
    describe('table configuration', () => {
      it('should provide table columns', () => {
        const filteredCountries = computed(() => [createMockCountry()])
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        expect(table.columns).toBeDefined()
        expect(table.columns.length).toBeGreaterThan(0)
      })

      it('should provide grouping options', () => {
        const filteredCountries = computed(() => [createMockCountry()])
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        expect(table.groupingOptions).toBeDefined()
        expect(table.groupingOptions.groupedColumnMode).toBe('remove')
      })
    })

    describe('getStatusCounts', () => {
      it('should count fresh and stale statuses', () => {
        const countries = [
          createMockCountry({ jurisdiction: 'United States', status: 'fresh' }),
          createMockCountry({ jurisdiction: 'United States', status: 'fresh' }),
          createMockCountry({ jurisdiction: 'United States', status: 'stale' })
        ]
        const filteredCountries = computed(() => countries)
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        const counts = table.getStatusCounts('United States')
        expect(counts.fresh).toBe(2)
        expect(counts.stale).toBe(1)
      })

      it('should return zero counts for non-existent jurisdiction', () => {
        const filteredCountries = computed(() => [createMockCountry()])
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        const counts = table.getStatusCounts('Non-existent')
        expect(counts.fresh).toBe(0)
        expect(counts.stale).toBe(0)
      })
    })

    describe('getStatusColor', () => {
      it('should return green color for fresh status', () => {
        const filteredCountries = computed(() => [])
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        const color = table.getStatusColor('fresh')
        expect(color).toContain('green')
      })

      it('should return red color for stale status', () => {
        const filteredCountries = computed(() => [])
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        const color = table.getStatusColor('stale')
        expect(color).toContain('red')
      })

      it('should return gray color for unknown status', () => {
        const filteredCountries = computed(() => [])
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        const color = table.getStatusColor('unknown')
        expect(color).toContain('gray')
      })
    })

    describe('formatDate', () => {
      it('should format dates correctly', () => {
        const filteredCountries = computed(() => [])
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        const formatted = table.formatDate('2024-11-04')
        expect(formatted).toMatch(/Nov/)
        expect(formatted).toMatch(/2024/)
      })

      it('should handle invalid dates', () => {
        const filteredCountries = computed(() => [])
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        const formatted = table.formatDate('invalid-date')
        expect(typeof formatted).toBe('string')
      })
    })

    describe('formatDaysSince', () => {
      it('should format days under 30 as days', () => {
        const filteredCountries = computed(() => [])
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        expect(table.formatDaysSince(15)).toBe('15d')
      })

      it('should format days under 365 as months', () => {
        const filteredCountries = computed(() => [])
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        expect(table.formatDaysSince(60)).toBe('2m')
      })

      it('should format days over 365 as years', () => {
        const filteredCountries = computed(() => [])
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        expect(table.formatDaysSince(400)).toBe('1y 1m')
      })

      it('should format exact years without months', () => {
        const filteredCountries = computed(() => [])
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        expect(table.formatDaysSince(365)).toBe('1y')
      })

      it('should handle zero days', () => {
        const filteredCountries = computed(() => [])
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        expect(table.formatDaysSince(0)).toBe('0d')
      })
    })

    describe('getMostStaleDays', () => {
      it('should return highest days since update', () => {
        const countries = [
          createMockCountry({ jurisdiction: 'United States', daysSinceUpdate: 10 }),
          createMockCountry({ jurisdiction: 'United States', daysSinceUpdate: 45 }),
          createMockCountry({ jurisdiction: 'United States', daysSinceUpdate: 20 })
        ]
        const filteredCountries = computed(() => countries)
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        const mostStale = table.getMostStaleDays('United States')
        expect(mostStale).toBe(45)
      })

      it('should return 0 for non-existent jurisdiction', () => {
        const filteredCountries = computed(() => [createMockCountry()])
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        const mostStale = table.getMostStaleDays('Non-existent')
        expect(mostStale).toBe(0)
      })

      it('should handle single entry', () => {
        const countries = [
          createMockCountry({ jurisdiction: 'United States', daysSinceUpdate: 30 })
        ]
        const filteredCountries = computed(() => countries)
        const getReadableSourceName = (source: string) => source
        const table = useDataQualityTable(filteredCountries, getReadableSourceName)

        const mostStale = table.getMostStaleDays('United States')
        expect(mostStale).toBe(30)
      })
    })
  })

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('integration tests', () => {
    it('should handle full workflow: filter, update override, verify', async () => {
      const report = ref<DataQualityReport | null>(createMockReport())
      const filters = useDataQualityFilters(report)
      const overrides = useDataQualityOverrides(filters.filteredCountries)

      vi.mocked(globalMock.$fetch).mockResolvedValue({ success: true })

      // Start with all countries
      expect(filters.filteredCountries.value).toHaveLength(3)

      // Filter to only USA
      filters.searchQuery.value = 'USA'
      await nextTick()
      expect(filters.filteredCountries.value).toHaveLength(1)

      // Update override status
      const country = filters.filteredCountries.value[0]!
      await overrides.cycleOverrideStatus(country)
      await nextTick()
      expect(country.overrideStatus).toBe('muted')

      // Hide muted entries
      filters.showMuted.value = false
      await nextTick()
      expect(filters.filteredCountries.value).toHaveLength(0)
    })

    it('should handle multiple simultaneous filters', async () => {
      const report = ref<DataQualityReport | null>(createMockReport())
      const filters = useDataQualityFilters(report)

      filters.statusFilter.value = 'fresh'
      filters.showMuted.value = false
      await nextTick()

      expect(filters.filteredCountries.value).toHaveLength(1)
      expect(filters.filteredCountries.value[0]!.iso3c).toBe('GBR')
    })

    it('should update table display when filters change', async () => {
      const report = ref<DataQualityReport | null>(createMockReport())
      const filters = useDataQualityFilters(report)
      const getReadableSourceName = (source: string) => source
      const table = useDataQualityTable(filters.filteredCountries, getReadableSourceName)

      // Initial state
      let counts = table.getStatusCounts('United States')
      expect(counts.fresh).toBe(0)
      expect(counts.stale).toBe(1)

      // Filter to fresh only
      filters.statusFilter.value = 'fresh'
      await nextTick()

      // United States should now have 0 entries
      counts = table.getStatusCounts('United States')
      expect(counts.fresh).toBe(0)
      expect(counts.stale).toBe(0)
    })
  })
})
