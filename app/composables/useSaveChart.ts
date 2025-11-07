/**
 * useSaveChart composable
 *
 * Shared save chart functionality
 * Provides generic modal state management, save functions, and API integration
 * for saving charts and rankings to the database.
 */

import { ref, computed } from 'vue'
import { showToast } from '@/toast'

interface SaveChartOptions {
  chartType: 'explorer' | 'ranking'
  entityName?: string // 'chart' or 'ranking' (defaults based on chartType)
  generateDefaultTitle?: () => string // Optional function to generate default title
}

interface SaveResponse {
  chart?: {
    slug?: string
    id?: string
  }
}

/**
 * Composable for managing save chart/ranking functionality
 * @param options Configuration options for the save behavior
 * @returns Modal state, save functions, and handlers
 */
export function useSaveChart(options: SaveChartOptions) {
  const { chartType, entityName = chartType === 'explorer' ? 'chart' : 'ranking', generateDefaultTitle } = options

  // Modal state management
  const showSaveModal = ref(false)
  const savingChart = ref(false)
  const saveChartName = ref('')
  const saveChartDescription = ref('')
  const saveChartPublic = ref(false)
  const saveError = ref('')
  const saveSuccess = ref(false)

  // Track saved state and modifications
  const savedChartSlug = ref<string | null>(null)
  const savedChartId = ref<string | null>(null)
  const isSaved = ref(false)
  const isModified = ref(false)

  // Compute button state
  const buttonLabel = computed(() => {
    if (isSaved.value && !isModified.value) {
      return 'Saved!'
    } else if (isSaved.value && isModified.value) {
      return 'Update Chart'
    } else {
      return `Save ${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`
    }
  })

  const isButtonDisabled = computed(() => {
    return isSaved.value && !isModified.value
  })

  /**
   * Opens the save modal and resets all form state
   * Auto-populates the title field if generateDefaultTitle is provided
   */
  const openSaveModal = () => {
    showSaveModal.value = true
    // Generate default title if function provided
    saveChartName.value = generateDefaultTitle ? generateDefaultTitle() : ''
    saveChartDescription.value = ''
    saveChartPublic.value = false
    saveError.value = ''
    saveSuccess.value = false
  }

  /**
   * Closes the save modal
   */
  const closeSaveModal = () => {
    showSaveModal.value = false
  }

  /**
   * Saves the chart/ranking to the database
   * @param stateData The serialized state data to save
   * @returns Promise that resolves when save is complete
   */
  const saveToDB = async (stateData: Record<string, unknown>) => {
    // Validate input
    if (!saveChartName.value.trim()) {
      saveError.value = `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} name is required`
      return
    }

    savingChart.value = true
    saveError.value = ''
    saveSuccess.value = false

    try {
      // Make API call to save chart/ranking
      const response = await $fetch<SaveResponse>('/api/charts', {
        method: 'POST',
        body: {
          name: saveChartName.value.trim(),
          description: saveChartDescription.value.trim() || null,
          chartState: JSON.stringify(stateData),
          chartType,
          isPublic: saveChartPublic.value
        }
      })

      // Update saved state
      isSaved.value = true
      isModified.value = false
      savedChartSlug.value = response.chart?.slug || null
      savedChartId.value = response.chart?.id || null
      saveSuccess.value = true

      // Close modal immediately
      showSaveModal.value = false

      // Show success toast
      showToast(
        saveChartPublic.value
          ? `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} saved and published!`
          : `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} saved!`,
        'success'
      )

      // Navigate to saved chart if public
      if (saveChartPublic.value && response.chart?.slug) {
        navigateTo(`/charts/${response.chart.slug}`)
      }
    } catch (err) {
      console.error(`Failed to save ${entityName}:`, err)
      saveError.value = err instanceof Error ? err.message : `Failed to save ${entityName}`
    } finally {
      savingChart.value = false
    }
  }

  /**
   * Mark chart as modified after user makes changes
   */
  const markAsModified = () => {
    if (isSaved.value) {
      isModified.value = true
    }
  }

  /**
   * Reset saved state (e.g., when navigating to new chart)
   */
  const resetSavedState = () => {
    isSaved.value = false
    isModified.value = false
    savedChartSlug.value = null
    savedChartId.value = null
  }

  return {
    // Modal state
    showSaveModal,
    savingChart,
    saveChartName,
    saveChartDescription,
    saveChartPublic,
    saveError,
    saveSuccess,

    // Saved state tracking
    isSaved,
    isModified,
    savedChartSlug,
    savedChartId,
    buttonLabel,
    isButtonDisabled,

    // Functions
    openSaveModal,
    closeSaveModal,
    saveToDB,
    markAsModified,
    resetSavedState
  }
}
