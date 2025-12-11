import { showToast } from '@/toast'
import { logger } from '@/lib/logger'

/**
 * Error Severity Levels
 *
 * - Info: Informational messages, no action required
 * - Warning: Non-critical issues that should be noted
 * - Error: Errors that affect user experience but are recoverable
 * - Critical: Severe errors that may require immediate attention
 */
export enum ErrorSeverity {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
  Critical = 'critical'
}

/**
 * Error Handler Options
 */
export interface ErrorHandlerOptions {
  /** Error severity level */
  severity?: ErrorSeverity
  /** Whether to show a toast notification to the user */
  showToast?: boolean
  /** Whether to log the error to console */
  logToConsole?: boolean
  /** Custom user-facing message (if different from error message) */
  userMessage?: string
  /** Additional context for logging/debugging */
  context?: string
  /** Whether to suppress all output (silent error) */
  silent?: boolean
}

/**
 * Unified Error Handler
 *
 * Provides consistent error handling across the application with:
 * - Structured logging
 * - User notifications via toast
 * - Different severity levels
 * - Context tracking for debugging
 * - Future integration with error tracking services (e.g., Sentry)
 *
 * @example
 * ```ts
 * try {
 *   await someOperation()
 * } catch (err) {
 *   ErrorHandler.handle(err, {
 *     severity: ErrorSeverity.Error,
 *     userMessage: 'Failed to save chart',
 *     context: 'saveChart'
 *   })
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ErrorHandler {
  /**
   * Main error handling method
   *
   * @param error - The error object or message
   * @param options - Error handling options
   * @returns The error message (useful for setting error state)
   */
  static handle(error: unknown, options: ErrorHandlerOptions = {}): string {
    const {
      severity = ErrorSeverity.Error,
      showToast: shouldShowToast = true,
      logToConsole = true,
      userMessage,
      context,
      silent = false
    } = options

    // Extract error message
    const errorMessage = this.extractErrorMessage(error)
    const displayMessage = userMessage || errorMessage

    // Silent mode suppresses all output
    if (silent) {
      return errorMessage
    }

    // Log to console with context
    if (logToConsole) {
      this.logError(errorMessage, severity, context)
    }

    // Show user notification
    if (shouldShowToast) {
      this.showUserNotification(displayMessage, severity)
    }

    // Future: Send to error tracking service (Sentry, etc.)
    // this.sendToErrorTracking(error, severity, context)

    return errorMessage
  }

  /**
   * Handle errors with toast notification (default behavior)
   */
  static handleError(
    error: unknown,
    userMessage: string,
    context?: string
  ): string {
    return this.handle(error, {
      severity: ErrorSeverity.Error,
      userMessage,
      context,
      showToast: true
    })
  }

  /**
   * Handle API errors with consistent messaging
   */
  static handleApiError(
    error: unknown,
    operation: string,
    context?: string
  ): string {
    const userMessage = `Failed to ${operation}`

    return this.handle(error, {
      severity: ErrorSeverity.Error,
      userMessage,
      context: context || `api:${operation}`,
      showToast: true
    })
  }

  /**
   * Handle errors silently (no toast, only console logging)
   */
  static handleSilentError(
    error: unknown,
    context?: string
  ): string {
    return this.handle(error, {
      severity: ErrorSeverity.Warning,
      showToast: false,
      logToConsole: true,
      context
    })
  }

  /**
   * Handle warning-level issues
   */
  static handleWarning(
    message: string,
    context?: string,
    showToastNotification = false
  ): string {
    return this.handle(message, {
      severity: ErrorSeverity.Warning,
      showToast: showToastNotification,
      logToConsole: true,
      context
    })
  }

  /**
   * Handle critical errors that require immediate attention
   */
  static handleCritical(
    error: unknown,
    userMessage: string,
    context?: string
  ): string {
    return this.handle(error, {
      severity: ErrorSeverity.Critical,
      userMessage,
      context,
      showToast: true
    })
  }

  /**
   * Extract human-readable message from error object
   */
  static extractErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error
    }

    if (error instanceof Error) {
      return error.message
    }

    // Handle Nuxt/Nitro API errors (from $fetch)
    if (error && typeof error === 'object') {
      // Check for data.message (Nitro error format)
      if ('data' in error && error.data && typeof error.data === 'object') {
        // First try data.message
        if ('message' in error.data && error.data.message) {
          return String(error.data.message)
        }
        // Then try data.statusMessage
        if ('statusMessage' in error.data && error.data.statusMessage) {
          return String(error.data.statusMessage)
        }
      }

      // Check for statusMessage (alternative format)
      if ('statusMessage' in error && error.statusMessage) {
        return String(error.statusMessage)
      }

      // Fallback to message property
      if ('message' in error && error.message) {
        return String(error.message)
      }
    }

    return 'An unexpected error occurred'
  }

  /**
   * Log error to console with appropriate level and formatting
   */
  private static logError(
    message: string,
    severity: ErrorSeverity,
    context?: string
  ): void {
    const log = context ? logger.withPrefix(context) : logger.withPrefix('Error')

    switch (severity) {
      case ErrorSeverity.Critical:
      case ErrorSeverity.Error:
        log.error(message)
        break
      case ErrorSeverity.Warning:
        log.warn(message)
        break
      case ErrorSeverity.Info:
        log.info(message)
        break
    }
  }

  /**
   * Show user-facing notification based on severity
   */
  private static showUserNotification(
    message: string,
    severity: ErrorSeverity
  ): void {
    // Map severity to toast type
    const toastType = severity === ErrorSeverity.Critical || severity === ErrorSeverity.Error
      ? 'error'
      : severity === ErrorSeverity.Warning
        ? 'warning'
        : 'info'

    showToast(message, toastType)
  }
}

// Convenience exports
export const handleError = ErrorHandler.handleError.bind(ErrorHandler)
export const handleApiError = ErrorHandler.handleApiError.bind(ErrorHandler)
export const handleSilentError = ErrorHandler.handleSilentError.bind(ErrorHandler)
export const handleWarning = ErrorHandler.handleWarning.bind(ErrorHandler)
export const handleCritical = ErrorHandler.handleCritical.bind(ErrorHandler)
