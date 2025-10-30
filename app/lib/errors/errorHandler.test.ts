import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ErrorHandler, ErrorSeverity, handleError, handleApiError, handleSilentError } from './errorHandler'

// Mock the toast module
vi.mock('@/toast', () => ({
  showToast: vi.fn()
}))

describe('ErrorHandler', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleErrorSpy: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleWarnSpy: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleLogSpy: any

  beforeEach(() => {
    // Spy on console methods
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('handle', () => {
    it('should extract message from Error instance', () => {
      const error = new Error('Test error message')
      const result = ErrorHandler.handle(error, { showToast: false, logToConsole: false })

      expect(result).toBe('Test error message')
    })

    it('should extract message from string error', () => {
      const result = ErrorHandler.handle('String error', { showToast: false, logToConsole: false })

      expect(result).toBe('String error')
    })

    it('should extract message from object with message property', () => {
      const error = { message: 'Object error' }
      const result = ErrorHandler.handle(error, { showToast: false, logToConsole: false })

      expect(result).toBe('Object error')
    })

    it('should return default message for unknown error types', () => {
      const result = ErrorHandler.handle(123, { showToast: false, logToConsole: false })

      expect(result).toBe('An unexpected error occurred')
    })

    it('should log to console by default', () => {
      ErrorHandler.handle(new Error('Test'), { showToast: false })

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Error] Test')
    })

    it('should not log when logToConsole is false', () => {
      ErrorHandler.handle(new Error('Test'), { showToast: false, logToConsole: false })

      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should log with context', () => {
      ErrorHandler.handle(new Error('Test'), {
        showToast: false,
        context: 'testFunction'
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith('[testFunction] Test')
    })

    it('should use correct console method based on severity', () => {
      // Error severity
      ErrorHandler.handle('Error message', {
        severity: ErrorSeverity.Error,
        showToast: false
      })
      expect(consoleErrorSpy).toHaveBeenCalled()

      // Warning severity
      ErrorHandler.handle('Warning message', {
        severity: ErrorSeverity.Warning,
        showToast: false
      })
      expect(consoleWarnSpy).toHaveBeenCalled()

      // Info severity
      ErrorHandler.handle('Info message', {
        severity: ErrorSeverity.Info,
        showToast: false
      })
      expect(consoleLogSpy).toHaveBeenCalled()
    })

    it('should suppress all output in silent mode', () => {
      ErrorHandler.handle(new Error('Silent error'), {
        silent: true
      })

      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should use custom user message when provided', () => {
      const result = ErrorHandler.handle(new Error('Technical error'), {
        userMessage: 'User-friendly message',
        showToast: false,
        logToConsole: false
      })

      // The returned message should still be the extracted error message
      expect(result).toBe('Technical error')
    })
  })

  describe('handleError', () => {
    it('should handle error with user message and context', () => {
      const error = new Error('API failed')
      const result = handleError(error, 'Failed to save data', 'saveFunction')

      expect(result).toBe('API failed')
      expect(consoleErrorSpy).toHaveBeenCalledWith('[saveFunction] API failed')
    })
  })

  describe('handleApiError', () => {
    it('should format API error message', () => {
      const error = new Error('Network error')
      const result = handleApiError(error, 'fetch user data', 'getUserData')

      expect(result).toBe('Network error')
      expect(consoleErrorSpy).toHaveBeenCalledWith('[getUserData] Network error')
    })
  })

  describe('handleSilentError', () => {
    it('should log error without showing toast', () => {
      const error = new Error('Background error')
      const result = handleSilentError(error, 'backgroundTask')

      expect(result).toBe('Background error')
      expect(consoleWarnSpy).toHaveBeenCalledWith('[backgroundTask] Background error')
    })
  })

  describe('extractErrorMessage', () => {
    it('should handle FetchError-like objects', () => {
      const fetchError = {
        data: {
          message: 'Fetch error message'
        }
      }
      const result = ErrorHandler.handle(fetchError, { showToast: false, logToConsole: false })

      expect(result).toBe('An unexpected error occurred')
    })
  })

  describe('convenience exports', () => {
    it('should export convenience functions', () => {
      expect(typeof handleError).toBe('function')
      expect(typeof handleApiError).toBe('function')
      expect(typeof handleSilentError).toBe('function')
    })
  })
})
