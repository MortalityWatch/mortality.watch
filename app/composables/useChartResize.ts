import { ref, computed, onBeforeUnmount } from 'vue'
import { isMobile } from '@/utils'
import { CHART_RESIZE, CHART_PRESETS } from '@/lib/config/constants'

/**
 * Manages chart resizing functionality including presets and manual resize
 */
export function useChartResize() {
  const chartContainer = ref<HTMLElement | null>(null)
  const showSizeLabel = ref<boolean>(false)
  const hasBeenResized = ref<boolean>(false)
  const chartWidth = ref<number | undefined>(undefined)
  const chartHeight = ref<number | undefined>(undefined)
  const chartPreset = ref<string>('Auto')
  const containerSize = ref('100x100')

  let sizeTimeout: ReturnType<typeof setTimeout> | null = null
  let resizeObserver: ResizeObserver | null = null

  // Check if chart is in Auto (responsive) mode
  const isAutoMode = computed(() => !hasBeenResized.value && !chartWidth.value && !chartHeight.value)

  // Check if chart is in Custom mode (user has selected Custom or dragged to resize)
  const isCustomMode = computed(() => chartPreset.value === 'Custom')

  /**
   * Get the actual DOM element from the container ref
   * Handles both direct refs and component instances
   */
  const getTargetElement = (): HTMLElement | null => {
    if (!chartContainer.value) return null

    // Check if chartContainer.value is a component instance with exposed chartWrapperElement
    if (typeof chartContainer.value === 'object' && 'chartWrapperElement' in chartContainer.value) {
      // Component instance with exposed element
      const component = chartContainer.value as { chartWrapperElement: HTMLElement | null }
      return component.chartWrapperElement
    }

    // Direct DOM element
    if (chartContainer.value instanceof HTMLElement) {
      return chartContainer.value
    }

    return null
  }

  /**
   * Apply preset size to chart
   */
  const applyPresetSize = (presetName: string) => {
    const targetElement = getTargetElement()
    if (!targetElement) return

    // Try to find preset by name
    let preset = CHART_PRESETS.find(p => p.name === presetName)

    // If not found, default to Custom (for unknown/legacy values)
    if (!preset) {
      preset = CHART_PRESETS.find(p => p.name === 'Custom')
    }

    if (!preset) {
      return
    }

    // Update chartPreset so isCustomMode computed property works correctly
    chartPreset.value = preset.name

    // Special case: "Custom" enables resize handle with current or default dimensions
    if (preset.width === -1 && preset.height === -1) {
      hasBeenResized.value = true
      // Keep current dimensions if they exist, otherwise use container's current size
      if (!chartWidth.value || !chartHeight.value) {
        const currentWidth = targetElement.offsetWidth
        const currentHeight = targetElement.offsetHeight
        chartWidth.value = currentWidth
        chartHeight.value = currentHeight
        targetElement.style.width = `${currentWidth}px`
        targetElement.style.height = `${currentHeight}px`
      } else {
        targetElement.style.width = `${chartWidth.value}px`
        targetElement.style.height = `${chartHeight.value}px`
      }
      containerSize.value = 'Custom'
      showSizeLabel.value = true
      if (sizeTimeout) clearTimeout(sizeTimeout)
      sizeTimeout = setTimeout(() => (showSizeLabel.value = false), CHART_RESIZE.SIZE_LABEL_TIMEOUT)
      return
    }

    // Special case: "Auto" enables responsive sizing
    if (preset.width === 0 && preset.height === 0) {
      hasBeenResized.value = false
      targetElement.style.width = ''
      targetElement.style.height = ''
      containerSize.value = 'Auto'
      showSizeLabel.value = true

      // Clear dimensions from local state
      chartWidth.value = undefined
      chartHeight.value = undefined

      // Trigger resize event
      window.dispatchEvent(new Event('resize'))

      // Hide label after timeout
      if (sizeTimeout) clearTimeout(sizeTimeout)
      sizeTimeout = setTimeout(() => (showSizeLabel.value = false), CHART_RESIZE.SIZE_LABEL_TIMEOUT)
      return
    }

    hasBeenResized.value = true

    // Scale by devicePixelRatio so preset represents output size, not CSS size
    // e.g., "800×600" preset on 2x display → 400×300 CSS → 800×600 canvas
    const dpr = window.devicePixelRatio || 1
    const cssWidth = Math.round(preset.width / dpr)
    const cssHeight = Math.round(preset.height / dpr)

    targetElement.style.width = `${cssWidth}px`
    targetElement.style.height = `${cssHeight}px`

    // Save the CSS dimensions to local state (session-only)
    chartWidth.value = cssWidth
    chartHeight.value = cssHeight

    // Update the size label to show preset name
    containerSize.value = preset.name
    showSizeLabel.value = true

    // Setup resize observer for manual dragging
    setupResizeObserver()

    // Trigger resize event
    window.dispatchEvent(new Event('resize'))

    // Hide label after timeout
    if (sizeTimeout) clearTimeout(sizeTimeout)
    sizeTimeout = setTimeout(() => (showSizeLabel.value = false), CHART_RESIZE.SIZE_LABEL_TIMEOUT)
  }

  /**
   * Setup ResizeObserver for drag resizing
   */
  const setupResizeObserver = () => {
    // Disconnect existing observer
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }

    // Only observe if NOT on mobile
    if (isMobile()) {
      return
    }

    // Get the actual DOM element using helper function
    const targetElement = getTargetElement()

    // Validate that we have a valid DOM element
    if (!targetElement || !(targetElement instanceof Element)) {
      // Silently return - element may not be mounted yet
      return
    }

    let isFirstResize = true

    resizeObserver = new ResizeObserver(() => {
      if (isFirstResize) {
        isFirstResize = false
        return
      }

      // In Auto mode, only switch to Custom if user manually set inline styles (dragged handle)
      if (isAutoMode.value) {
        const hasInlineWidth = targetElement?.style.width && targetElement?.style.width !== ''
        const hasInlineHeight = targetElement?.style.height && targetElement?.style.height !== ''

        // If no inline styles, this is just window resize - ignore it
        if (!hasInlineWidth && !hasInlineHeight) {
          return
        }

        // User dragged the handle - switch to Custom mode
        hasBeenResized.value = true
        chartPreset.value = 'Custom'
      }

      // In Preset mode (not Auto, not Custom), ignore resize events
      // User selected a fixed preset - don't let ResizeObserver interfere
      if (!isAutoMode.value && !isCustomMode.value) {
        return
      }

      // Only update dimensions in Custom mode (user is actively resizing)
      if (!isCustomMode.value) {
        return
      }

      const currentWidth = targetElement?.offsetWidth || 0
      const currentHeight = targetElement?.offsetHeight || 0

      // Save dimensions to local state (session-only)
      chartWidth.value = currentWidth
      chartHeight.value = currentHeight

      // Update size label with dimensions
      const displayWidth = currentWidth - 2
      const displayHeight = currentHeight - 2
      containerSize.value = `Custom (${displayWidth}×${displayHeight})`
      // Keep chartPreset as 'Custom', don't change it to 'Custom (WxH)'
      if (chartPreset.value !== 'Custom') {
        chartPreset.value = 'Custom'
      }

      showSizeLabel.value = true
      window.dispatchEvent(new Event('resize'))
      requestAnimationFrame(() => (showSizeLabel.value = true))
      if (sizeTimeout) clearTimeout(sizeTimeout)
      sizeTimeout = setTimeout(() => (showSizeLabel.value = false), CHART_RESIZE.SIZE_LABEL_TIMEOUT)
    })

    resizeObserver.observe(targetElement)
  }

  // Cleanup
  onBeforeUnmount(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
  })

  return {
    chartContainer,
    showSizeLabel,
    hasBeenResized,
    chartWidth,
    chartHeight,
    chartPreset,
    containerSize,
    isAutoMode,
    isCustomMode,
    applyPresetSize,
    setupResizeObserver
  }
}
