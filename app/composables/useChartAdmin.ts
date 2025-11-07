import { handleApiError } from '@/lib/errors/errorHandler'

/**
 * Composable for admin chart operations
 * Handles toggling featured status and other admin functions
 */
export function useChartAdmin() {
  const togglingFeatured = ref<number | null>(null)

  /**
   * Toggle featured status for a chart (admin only)
   * @param chartId - The ID of the chart to toggle
   * @param newValue - The new featured status
   * @param charts - Optional ref to charts array to update local state
   */
  async function toggleFeatured(
    chartId: number,
    newValue: boolean,
    charts?: Ref<Array<{ id: number, isFeatured: boolean }>>
  ) {
    togglingFeatured.value = chartId
    try {
      await $fetch(`/api/admin/charts/${chartId}/featured`, {
        method: 'PATCH',
        body: { isFeatured: newValue }
      })

      // Update local state if charts ref provided
      if (charts?.value) {
        const chart = charts.value.find(c => c.id === chartId)
        if (chart) {
          chart.isFeatured = newValue
        }
      }
    } catch (err) {
      handleApiError(err, 'update featured status', 'toggleFeatured')
    } finally {
      togglingFeatured.value = null
    }
  }

  return {
    togglingFeatured,
    toggleFeatured
  }
}
