import { computed, ref, type ComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'

/**
 * Composable for managing URL query parameter state with optimistic updates
 *
 * This composable tracks pending values to provide immediate reads after writes,
 * while maintaining the URL as the source of truth for shareable links and
 * browser back/forward navigation.
 *
 * @param key - The query parameter key
 * @param defaultValue - Default value when parameter is not present
 * @param encoder - Function to encode value to string (optional)
 * @param decoder - Function to decode string to value (optional)
 * @param options - Optional configuration (debounce delay in ms)
 * @returns Computed ref that syncs with URL query parameter
 *
 * @example
 * const showASMR = useUrlState('a', true, encodeBool, decodeBool)
 * const countries = useUrlState('c', ['USA', 'SWE']) // Arrays supported
 * const sliderValue = useUrlState('df', '2020', undefined, undefined, { debounce: 300 })
 */
export function useUrlState<T>(
  key: string,
  defaultValue: T,
  encoder?: (val: T) => string | number | string[] | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  decoder?: (val: any) => T | undefined,
  options?: { debounce?: number }
) {
  const route = useRoute()
  const router = useRouter()

  const isArrayType = Array.isArray(defaultValue)

  // Track pending value for optimistic updates
  // When a value is set, we store it here and return it immediately on get()
  // Once the router finishes updating, we clear this to read from URL again
  const pendingValue = ref<T | null>(null)

  // Create update function (either immediate or debounced)
  const updateUrl = (newQuery: Record<string, string | string[]>) => {
    router.push({ query: newQuery }).then(() => {
      // Clear pending value once router has updated
      // This ensures the URL is the source of truth after the async update completes
      pendingValue.value = null
    })
  }

  const debouncedUpdateUrl = options?.debounce
    ? useDebounceFn(updateUrl, options.debounce)
    : updateUrl

  return computed({
    get: () => {
      // Return pending value if it exists (optimistic update)
      // This gives immediate feedback when the user changes a value
      if (pendingValue.value !== null) {
        return pendingValue.value
      }

      // Otherwise read from route (source of truth)
      // This ensures browser back/forward and shareable links work correctly
      const raw = route.query[key]
      if (!raw) return defaultValue

      // Handle array types (no decoder for arrays, return as-is)
      if (isArrayType) {
        const arrayValue = Array.isArray(raw) ? raw : [raw]
        // Safe cast: T is constrained to be an array type when isArrayType is true
        return arrayValue as T
      }

      // Handle single values
      const value = raw as string
      // If no decoder provided, assume T is string and cast directly
      // If decoder is provided, it's responsible for returning correct type
      const decoded = decoder ? decoder(value) : (value as T)
      // If decoder returns undefined, fall back to default
      return decoded ?? defaultValue
    },
    set: (val: T) => {
      console.log(`[useUrlState] Setting ${key} to:`, val)
      // Store pending value for immediate reads
      // This is the key to solving the async URL state issue
      pendingValue.value = val

      const newQuery: Record<string, string | string[]> = {}

      // Copy existing query params, filtering out null values
      for (const [k, v] of Object.entries(route.query)) {
        if (v !== null && v !== undefined) {
          newQuery[k] = Array.isArray(v) ? v.filter((x): x is string => x !== null) : v
        }
      }

      // If value is undefined, remove the key from URL
      if (val === undefined) {
        Reflect.deleteProperty(newQuery, key)
      } else {
        const encodedValue = encoder ? encoder(val) : val
        console.log(`[useUrlState] Encoded value for ${key}:`, encodedValue)

        if (encodedValue === undefined) {
          console.log(`[useUrlState] Encoded value is undefined, deleting ${key}`)
          Reflect.deleteProperty(newQuery, key)
        } else if (Array.isArray(encodedValue)) {
          // Handle arrays
          newQuery[key] = encodedValue.map(String)
        } else {
          // Handle single values
          newQuery[key] = String(encodedValue)
          console.log(`[useUrlState] Set ${key} in query to:`, newQuery[key])
        }
      }

      console.log(`[useUrlState] Final newQuery:`, newQuery)
      debouncedUpdateUrl(newQuery)
    }
  })
}

/**
 * Composable for managing object-type URL query parameter state with optimistic updates
 * For use with select/dropdown components that expect objects with label/value
 *
 * @param key - The query parameter key
 * @param defaultValue - Default value object
 * @param options - Array of available options
 * @param debounceMs - Optional debounce delay in milliseconds
 * @returns Computed ref that syncs with URL and returns full object
 *
 * @example
 * const selectedPeriod = useUrlObjectState('p', chartTypes[3], chartTypes)
 * const selectedPeriod = useUrlObjectState('p', chartTypes[3], chartTypes, 300) // with debounce
 */
export function useUrlObjectState<T extends { name: string, value: string }>(
  key: string,
  defaultValue: T,
  options: T[],
  debounceMs?: number
): ComputedRef<T> {
  const route = useRoute()
  const router = useRouter()

  // Track pending value for optimistic updates
  const pendingValue = ref<T | null>(null)

  // Create update function (either immediate or debounced)
  const updateUrl = (newQuery: Record<string, string | string[]>) => {
    router.push({ query: newQuery }).then(() => {
      // Clear pending value once router has updated
      pendingValue.value = null
    })
  }

  const debouncedUpdateUrl = debounceMs
    ? useDebounceFn(updateUrl, debounceMs)
    : updateUrl

  return computed({
    get: () => {
      // Return pending value if it exists (optimistic update)
      if (pendingValue.value !== null) {
        return pendingValue.value
      }

      // Otherwise read from route (source of truth)
      const value = (route.query[key] as string) || defaultValue.value
      const item = options.find(x => x.value === value)
      return item || defaultValue
    },
    set: (val: T | { label?: string, name: string, value: string }) => {
      // Store pending value for immediate reads
      pendingValue.value = val as T

      const newQuery: Record<string, string | string[]> = {}

      // Copy existing query params, filtering out null values
      for (const [k, v] of Object.entries(route.query)) {
        if (v !== null && v !== undefined) {
          newQuery[k] = Array.isArray(v) ? v.filter((x): x is string => x !== null) : v
        }
      }

      newQuery[key] = val.value
      debouncedUpdateUrl(newQuery)
    }
  })
}
