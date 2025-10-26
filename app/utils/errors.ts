/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  // Handle FetchError from $fetch
  if (error && typeof error === 'object' && 'data' in error) {
    const fetchError = error as { data?: { message?: string } }
    if (fetchError.data?.message) {
      return fetchError.data.message
    }
  }

  // Handle standard Error
  if (error instanceof Error) {
    return error.message
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error
  }

  // Fallback
  return 'An unexpected error occurred'
}
