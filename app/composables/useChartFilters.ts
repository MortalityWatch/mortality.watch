import { UI_CONFIG, type CHART_FILTERS } from '@/lib/config/constants'

type SortByValue = typeof CHART_FILTERS.SORT_OPTIONS[number]['value']
type FilterTypeValue = typeof CHART_FILTERS.TYPE_OPTIONS[number]['value']
type FilterFeaturedValue = typeof CHART_FILTERS.FEATURED_OPTIONS[number]['value']

/**
 * Composable for managing chart gallery/list filters
 * Provides reactive filter state and computed query parameters
 */
export function useChartFilters() {
  const sortBy = ref<SortByValue>('featured')
  const filterType = ref<FilterTypeValue>(null)
  const filterFeatured = ref<FilterFeaturedValue>(null)
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
