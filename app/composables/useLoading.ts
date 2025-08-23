import { ref, type Ref } from 'vue'

export interface LoadingState {
  isLoading: Ref<boolean>
  error: Ref<string | null>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  withLoading: <T>(promise: Promise<T>) => Promise<T>
}

export function useLoading(initialLoading = false): LoadingState {
  const isLoading = ref(initialLoading)
  const error = ref<string | null>(null)

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
    if (loading) {
      error.value = null
    }
  }

  const setError = (err: string | null) => {
    error.value = err
    isLoading.value = false
  }

  const withLoading = async <T>(promise: Promise<T>): Promise<T> => {
    setLoading(true)
    try {
      const result = await promise
      setLoading(false)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  return {
    isLoading,
    error,
    setLoading,
    setError,
    withLoading
  }
}
