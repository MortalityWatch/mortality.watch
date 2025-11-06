/**
 * Data Quality Table Composable
 *
 * Data quality page composable
 *
 * Provides:
 * - Table columns configuration
 * - Table grouping options
 * - Status badge helpers
 * - Date formatting
 * - Helper functions for table display
 *
 * This separates table configuration concerns from the page component,
 * making the code more modular and testable.
 */

import { h } from 'vue'
import type { ComputedRef } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { getGroupedRowModel } from '@tanstack/vue-table'
import type { GroupingOptions } from '@tanstack/vue-table'
import type { CountryQuality } from './useDataQualityFilters'

export function useDataQualityTable(
  filteredCountries: ComputedRef<CountryQuality[]>,
  getReadableSourceName: (source: string) => string
) {
  // Table columns configuration
  const columns: TableColumn<CountryQuality>[] = [
    {
      id: 'country',
      header: 'Country'
    },
    {
      accessorKey: 'jurisdiction',
      header: 'Jurisdiction'
    },
    {
      id: 'status',
      header: 'Status'
    },
    {
      accessorKey: 'dataSource',
      header: 'Data Source',
      cell: ({ row }) => {
        if (row.getIsGrouped()) {
          const count = row.getValue('dataSource') as number
          return `${count} source${count === 1 ? '' : 's'}`
        }
        return getReadableSourceName(row.getValue('dataSource') as string)
      },
      aggregationFn: 'uniqueCount'
    },
    {
      accessorKey: 'type',
      header: 'Type'
    },
    {
      accessorKey: 'ageGroups',
      header: 'Age Groups'
    },
    {
      id: 'lastUpdate',
      header: 'Last Update'
    },
    {
      id: 'daysSince',
      header: () => h('div', { class: 'text-right' }, 'Days Since')
    },
    {
      id: 'actions',
      header: 'Monitor'
    }
  ]

  // TanStack Table grouping options
  const groupingOptions: GroupingOptions = {
    groupedColumnMode: 'remove',
    getGroupedRowModel: getGroupedRowModel()
  }

  // Helper to get status counts for a jurisdiction
  const getStatusCounts = (jurisdiction: string) => {
    const entries = filteredCountries.value.filter(c => c.jurisdiction === jurisdiction)
    return {
      fresh: entries.filter(e => e.status === 'fresh').length,
      stale: entries.filter(e => e.status === 'stale').length
    }
  }

  // Status badge styling
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'fresh':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900'
      case 'stale':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900'
    }
  }

  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Format days since update in a readable way
  const formatDaysSince = (days: number): string => {
    const years = Math.floor(days / 365)
    const months = Math.floor((days % 365) / 30)

    if (years > 0) {
      if (months > 0) {
        return `${years}y ${months}m`
      }
      return `${years}y`
    }
    if (months > 0) {
      return `${months}m`
    }
    return `${days}d`
  }

  // Get most stale days for a jurisdiction
  const getMostStaleDays = (jurisdiction: string): number => {
    const entries = filteredCountries.value.filter(c => c.jurisdiction === jurisdiction)
    if (entries.length === 0) return 0
    return Math.max(...entries.map(c => c.daysSinceUpdate))
  }

  return {
    // Table configuration
    columns,
    groupingOptions,

    // Helpers
    getStatusCounts,
    getStatusColor,
    formatDate,
    formatDaysSince,
    getMostStaleDays
  }
}
