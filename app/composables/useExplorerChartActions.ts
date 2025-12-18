import { showToast } from '@/toast'
import { handleError } from '@/lib/errors/errorHandler'
import { useSaveChart } from '@/composables/useSaveChart'
import { useShortUrl } from '@/composables/useShortUrl'
import { generateChartFilename } from '@/lib/utils/strings'
import { generateExplorerTitle, generateExplorerDescription } from '@/lib/utils/chartTitles'
import { THEME_COLORS } from '@/lib/config/constants'
import { sortDatasetsByLatestValue, reorderCountriesByLabels } from '@/lib/chart/sortUtils'
import Papa from 'papaparse'
import type { Ref } from 'vue'
import type { MortalityChartData } from '@/lib/chart/chartTypes'
import type { Country } from '@/model'

/**
 * Explorer Chart Actions Composable
 *
 * Chart actions for the explorer page
 *
 * Provides chart action functions:
 * - Copy chart link to clipboard
 * - Screenshot/download chart as PNG
 * - Save chart to database with current state
 * - Export chart data as CSV
 * - Export chart data as JSON
 *
 * Note: The state parameter uses `any` type to avoid TypeScript's excessive
 * type recursion with the complex Vue ref-based state object. The actual
 * state comes from useExplorerState() and contains refs for: countries,
 * type, chartType, ageGroups, chartStyle, isExcess, showBaseline,
 * baselineMethod, baselineDates, cumulative, showPercentage,
 * showPredictionInterval, showTotal, dates, standardPopulation,
 * showLogarithmic, maximize, showLabels, view.
 */
export function useExplorerChartActions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
  chartData?: Ref<MortalityChartData | undefined> | { value: MortalityChartData | undefined },
  allCountries?: Ref<Record<string, Country>> | { value: Record<string, Country> },
  options?: {
    onCountriesReorder?: (sortedCountries: string[]) => Promise<void>
  }
) {
  // Copy short URL to clipboard (uses local hash computation + fire-and-forget DB store)
  const { getShortUrl } = useShortUrl()
  const copyChartLink = async () => {
    try {
      const shortUrl = await getShortUrl()
      await navigator.clipboard.writeText(shortUrl)
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
      // Create a temporary canvas to add white/black background
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const ctx = tempCanvas.getContext('2d')

      if (!ctx) {
        showToast('Failed to create canvas context', 'error')
        return
      }

      // Detect dark mode and set appropriate background color
      const isDark = document.documentElement.classList.contains('dark')
      ctx.fillStyle = isDark ? THEME_COLORS.BG_DARK : THEME_COLORS.BG_LIGHT
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

      // Draw the chart on top of the background
      ctx.drawImage(canvas, 0, 0)

      // Export the composite image
      const dataURL = tempCanvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = 'mortality-chart.png'
      link.href = dataURL
      link.click()
      showToast('Chart downloaded!', 'success')
    } catch (error) {
      handleError(error, 'Failed to download chart', 'screenshotChart')
    }
  }

  // Download chart as PNG via server-side rendering (for social media/OG images)
  const downloadChart = () => {
    try {
      const params = new URLSearchParams(window.location.search)

      // Add dark mode parameter if currently in dark mode
      const isDarkMode = document.documentElement.classList.contains('dark')
      if (isDarkMode) {
        params.set('dm', '1')
      }

      const query = params.toString()
      const url = `${window.location.origin}/chart.png${query ? `?${query}` : ''}`
      window.open(url, '_blank')
    } catch (error) {
      handleError(error, 'Failed to download chart', 'downloadChart')
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
    isSaved,
    isModified,
    savedChartSlug,
    savedChartId,
    buttonLabel,
    isButtonDisabled,
    openSaveModal: saveChart,
    saveToDB: saveToDBComposable,
    markAsModified,
    resetSavedState,
    isDuplicate,
    existingChart
  } = useSaveChart({
    chartType: 'explorer',
    generateDefaultTitle: () => {
      // Provide fallback for allCountries if not passed
      const countries = allCountries?.value || {}
      return generateExplorerTitle({
        countries: state.countries.value,
        allCountries: countries,
        type: state.type.value,
        isExcess: state.isExcess.value,
        ageGroups: state.ageGroups.value,
        dateFrom: state.dateFrom.value,
        dateTo: state.dateTo.value,
        view: state.view?.value
      })
    },
    generateDefaultDescription: () => {
      const countries = allCountries?.value || {}
      return generateExplorerDescription({
        countries: state.countries.value,
        allCountries: countries,
        type: state.type.value,
        isExcess: state.isExcess.value,
        ageGroups: state.ageGroups.value,
        dateFrom: state.dateFrom.value,
        dateTo: state.dateTo.value,
        view: state.view?.value,
        chartType: state.chartType?.value,
        showBaseline: state.showBaseline?.value,
        baselineMethod: state.baselineMethod?.value,
        baselineDateFrom: state.baselineDateFrom?.value,
        baselineDateTo: state.baselineDateTo?.value,
        cumulative: state.cumulative?.value,
        showPercentage: state.showPercentage?.value,
        standardPopulation: state.standardPopulation?.value
      })
    }
  })

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
      isZScore: state.isZScore.value,
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
      showLogarithmic: state.showLogarithmic.value,
      maximize: state.maximize.value,
      showLabels: state.showLabels.value,
      userColors: state.userColors.value,
      sliderStart: state.sliderStart.value,
      decimals: state.decimals.value,
      showLogo: state.showLogo.value,
      showQrCode: state.showQrCode.value,
      showCaption: state.showCaption.value,
      showTitle: state.showTitle.value
    }

    await saveToDBComposable(chartStateData)
  }

  // Export chart data as CSV
  const exportCSV = () => {
    if (!chartData || !chartData.value) {
      showToast('No chart data available', 'error')
      return
    }

    try {
      const data = chartData.value

      // Validate required data
      if (!data.datasets || !Array.isArray(data.datasets) || data.datasets.length === 0) {
        showToast('No data to export', 'error')
        return
      }

      if (!data.labels || !Array.isArray(data.labels) || data.labels.length === 0) {
        showToast('No labels to export', 'error')
        return
      }

      // Filter meaningful datasets
      const meaningfulDatasets = filterMeaningfulDatasets(data.datasets)
      const datasetsToExport = meaningfulDatasets.length > 0 ? meaningfulDatasets : data.datasets

      // Prepare data for CSV export
      const rows: Record<string, string | number>[] = []

      data.labels.forEach((label, index) => {
        const row: Record<string, string | number> = {
          'Date/Period': String(label)
        }

        datasetsToExport.forEach((dataset, dsIdx) => {
          const columnName = (dataset.label && dataset.label.trim() !== '')
            ? dataset.label
            : `Series ${dsIdx + 1}`

          const value = dataset.data?.[index]
          // Handle different data formats (number, point with x/y, etc.)
          if (typeof value === 'number') {
            row[columnName] = value
          } else if (value && typeof value === 'object' && 'y' in value) {
            row[columnName] = (value as { y: number }).y
          } else {
            row[columnName] = ''
          }
        })

        rows.push(row)
      })

      // Use papaparse for proper CSV encoding
      const csvContent = Papa.unparse(rows, {
        quotes: true, // Quote all fields
        delimiter: ',',
        newline: '\n'
      })

      // Generate filename
      const filename = generateChartFilename(
        data.title || 'chart',
        data.subtitle,
        'csv'
      )

      // Trigger download
      downloadFile(csvContent, filename, 'text/csv;charset=utf-8;')

      showToast('CSV exported successfully!', 'success')
    } catch (error) {
      handleError(error, 'Failed to export CSV', 'exportCSV')
    }
  }

  // Sort chart series by their latest (last) data point value
  // This reorders countries so series with highest absolute values appear first
  const sortByLatestValue = async () => {
    if (!chartData || !chartData.value) {
      showToast('No chart data available', 'error')
      return
    }

    try {
      const data = chartData.value
      if (!data.datasets || data.datasets.length === 0) {
        showToast('No data to sort', 'error')
        return
      }

      // Sort datasets by their last valid value
      const sortedLabels = sortDatasetsByLatestValue(data.datasets)

      // Get current countries and their metadata
      const currentCountries: string[] = state.countries.value
      const countriesMap = allCountries?.value || {}

      // Create a map of country name -> country code
      const nameToCode: Record<string, string> = {}
      for (const code of currentCountries) {
        const country = countriesMap[code]
        if (country) {
          nameToCode[country.jurisdiction || code] = code
        }
      }

      // Reorder countries based on sorted labels
      const sortedCountries = reorderCountriesByLabels(sortedLabels, currentCountries, nameToCode)

      // Check if order actually changed
      if (JSON.stringify(sortedCountries) === JSON.stringify(currentCountries)) {
        showToast('Series already sorted by latest value', 'info')
        return
      }

      // Use callback to trigger proper state update with chart regeneration
      // This ensures the chart is rebuilt with the new country order
      if (options?.onCountriesReorder) {
        await options.onCountriesReorder(sortedCountries)
      } else {
        // Fallback: direct state update (won't trigger chart rebuild)
        state.countries.value = sortedCountries
      }
      showToast('Series sorted by latest value', 'success')
    } catch (error) {
      handleError(error, 'Failed to sort series', 'sortByLatestValue')
    }
  }

  // Export chart data as JSON
  const exportJSON = () => {
    if (!chartData || !chartData.value) {
      showToast('No chart data available', 'error')
      return
    }

    try {
      const data = chartData.value

      // Validate required data
      if (!data.datasets || !Array.isArray(data.datasets) || data.datasets.length === 0) {
        showToast('No data to export', 'error')
        return
      }

      if (!data.labels || !Array.isArray(data.labels) || data.labels.length === 0) {
        showToast('No labels to export', 'error')
        return
      }

      // Filter meaningful datasets
      const meaningfulDatasets = filterMeaningfulDatasets(data.datasets)
      const datasetsToExport = meaningfulDatasets.length > 0 ? meaningfulDatasets : data.datasets

      // Format data for JSON export
      const exportData = {
        metadata: {
          title: data.title || 'Mortality Chart',
          subtitle: data.subtitle || '',
          xAxisLabel: data.xtitle || 'Time',
          yAxisLabel: data.ytitle || 'Value',
          sources: data.sources || [],
          exportedAt: new Date().toISOString(),
          url: data.url || window.location.href
        },
        labels: data.labels,
        datasets: datasetsToExport.map((dataset, idx) => ({
          label: (dataset.label && dataset.label.trim() !== '') ? dataset.label : `Series ${idx + 1}`,
          data: dataset.data || [],
          backgroundColor: dataset.backgroundColor,
          borderColor: dataset.borderColor
        }))
      }

      // Convert to JSON string
      const jsonContent = JSON.stringify(exportData, null, 2)

      // Generate filename
      const filename = generateChartFilename(
        data.title || 'chart',
        data.subtitle,
        'json'
      )

      // Trigger download
      downloadFile(jsonContent, filename, 'application/json;charset=utf-8;')

      showToast('JSON exported successfully!', 'success')
    } catch (error) {
      handleError(error, 'Failed to export JSON', 'exportJSON')
    }
  }

  // Helper: Filter out datasets that are purely visualization helpers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function filterMeaningfulDatasets(datasets: any[]) {
    return datasets.filter((ds) => {
      // Keep if it has a label
      if (ds.label && ds.label.trim() !== '') return true

      // Skip if it's a Chart.js internal dataset (error bars, etc.)
      if (ds.type === 'line' && !ds.label) return false

      // Keep if it has actual data points
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasData = ds.data && Array.isArray(ds.data) && ds.data.some((d: any) => {
        if (typeof d === 'number') return !isNaN(d) && d !== null
        if (d && typeof d === 'object' && 'y' in d) return !isNaN((d as { y: number }).y)
        return false
      })
      return hasData
    })
  }

  // Helper: Trigger file download
  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url) // Clean up
  }

  return {
    // Actions
    copyChartLink,
    screenshotChart,
    downloadChart,
    saveChart,
    saveToDB,
    exportCSV,
    exportJSON,
    sortByLatestValue,
    markAsModified,
    resetSavedState,

    // Save modal state
    showSaveModal,
    savingChart,
    saveChartName,
    saveChartDescription,
    saveChartPublic,
    saveError,
    saveSuccess,
    isSaved,
    isModified,
    savedChartSlug,
    savedChartId,
    buttonLabel,
    isButtonDisabled,
    isDuplicate,
    existingChart
  } as const
}
