/**
 * useErrorRecovery Composable
 *
 * Phase 15b: Unified error recovery and retry logic for consistent error handling
 *
 * Provides:
 * - Automatic retry with exponential backoff
 * - Retryable error detection (network, timeout, 5xx)
 * - User feedback integration (toast notifications)
 * - Configurable retry strategies
 * - Error logging with context
 *
 * @example
 * ```ts
 * const { withRetry, handleError } = useErrorRecovery()
 *
 * try {
 *   await withRetry(() => fetchData(), {
 *     maxRetries: 3,
 *     showToast: true,
 *     toastMessage: 'Failed to load data'
 *   })
 * } catch (error) {
 *   handleError(error, 'Failed to load data')
 * }
 * ```
 */

import { showToast } from '@/toast'
import { ErrorHandler } from '@/lib/errors/errorHandler'
import { UI_CONFIG } from '@/lib/config/constants'

/**
 * Options for error recovery operations
 */
export interface ErrorRecoveryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number
  /** Initial delay between retries in milliseconds (default: 1000) */
  retryDelay?: number
  /** Use exponential backoff for retry delays (default: true) */
  exponentialBackoff?: boolean
  /** Callback invoked on each error (before retry) */
  onError?: (error: Error, attempt: number) => void
  /** Show toast notification on final failure (default: false) */
  showToast?: boolean
  /** Custom toast message (default: error message) */
  toastMessage?: string
  /** Context string for logging */
  context?: string
  /** Only retry on retryable errors (default: true) */
  onlyRetryableErrors?: boolean
}

/**
 * Error types that are typically retryable
 */
const RETRYABLE_ERROR_PATTERNS = [
  // Network errors
  /network/i,
  /fetch/i,
  /timeout/i,
  /timed out/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /ETIMEDOUT/i,

  // HTTP errors
  /502/,
  /503/,
  /504/,
  /gateway/i,
  /service unavailable/i,

  // Abort errors
  /abort/i,
  /cancelled/i
]

/**
 * HTTP status codes that are retryable
 */
const RETRYABLE_STATUS_CODES = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504 // Gateway Timeout
]

/**
 * Error Recovery Composable
 *
 * Provides unified error handling and retry logic across the application.
 */
export function useErrorRecovery() {
  /**
   * Check if an error is retryable
   *
   * Determines if an error is likely transient and worth retrying.
   * Checks for network errors, timeouts, and 5xx server errors.
   *
   * @param error - The error to check
   * @returns true if the error is retryable
   */
  function isRetryableError(error: unknown): boolean {
    // Convert error to string for pattern matching
    const errorStr = String(error)
    const errorMessage = ErrorHandler.extractErrorMessage(error).toLowerCase()

    // Check error message patterns
    if (RETRYABLE_ERROR_PATTERNS.some(pattern => pattern.test(errorStr) || pattern.test(errorMessage))) {
      return true
    }

    // Check HTTP status codes
    if (error && typeof error === 'object') {
      // Check statusCode property (Nuxt/Nitro errors)
      if ('statusCode' in error && typeof error.statusCode === 'number') {
        if (RETRYABLE_STATUS_CODES.includes(error.statusCode)) {
          return true
        }
      }

      // Check data.statusCode (nested format)
      if ('data' in error && error.data && typeof error.data === 'object') {
        if ('statusCode' in error.data && typeof error.data.statusCode === 'number') {
          if (RETRYABLE_STATUS_CODES.includes(error.data.statusCode)) {
            return true
          }
        }
      }

      // Check status property (fetch Response errors)
      if ('status' in error && typeof error.status === 'number') {
        if (RETRYABLE_STATUS_CODES.includes(error.status)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Calculate retry delay with optional exponential backoff
   *
   * @param baseDelay - Base delay in milliseconds
   * @param attempt - Current attempt number (0-indexed)
   * @param useExponentialBackoff - Whether to use exponential backoff
   * @returns Delay in milliseconds
   */
  function calculateRetryDelay(
    baseDelay: number,
    attempt: number,
    useExponentialBackoff: boolean
  ): number {
    if (!useExponentialBackoff) {
      return baseDelay
    }

    // Exponential backoff: baseDelay * 2^attempt
    // Capped at 30 seconds to prevent excessive delays
    const exponentialDelay = baseDelay * Math.pow(2, attempt)
    return Math.min(exponentialDelay, 30000)
  }

  /**
   * Wait for a specified duration
   *
   * @param ms - Milliseconds to wait
   * @returns Promise that resolves after the delay
   */
  function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Execute an async operation with automatic retry
   *
   * Retries the operation on failure with configurable options.
   * Supports exponential backoff and smart error detection.
   *
   * @param operation - Async function to execute
   * @param options - Retry options
   * @returns Result of the operation
   * @throws The last error if all retries are exhausted
   */
  async function withRetry<T>(
    operation: () => Promise<T>,
    options: ErrorRecoveryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = UI_CONFIG.MAX_RETRY_ATTEMPTS,
      retryDelay = UI_CONFIG.RETRY_DELAY,
      exponentialBackoff = true,
      onError,
      showToast: shouldShowToast = false,
      toastMessage,
      context,
      onlyRetryableErrors = true
    } = options

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Execute the operation
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Call error callback if provided
        if (onError) {
          onError(lastError, attempt)
        }

        // Log the error
        const contextStr = context || 'withRetry'
        if (import.meta.dev) {
          console.warn(`[${contextStr}] Attempt ${attempt + 1}/${maxRetries + 1} failed:`, lastError.message)
        }

        // Check if we should retry
        const isLastAttempt = attempt === maxRetries
        const shouldRetry = !isLastAttempt && (!onlyRetryableErrors || isRetryableError(lastError))

        if (!shouldRetry) {
          // No more retries, throw the error
          if (shouldShowToast) {
            const message = toastMessage || ErrorHandler.extractErrorMessage(lastError)
            showToast(message, 'error')
          }
          throw lastError
        }

        // Calculate and wait for retry delay
        const waitTime = calculateRetryDelay(retryDelay, attempt, exponentialBackoff)
        if (import.meta.dev) {
          console.log(`[${contextStr}] Retrying in ${waitTime}ms...`)
        }
        await delay(waitTime)
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Operation failed')
  }

  /**
   * Execute with exponential backoff
   *
   * Convenience method for common exponential backoff pattern.
   * Uses sensible defaults for most API retry scenarios.
   *
   * @param operation - Async function to execute
   * @param maxAttempts - Maximum number of attempts (default: 3)
   * @returns Result of the operation
   */
  async function withExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = UI_CONFIG.MAX_RETRY_ATTEMPTS
  ): Promise<T> {
    return withRetry(operation, {
      maxRetries: maxAttempts - 1, // maxRetries is in addition to first attempt
      exponentialBackoff: true,
      onlyRetryableErrors: true
    })
  }

  /**
   * Handle error with user feedback
   *
   * Provides consistent error handling with toast notifications.
   * Logs the error and shows user-friendly message.
   *
   * @param error - The error to handle
   * @param userMessage - User-friendly error message
   * @param context - Context string for logging
   */
  function handleError(
    error: unknown,
    userMessage?: string,
    context?: string
  ): void {
    ErrorHandler.handleError(error, userMessage || 'An error occurred', context)
  }

  /**
   * Handle error silently (no toast)
   *
   * Logs the error without showing user notification.
   * Useful for background operations or non-critical errors.
   *
   * @param error - The error to handle
   * @param context - Context string for logging
   */
  function handleSilentError(
    error: unknown,
    context?: string
  ): void {
    ErrorHandler.handleSilentError(error, context)
  }

  return {
    // Core retry functions
    withRetry,
    withExponentialBackoff,

    // Error handling
    handleError,
    handleSilentError,
    isRetryableError,

    // Utilities (exposed for testing)
    calculateRetryDelay,
    delay
  }
}
