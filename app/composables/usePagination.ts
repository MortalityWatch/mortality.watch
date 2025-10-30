import { ref, computed, type Ref, type ComputedRef } from 'vue'

export interface UsePaginationOptions<T> {
  items: Ref<T[]>
  itemsPerPage?: number
}

export interface UsePaginationReturn<T> {
  currentPage: Ref<number>
  itemsPerPage: Ref<number>
  paginatedItems: ComputedRef<T[]>
  total: ComputedRef<number>
  startIndex: ComputedRef<number>
  endIndex: ComputedRef<number>
  reset: () => void
}

export const usePagination = <T>(
  options: UsePaginationOptions<T>
): UsePaginationReturn<T> => {
  const { items, itemsPerPage: initialItemsPerPage = 10 } = options

  const currentPage = ref(1)
  const itemsPerPage = ref(initialItemsPerPage)

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return items.value.slice(start, end)
  })

  const total = computed(() => items.value.length)

  const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value + 1)

  const endIndex = computed(() => Math.min(currentPage.value * itemsPerPage.value, total.value))

  const reset = () => {
    currentPage.value = 1
  }

  return {
    currentPage,
    itemsPerPage,
    paginatedItems,
    total,
    startIndex,
    endIndex,
    reset
  }
}
