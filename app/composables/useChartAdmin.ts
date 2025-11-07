import { handleApiError } from '@/lib/errors/errorHandler'

/**
 * Composable for chart admin operations
 * Handles toggling featured (admin only) and public status (owner or admin)
 */
export function useChartAdmin() {
  const togglingFeatured = ref<number | null>(null)
  const togglingPublic = ref<number | null>(null)

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

  /**
   * Toggle public status for a chart (owner or admin)
   * @param chartId - The ID of the chart to toggle
   * @param newValue - The new public status
   * @param charts - Optional ref to charts array to update local state
   */
  async function togglePublic(
    chartId: number,
    newValue: boolean,
    charts?: Ref<Array<{ id: number, isPublic?: boolean }>>
  ) {
    togglingPublic.value = chartId
    try {
      await $fetch(`/api/admin/charts/${chartId}/public`, {
        method: 'PATCH',
        body: { isPublic: newValue }
      })

      // Update local state if charts ref provided
      if (charts?.value) {
        const chart = charts.value.find(c => c.id === chartId)
        if (chart) {
          chart.isPublic = newValue
        }
      }
    } catch (err) {
      handleApiError(err, 'update public status', 'togglePublic')
    } finally {
      togglingPublic.value = null
    }
  }

  return {
    togglingFeatured,
    togglingPublic,
    toggleFeatured,
    togglePublic
  }
}
