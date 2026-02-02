import { ref } from 'vue'
import { showToast } from '@/toast'
import { handleApiError } from '@/lib/errors/errorHandler'

interface EditableChart {
  id: number
  name: string
  description?: string | null
  isPublic?: boolean
}

/**
 * Composable for editing chart metadata (name, description, isPublic)
 * Used by both chart detail page and my-charts page
 */
export function useChartEdit(options?: {
  onSuccess?: () => void | Promise<void>
}) {
  const showEditModal = ref(false)
  const editingChartId = ref<number | null>(null)
  const editName = ref('')
  const editDescription = ref('')
  const editIsPublic = ref(false)
  const editError = ref<string | null>(null)
  const isSaving = ref(false)

  function openEditModal(chart: EditableChart) {
    editingChartId.value = chart.id
    editName.value = chart.name
    editDescription.value = chart.description || ''
    editIsPublic.value = chart.isPublic ?? false
    editError.value = null
    showEditModal.value = true
  }

  async function saveEdit() {
    if (!editingChartId.value) return

    if (!editName.value.trim()) {
      editError.value = 'Chart name is required'
      return
    }

    isSaving.value = true
    editError.value = null

    try {
      await $fetch(`/api/charts/${editingChartId.value}`, {
        method: 'PATCH',
        body: {
          name: editName.value.trim(),
          description: editDescription.value.trim() || null,
          isPublic: editIsPublic.value
        }
      })

      showEditModal.value = false
      showToast('Chart updated successfully', 'success')

      if (options?.onSuccess) {
        await options.onSuccess()
      }

      return true
    } catch (err) {
      handleApiError(err, 'update chart', 'useChartEdit.saveEdit')
      editError.value = err instanceof Error ? err.message : 'Failed to update chart'
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    showEditModal,
    editingChartId,
    editName,
    editDescription,
    editIsPublic,
    editError,
    isSaving,
    openEditModal,
    saveEdit
  }
}
