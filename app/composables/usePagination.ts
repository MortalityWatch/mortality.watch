import { ref, computed, type Ref, type ComputedRef } from 'vue'

export interface UsePaginationOptions<T> {
  items: Ref<T[]>
  itemsPerPage?: number
}

export interface UsePaginationReturn<T> {
  currentPage: Ref<number>
  itemsPerPage: number
  paginatedItems: ComputedRef<T[]>
  total: ComputedRef<number>
  startIndex: ComputedRef<number>
  endIndex: ComputedRef<number>
  reset: () => void
}

export const usePagination = <T>(
  options: UsePaginationOptions<T>
): UsePaginationReturn<T> => {
  const { items, itemsPerPage = 10 } = options

  const currentPage = ref(1)

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return items.value.slice(start, end)
  })

  const total = computed(() => items.value.length)

  const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage + 1)

  const endIndex = computed(() => Math.min(currentPage.value * itemsPerPage, total.value))

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
