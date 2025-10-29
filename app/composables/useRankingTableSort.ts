import { ref } from 'vue'
import type { TableRow } from '@/lib/ranking/types'
import { useUrlState } from './useUrlState'

/**
 * Composable for handling table sorting and pagination
 */
export function useRankingTableSort() {
  // Sorting state
  const sortField = ref('TOTAL')
  const sortOrder = ref<'asc' | 'desc'>('desc')

  // Pagination state - synced with URL
  const itemsPerPageOptions = [10, 25, 50, 100]

  const currentPage = useUrlState('pg', 1,
    val => String(val),
    (val) => {
      const parsed = parseInt(val)
      return parsed > 0 ? parsed : 1
    }
  )

  const itemsPerPage = useUrlState('pp', 25,
    val => String(val),
    (val) => {
      const parsed = parseInt(val)
      return itemsPerPageOptions.includes(parsed) ? parsed : 25
    }
  )

  /**
   * Toggle sort order for a field
   */
  function toggleSort(field: string) {
    if (sortField.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      sortOrder.value = 'desc'
    }
    currentPage.value = 1 // Reset to first page when sorting changes
  }

  /**
   * Get sorted results
   */
  function getSortedResult(data: TableRow[]): TableRow[] {
    if (!data || !sortField.value) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortField.value] as number
      const bVal = b[sortField.value] as number

      // Handle MIN_SAFE_INTEGER (missing data)
      if (aVal === Number.MIN_SAFE_INTEGER) return 1
      if (bVal === Number.MIN_SAFE_INTEGER) return -1

      if (sortOrder.value === 'asc') {
        return aVal - bVal
      } else {
        return bVal - aVal
      }
    })
  }

  /**
   * Get paginated results
   */
  function getPaginatedResult(sortedData: TableRow[]): TableRow[] {
    if (!sortedData) return []
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return sortedData.slice(start, end)
  }

  /**
   * Calculate total pages
   */
  function getTotalPages(sortedData: TableRow[]): number {
    if (!sortedData) return 0
    return Math.ceil(sortedData.length / itemsPerPage.value)
  }

  return {
    // State
    sortField,
    sortOrder,
    currentPage,
    itemsPerPage,
    itemsPerPageOptions,

    // Methods
    toggleSort,
    getSortedResult,
    getPaginatedResult,
    getTotalPages
  }
}
