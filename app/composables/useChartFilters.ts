import { UI_CONFIG } from '@/lib/config/constants'

/**
 * Composable for managing chart gallery/list filters
 * Provides reactive filter state and computed query parameters
 */
export function useChartFilters() {
  const sortBy = ref('featured')
  const filterType = ref<string | null>(null)
  const filterFeatured = ref<string | null>(null)
  const currentPage = ref(1)

  /**
   * Computed query params for API calls
   * Includes pagination and active filters
   */
  const queryParams = computed(() => {
    const params: Record<string, string | number> = {
      sort: sortBy.value,
      limit: UI_CONFIG.CHARTS_PER_PAGE,
      offset: (currentPage.value - 1) * UI_CONFIG.CHARTS_PER_PAGE
    }

    if (filterType.value) {
      params.chartType = filterType.value
    }

    if (filterFeatured.value) {
      params.featured = filterFeatured.value
    }

    return params
  })

  /**
   * Reset page to 1 when filters change
   */
  function resetPage() {
    currentPage.value = 1
  }

  // Watch filters and reset page
  watch([sortBy, filterType, filterFeatured], resetPage)

  return {
    // State
    sortBy,
    filterType,
    filterFeatured,
    currentPage,

    // Computed
    queryParams,

    // Methods
    resetPage
  }
}
