/**
 * Unit tests for useSaveChart composable
 *
 * Tests cover:
 * - Modal state management
 * - Save functionality with API integration
 * - Form validation
 * - Error handling
 * - Success navigation
 * - Public vs private charts
 */
/* eslint-disable @typescript-eslint/no-explicit-any, @stylistic/max-statements-per-line */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSaveChart } from './useSaveChart'

import { showToast } from '@/toast'

// Mock dependencies
vi.mock('@/toast', () => ({
  showToast: vi.fn()
}))

// Mock Nuxt's $fetch and navigateTo
;(global as any).$fetch = vi.fn()
;(global as any).navigateTo = vi.fn()

describe('useSaveChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked($fetch).mockResolvedValue({
      chart: { slug: 'test-chart-slug', id: '123' }
    })
  })

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  describe('initialization', () => {
    it('should initialize with correct default values for explorer', () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      expect(saveChart.showSaveModal.value).toBe(false)
      expect(saveChart.savingChart.value).toBe(false)
      expect(saveChart.saveChartName.value).toBe('')
      expect(saveChart.saveChartDescription.value).toBe('')
      expect(saveChart.saveChartPublic.value).toBe(false)
      expect(saveChart.saveError.value).toBe('')
      expect(saveChart.saveSuccess.value).toBe(false)
    })

    it('should initialize with correct default values for ranking', () => {
      const saveChart = useSaveChart({ chartType: 'ranking' })

      expect(saveChart.showSaveModal.value).toBe(false)
      expect(saveChart.savingChart.value).toBe(false)
    })

    it('should use custom entity name when provided', () => {
      const saveChart = useSaveChart({
        chartType: 'explorer',
        entityName: 'custom'
      })

      // Entity name is used internally but not exposed
      // Test it through error message
      saveChart.saveToDB({})

      // Wait for validation
      expect(saveChart.saveError.value).toContain('Custom name is required')
    })
  })

  // ============================================================================
  // MODAL STATE MANAGEMENT
  // ============================================================================

  describe('modal management', () => {
    it('should open modal and reset form state', () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      // Set some values
      saveChart.saveChartName.value = 'Old Name'
      saveChart.saveChartDescription.value = 'Old Description'
      saveChart.saveChartPublic.value = true
      saveChart.saveError.value = 'Old Error'
      saveChart.saveSuccess.value = true

      // Open modal
      saveChart.openSaveModal()

      expect(saveChart.showSaveModal.value).toBe(true)
      expect(saveChart.saveChartName.value).toBe('')
      expect(saveChart.saveChartDescription.value).toBe('')
      expect(saveChart.saveChartPublic.value).toBe(false)
      expect(saveChart.saveError.value).toBe('')
      expect(saveChart.saveSuccess.value).toBe(false)
    })

    it('should close modal', () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.showSaveModal.value = true
      saveChart.closeSaveModal()

      expect(saveChart.showSaveModal.value).toBe(false)
    })

    it('should preserve modal state across open/close cycles', () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.openSaveModal()
      saveChart.saveChartName.value = 'Test Chart'
      saveChart.closeSaveModal()
      saveChart.openSaveModal()

      // Should reset on new open
      expect(saveChart.saveChartName.value).toBe('')
    })
  })

  // ============================================================================
  // VALIDATION
  // ============================================================================

  describe('validation', () => {
    it('should require chart name', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      await saveChart.saveToDB({ test: 'data' })

      expect(saveChart.saveError.value).toBe('Chart name is required')
      expect($fetch).not.toHaveBeenCalled()
    })

    it('should trim whitespace from name', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.saveChartName.value = '   '
      await saveChart.saveToDB({ test: 'data' })

      expect(saveChart.saveError.value).toBe('Chart name is required')
    })

    it('should accept valid name', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.saveChartName.value = 'Valid Name'
      await saveChart.saveToDB({ test: 'data' })

      expect(saveChart.saveError.value).toBe('')
      expect($fetch).toHaveBeenCalled()
    })

    it('should use different entity name for ranking', async () => {
      const saveChart = useSaveChart({ chartType: 'ranking' })

      await saveChart.saveToDB({ test: 'data' })

      expect(saveChart.saveError.value).toBe('Ranking name is required')
    })
  })

  // ============================================================================
  // SAVE FUNCTIONALITY
  // ============================================================================

  describe('save to database', () => {
    it('should save chart with minimal data', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.saveChartName.value = 'Test Chart'
      const stateData = { countries: ['USA'], chartType: 'yearly' }

      await saveChart.saveToDB(stateData)

      expect($fetch).toHaveBeenCalledWith('/api/charts', {
        method: 'POST',
        body: {
          name: 'Test Chart',
          description: null,
          chartState: JSON.stringify(stateData),
          chartType: 'explorer',
          isPublic: false
        }
      })
    })

    it('should save chart with description', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.saveChartName.value = 'Test Chart'
      saveChart.saveChartDescription.value = 'Test Description'

      await saveChart.saveToDB({ test: 'data' })

      expect($fetch).toHaveBeenCalledWith('/api/charts', {
        method: 'POST',
        body: expect.objectContaining({
          description: 'Test Description'
        })
      })
    })

    it('should trim description whitespace', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.saveChartName.value = 'Test Chart'
      saveChart.saveChartDescription.value = '  Padded Description  '

      await saveChart.saveToDB({ test: 'data' })

      expect($fetch).toHaveBeenCalledWith('/api/charts', {
        method: 'POST',
        body: expect.objectContaining({
          description: 'Padded Description'
        })
      })
    })

    it('should convert empty description to null', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.saveChartName.value = 'Test Chart'
      saveChart.saveChartDescription.value = '   '

      await saveChart.saveToDB({ test: 'data' })

      expect($fetch).toHaveBeenCalledWith('/api/charts', {
        method: 'POST',
        body: expect.objectContaining({
          description: null
        })
      })
    })

    it('should save as private by default', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.saveChartName.value = 'Test Chart'
      await saveChart.saveToDB({ test: 'data' })

      expect($fetch).toHaveBeenCalledWith('/api/charts', {
        method: 'POST',
        body: expect.objectContaining({
          isPublic: false
        })
      })
    })

    it('should save as public when requested', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.saveChartName.value = 'Test Chart'
      saveChart.saveChartPublic.value = true
      await saveChart.saveToDB({ test: 'data' })

      expect($fetch).toHaveBeenCalledWith('/api/charts', {
        method: 'POST',
        body: expect.objectContaining({
          isPublic: true
        })
      })
    })

    it('should serialize state data as JSON', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.saveChartName.value = 'Test Chart'
      const complexState = {
        countries: ['USA', 'GBR'],
        dateFrom: '2020',
        dateTo: '2023',
        nested: { value: 42 }
      }

      await saveChart.saveToDB(complexState)

      expect($fetch).toHaveBeenCalledWith('/api/charts', {
        method: 'POST',
        body: expect.objectContaining({
          chartState: JSON.stringify(complexState)
        })
      })
    })
  })

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  describe('loading state', () => {
    it('should set savingChart during save operation', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      vi.mocked($fetch).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ chart: {} }), 100))
      )

      saveChart.saveChartName.value = 'Test Chart'
      const promise = saveChart.saveToDB({ test: 'data' })

      expect(saveChart.savingChart.value).toBe(true)
      await promise
      expect(saveChart.savingChart.value).toBe(false)
    })

    it('should reset savingChart on error', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      vi.mocked($fetch).mockRejectedValue(new Error('Network error'))

      saveChart.saveChartName.value = 'Test Chart'
      await saveChart.saveToDB({ test: 'data' })

      expect(saveChart.savingChart.value).toBe(false)
    })

    it('should clear error before save', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.saveError.value = 'Old Error'
      saveChart.saveChartName.value = 'Test Chart'
      await saveChart.saveToDB({ test: 'data' })

      expect(saveChart.saveError.value).toBe('')
    })
  })

  // ============================================================================
  // SUCCESS HANDLING
  // ============================================================================

  describe('success handling', () => {
    it('should close modal on successful save', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.saveChartName.value = 'Test Chart'
      saveChart.showSaveModal.value = true

      await saveChart.saveToDB({ test: 'data' })

      expect(saveChart.showSaveModal.value).toBe(false)
    })

    it('should show success toast for private chart', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.saveChartName.value = 'Test Chart'
      saveChart.saveChartPublic.value = false

      await saveChart.saveToDB({ test: 'data' })

      expect(showToast).toHaveBeenCalledWith('Chart saved!', 'success')
    })

    it('should show success toast for public chart', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.saveChartName.value = 'Test Chart'
      saveChart.saveChartPublic.value = true

      await saveChart.saveToDB({ test: 'data' })

      expect(showToast).toHaveBeenCalledWith(
        'Chart saved and published!',
        'success',
        [{ label: 'View', to: '/charts/test-chart-slug' }]
      )
    })

    it('should show toast without action for private chart', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.saveChartName.value = 'Test Chart'
      saveChart.saveChartPublic.value = false

      await saveChart.saveToDB({ test: 'data' })

      expect(showToast).toHaveBeenCalledWith('Chart saved!', 'success')
    })

    it('should handle missing slug in response', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      vi.mocked($fetch).mockResolvedValue({ chart: { id: '123' } })

      saveChart.saveChartName.value = 'Test Chart'
      saveChart.saveChartPublic.value = true

      await saveChart.saveToDB({ test: 'data' })

      expect(navigateTo).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('error handling', () => {
    it('should handle API errors', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      vi.mocked($fetch).mockRejectedValue(new Error('API Error'))

      saveChart.saveChartName.value = 'Test Chart'
      await saveChart.saveToDB({ test: 'data' })

      expect(saveChart.saveError.value).toBe('API Error')
      expect(saveChart.showSaveModal.value).toBe(false)
    })

    it('should handle non-Error objects', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      vi.mocked($fetch).mockRejectedValue('String error')

      saveChart.saveChartName.value = 'Test Chart'
      await saveChart.saveToDB({ test: 'data' })

      expect(saveChart.saveError.value).toBe('Failed to save chart')
    })

    it('should log errors to console', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked($fetch).mockRejectedValue(new Error('Test Error'))

      saveChart.saveChartName.value = 'Test Chart'
      await saveChart.saveToDB({ test: 'data' })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save chart:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should use entity name in error message', async () => {
      const saveChart = useSaveChart({ chartType: 'ranking' })

      vi.mocked($fetch).mockRejectedValue('Error')

      saveChart.saveChartName.value = 'Test Ranking'
      await saveChart.saveToDB({ test: 'data' })

      expect(saveChart.saveError.value).toBe('Failed to save ranking')
    })
  })

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('edge cases', () => {
    it('should handle empty state data', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.saveChartName.value = 'Test Chart'
      await saveChart.saveToDB({})

      expect($fetch).toHaveBeenCalledWith('/api/charts', {
        method: 'POST',
        body: expect.objectContaining({
          chartState: '{}'
        })
      })
    })

    it('should handle special characters in name', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      saveChart.saveChartName.value = 'Test & Chart <>"'
      await saveChart.saveToDB({ test: 'data' })

      expect($fetch).toHaveBeenCalledWith('/api/charts', {
        method: 'POST',
        body: expect.objectContaining({
          name: 'Test & Chart <>"'
        })
      })
    })

    it('should handle very long names', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      const longName = 'A'.repeat(1000)
      saveChart.saveChartName.value = longName
      await saveChart.saveToDB({ test: 'data' })

      expect($fetch).toHaveBeenCalledWith('/api/charts', {
        method: 'POST',
        body: expect.objectContaining({
          name: longName
        })
      })
    })

    it('should handle response without chart object', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      vi.mocked($fetch).mockResolvedValue({})

      saveChart.saveChartName.value = 'Test Chart'
      saveChart.saveChartPublic.value = true

      await saveChart.saveToDB({ test: 'data' })

      expect(navigateTo).not.toHaveBeenCalled()
    })

    it('should handle concurrent save attempts', async () => {
      const saveChart = useSaveChart({ chartType: 'explorer' })

      let resolveFirst: () => void
      const firstPromise = new Promise<any>((resolve) => { resolveFirst = () => resolve({ chart: {} }) })

      vi.mocked($fetch)
        .mockReturnValueOnce(firstPromise)
        .mockResolvedValueOnce({ chart: {} })

      saveChart.saveChartName.value = 'Test Chart'

      // Start first save
      const save1 = saveChart.saveToDB({ test: 'data1' })
      expect(saveChart.savingChart.value).toBe(true)

      // Try second save while first is pending
      // Note: The composable doesn't explicitly prevent concurrent saves
      // but savingChart.value will be true
      const save2 = saveChart.saveToDB({ test: 'data2' })

      resolveFirst!()
      await save1
      await save2

      expect(saveChart.savingChart.value).toBe(false)
    })
  })
})
