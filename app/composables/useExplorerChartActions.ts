import { showToast } from '@/toast'
import { handleError } from '@/lib/errors/errorHandler'
import { useSaveChart } from '@/composables/useSaveChart'
import type { Ref } from 'vue'

/**
 * Explorer Chart Actions Composable
 *
 * Phase 5a: Extracted from explorer.vue to reduce page size
 *
 * Provides chart action functions:
 * - Copy chart link to clipboard
 * - Screenshot/download chart as PNG
 * - Save chart to database with current state
 */
export function useExplorerChartActions(state: {
  countries: Ref<string[]>
  type: Ref<string>
  chartType: Ref<string>
  ageGroups: Ref<string[]>
  chartStyle: Ref<string>
  isExcess: Ref<boolean>
  showBaseline: Ref<boolean>
  baselineMethod: Ref<string>
  baselineDateFrom: Ref<string>
  baselineDateTo: Ref<string>
  cumulative: Ref<boolean>
  showPercentage: Ref<boolean>
  showPredictionInterval: Ref<boolean>
  showTotal: Ref<boolean>
  dateFrom: Ref<string>
  dateTo: Ref<string>
  standardPopulation: Ref<string>
  isLogarithmic: Ref<boolean>
  maximize: Ref<boolean>
  showLabels: Ref<boolean>
}) {
  // Copy chart link to clipboard
  const copyChartLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('Link copied to clipboard!', 'success')
    } catch (error) {
      handleError(error, 'Failed to copy link', 'copyChartLink')
    }
  }

  // Screenshot chart and download as PNG
  const screenshotChart = () => {
    const canvas = document.querySelector('#chart') as HTMLCanvasElement
    if (!canvas) {
      showToast('Chart not found', 'error')
      return
    }
    try {
      const dataURL = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = 'mortality-chart.png'
      link.href = dataURL
      link.click()
      showToast('Chart downloaded!', 'success')
    } catch (error) {
      handleError(error, 'Failed to download chart', 'screenshotChart')
    }
  }

  // Save chart functionality using composable
  const {
    showSaveModal,
    savingChart,
    saveChartName,
    saveChartDescription,
    saveChartPublic,
    saveError,
    saveSuccess,
    openSaveModal: saveChart,
    saveToDB: saveToDBComposable
  } = useSaveChart({ chartType: 'explorer' })

  // Wrapper function to serialize state and call composable
  const saveToDB = async () => {
    // Serialize current explorer state
    const chartStateData = {
      countries: state.countries.value,
      type: state.type.value,
      chartType: state.chartType.value,
      ageGroups: state.ageGroups.value,
      chartStyle: state.chartStyle.value,
      isExcess: state.isExcess.value,
      showBaseline: state.showBaseline.value,
      baselineMethod: state.baselineMethod.value,
      baselineDateFrom: state.baselineDateFrom.value,
      baselineDateTo: state.baselineDateTo.value,
      cumulative: state.cumulative.value,
      showPercentage: state.showPercentage.value,
      showPredictionInterval: state.showPredictionInterval.value,
      showTotal: state.showTotal.value,
      dateFrom: state.dateFrom.value,
      dateTo: state.dateTo.value,
      standardPopulation: state.standardPopulation.value,
      isLogarithmic: state.isLogarithmic.value,
      maximize: state.maximize.value,
      showLabels: state.showLabels.value
    }

    await saveToDBComposable(chartStateData)
  }

  return {
    // Actions
    copyChartLink,
    screenshotChart,
    saveChart,
    saveToDB,

    // Save modal state
    showSaveModal,
    savingChart,
    saveChartName,
    saveChartDescription,
    saveChartPublic,
    saveError,
    saveSuccess
  }
}
