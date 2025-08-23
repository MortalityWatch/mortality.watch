import type { LocationQueryValue } from 'vue-router'
import { useRoute, useRouter } from 'vue-router'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import { encodeBool, encodeString } from '@/lib/state/stateSerializer'

type InputTypes = string | string[] | boolean | number | undefined
type OutputTypes = string | string[] | number | undefined

const maybeEncode = (val: InputTypes): OutputTypes => {
  if (typeof val === 'boolean') return encodeBool(val)
  if (typeof val === 'string') return encodeString(val)
  if (Array.isArray(val) && typeof val[0] === 'string') {
    return val.map(encodeString) as string[]
  }
  return val
}

export const useQueryParam = <T extends InputTypes>(
  key: string,
  fallback: T
): [ComputedRef<T>, (val: T | undefined) => void] => {
  const router = useRouter()
  const route = useRoute()

  const parseQueryValue = (
    raw: LocationQueryValue | LocationQueryValue[] | undefined
  ): T => {
    // If no raw value exists, return fallback
    if (!raw) return fallback

    // Handle undefined case
    if (raw === 'undefined') return fallback

    // Existing array handling logic
    return Array.isArray(fallback)
      ? ((Array.isArray(raw) ? raw : [raw]) as T)
      : (raw as T)
  }

  const param = computed<T>({
    get: () => {
      const raw = route.query[key]
      return parseQueryValue(raw ?? undefined)
    },
    set: (val) => {
      const newQuery = { ...route.query }

      // If value is undefined, delete the key
      if (val === undefined) {
        Reflect.deleteProperty(newQuery, key)
      } else {
        // Use maybeEncode for value conversion
        newQuery[key]
          = val === null
            ? null
            : Array.isArray(val)
              ? val.map(String)
              : (maybeEncode(val) as LocationQueryValue)
      }

      router.replace({ query: newQuery })
    }
  })

  return [
    param,
    (val: T | undefined) => {
      if (val !== undefined) {
        param.value = val as T
      }
    }
  ]
}

// export const useQueryParam = <T extends InputTypes>(
//   key: string,
//   fallback: T
// ): [ComputedRef<T>, (val: T) => void] => {
//   const router = useRouter()
//   const route = useRoute()

//   const param = computed<T>({
//     get: () => {
//       const raw = route.query[key]
//       if (!raw) return fallback
//       return Array.isArray(fallback)
//         ? ((Array.isArray(raw) ? raw : [raw]) as T)
//         : (raw as T)
//     },
//     set: (val) => {
//       router.replace({
//         query: {
//           ...route.query,
//           [key]: maybeEncode(val)
//         }
//       })
//     }
//   })

//   return [param, (val: T) => (param.value = val)]
// }
