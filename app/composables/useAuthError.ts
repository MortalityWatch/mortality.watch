import { ErrorHandler } from '@/lib/errors/errorHandler'

/**
 * Composable for handling authentication form errors
 *
 * Provides consistent error handling across auth pages with:
 * - Distinction between validation errors (handled by form) and API errors
 * - Centralized error message extraction using ErrorHandler
 * - Dev-only console logging
 *
 * @example
 * ```ts
 * const { formError, handleAuthError, clearError } = useAuthError()
 *
 * async function onSubmit(event: FormSubmitEvent<Schema>) {
 *   clearError()
 *   try {
 *     await signIn(event.data.email, event.data.password)
 *   } catch (error) {
 *     handleAuthError(error, 'login')
 *   }
 * }
 * ```
 */
export function useAuthError() {
  const formError = ref<string | null>(null)

  /**
   * Handle authentication errors
   *
   * Only displays API errors (with statusCode or data property).
   * Validation errors are handled by the form component itself.
   *
   * @param error - The error object to handle
   * @param context - Context string for logging (e.g., 'login', 'signup')
   * @returns true if error was displayed, false if skipped
   */
  const handleAuthError = (error: unknown, context: string): boolean => {
    const errorObj = error && typeof error === 'object' ? error : { message: String(error) }

    // Check if this is an API error (has statusCode or data with statusCode)
    // Skip validation errors which don't have these properties
    const isApiError = ('statusCode' in errorObj)
      || ('data' in errorObj && errorObj.data && typeof errorObj.data === 'object')

    if (!isApiError) {
      // This is likely a validation or other non-API error
      // Don't show in our custom alert - let the form handle it
      if (import.meta.dev) {
        console.warn(`[${context}] Non-API error detected, not displaying in alert`)
      }
      return false
    }

    // Log error in development only
    if (import.meta.dev) {
      console.error(`[${context}] Error caught:`, error)
    }

    // Use ErrorHandler to extract the message
    formError.value = ErrorHandler.extractErrorMessage(errorObj)
    return true
  }

  /**
   * Clear the current error message
   */
  const clearError = () => {
    formError.value = null
  }

  return {
    formError,
    handleAuthError,
    clearError
  }
}
