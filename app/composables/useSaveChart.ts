/**
 * useSaveChart composable
 *
 * Shared save chart functionality
 * Provides generic modal state management, save functions, and API integration
 * for saving charts and rankings to the database.
 */

import { ref, computed } from 'vue'
import { showToast } from '@/toast'
import { logger } from '@/lib/logger'

const log = logger.withPrefix('useSaveChart')

interface SaveChartOptions {
  chartType: 'explorer' | 'ranking'
  entityName?: string // 'chart' or 'ranking' (defaults based on chartType)
  generateDefaultTitle?: () => string // Optional function to generate default title
  generateDefaultDescription?: () => string // Optional function to generate default description
}

interface SaveResponse {
  chart?: {
    slug?: string
    id?: string
  }
}

interface ExistingChart {
  id: number
  slug: string | null
  name: string
  createdAt: number | null
}

interface DetectedChart {
  id: number
  slug: string | null
  name: string
}

/**
 * Type for Nuxt/ofetch FetchError responses
 * Used for proper type-safe error handling
 */
interface FetchErrorResponse {
  statusCode?: number
  status?: number
  data?: {
    data?: {
      duplicate?: boolean
      existingChart?: ExistingChart
    }
    duplicate?: boolean
    existingChart?: ExistingChart
  }
}

/**
 * Composable for managing save chart/ranking functionality
 * @param options Configuration options for the save behavior
 * @returns Modal state, save functions, and handlers
 */
export function useSaveChart(options: SaveChartOptions) {
  const { chartType, entityName = chartType === 'explorer' ? 'chart' : 'ranking', generateDefaultTitle, generateDefaultDescription } = options

  // Modal state management
  const showSaveModal = ref(false)
  const savingChart = ref(false)
  const saveChartName = ref('')
  const saveChartDescription = ref('')
  const saveChartNotes = ref('')
  const saveChartPublic = ref(false)
  const saveError = ref('')
  const saveSuccess = ref(false)

  // Track saved state and modifications
  const savedChartSlug = ref<string | null>(null)
  const savedChartId = ref<string | null>(null)
  const isSaved = ref(false)
  const isModified = ref(false)

  // Duplicate detection state (from 409 response)
  const isDuplicate = ref(false)
  const existingChart = ref<ExistingChart | null>(null)

  // Pre-detected chart state (from mount check)
  const detectedChart = ref<DetectedChart | null>(null)

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
   * Pre-fills with detected chart name if one exists
   */
  const openSaveModal = () => {
    showSaveModal.value = true
    // If a detected chart exists, pre-fill with its name; otherwise use generated default
    if (detectedChart.value) {
      saveChartName.value = detectedChart.value.name
    } else {
      saveChartName.value = generateDefaultTitle ? generateDefaultTitle() : ''
    }
    saveChartDescription.value = generateDefaultDescription ? generateDefaultDescription() : ''
    saveChartNotes.value = ''
    saveChartPublic.value = false
    saveError.value = ''
    saveSuccess.value = false
    isDuplicate.value = false
    existingChart.value = null
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
          notes: saveChartNotes.value.trim() || null,
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
        `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} saved!`,
        'success'
      )
    } catch (err: unknown) {
      log.error(`Failed to save ${entityName}`, err)

      // Check if this is a duplicate error (409 Conflict)
      // FetchError from ofetch/nuxt has shape: { status, statusCode, statusText, statusMessage, data, message }
      const error = err as FetchErrorResponse

      // Check both statusCode and status (FetchError uses both)
      const is409 = error?.statusCode === 409 || error?.status === 409

      // Nuxt error responses nest the actual data in error.data.data
      const errorData = error?.data?.data || error?.data
      const hasDuplicateFlag = errorData?.duplicate === true

      if (is409 && hasDuplicateFlag) {
        // Chart already exists - show duplicate warning in modal
        isDuplicate.value = true
        existingChart.value = errorData?.existingChart || null
        // Update saved state so button shows "Saved!" with view link when modal is dismissed
        isSaved.value = true
        isModified.value = false
        savedChartSlug.value = errorData?.existingChart?.slug || null
        savedChartId.value = errorData?.existingChart?.id?.toString() || null
        // Keep modal open so user can see the warning and use the links
      } else {
        saveError.value = err instanceof Error ? err.message : `Failed to save ${entityName}`
      }
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
    detectedChart.value = null
  }

  /**
   * Set detected chart (called from page mount when existing chart is found)
   */
  const setDetectedChart = (chart: DetectedChart | null) => {
    detectedChart.value = chart
    if (chart) {
      isSaved.value = true
      isModified.value = false
      savedChartSlug.value = chart.slug
      savedChartId.value = chart.id.toString()
    }
  }

  /**
   * Update an existing saved chart's metadata and optionally its configuration
   * @param chartId The ID of the saved chart to update
   * @param stateData Optional state data to update the chart configuration (for modified charts)
   * @returns Promise that resolves when update is complete
   */
  const updateExistingChart = async (chartId: number, stateData?: Record<string, unknown>) => {
    if (!saveChartName.value.trim()) {
      saveError.value = `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} name is required`
      return
    }

    savingChart.value = true
    saveError.value = ''

    try {
      const body: Record<string, unknown> = {
        name: saveChartName.value.trim(),
        description: saveChartDescription.value.trim() || null,
        notes: saveChartNotes.value.trim() || null,
        isPublic: saveChartPublic.value
      }

      // If state data provided, include it to update the chart configuration
      if (stateData) {
        body.chartState = JSON.stringify(stateData)
        body.chartType = chartType
      }

      const response = await $fetch<{ success: boolean, chart: { slug: string | null } }>(`/api/charts/${chartId}`, {
        method: 'PATCH',
        body
      })

      // Update saved state
      isSaved.value = true
      isModified.value = false
      savedChartSlug.value = response.chart?.slug || null
      saveSuccess.value = true
      showSaveModal.value = false

      showToast(
        `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} updated!`,
        'success'
      )
    } catch (err: unknown) {
      log.error(`Failed to update ${entityName}`, err)
      saveError.value = err instanceof Error ? err.message : `Failed to update ${entityName}`
    } finally {
      savingChart.value = false
    }
  }

  /**
   * Save as a new chart (bypassing duplicate detection)
   * @param stateData The serialized state data to save
   * @returns Promise that resolves when save is complete
   */
  const saveAsNew = async (stateData: Record<string, unknown>) => {
    if (!saveChartName.value.trim()) {
      saveError.value = `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} name is required`
      return
    }

    savingChart.value = true
    saveError.value = ''
    saveSuccess.value = false

    try {
      const response = await $fetch<SaveResponse>('/api/charts', {
        method: 'POST',
        body: {
          name: saveChartName.value.trim(),
          description: saveChartDescription.value.trim() || null,
          notes: saveChartNotes.value.trim() || null,
          chartState: JSON.stringify(stateData),
          chartType,
          isPublic: saveChartPublic.value,
          forceNew: true
        }
      })

      // Update saved state
      isSaved.value = true
      isModified.value = false
      savedChartSlug.value = response.chart?.slug || null
      savedChartId.value = response.chart?.id || null
      saveSuccess.value = true
      detectedChart.value = null // Clear detected chart since we now have a new save

      showSaveModal.value = false

      showToast(
        `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} saved!`,
        'success'
      )
    } catch (err: unknown) {
      log.error(`Failed to save ${entityName}`, err)
      saveError.value = err instanceof Error ? err.message : `Failed to save ${entityName}`
    } finally {
      savingChart.value = false
    }
  }

  return {
    // Modal state
    showSaveModal,
    savingChart,
    saveChartName,
    saveChartDescription,
    saveChartNotes,
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

    // Duplicate detection (from 409)
    isDuplicate,
    existingChart,

    // Pre-detected chart (from mount check)
    detectedChart,

    // Functions
    openSaveModal,
    closeSaveModal,
    saveToDB,
    saveAsNew,
    updateExistingChart,
    setDetectedChart,
    markAsModified,
    resetSavedState
  }
}
