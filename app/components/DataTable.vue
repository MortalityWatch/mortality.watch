<script setup lang="ts" generic="T extends Record<string, any>">
interface Column {
  key: string
  label: string
  class?: string
}

interface Props {
  columns: Column[]
  data: T[]
  rowKey?: keyof T
  allowHtml?: boolean
  htmlColumns?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id' as keyof T,
  allowHtml: false,
  htmlColumns: () => []
})

const shouldRenderHtml = (columnKey: string) => {
  return props.allowHtml && props.htmlColumns.includes(columnKey)
}

const getRowKey = (row: T, index: number): string => {
  const rowKey = props.rowKey as keyof T
  const key = row[rowKey]
  return key != null ? String(key) : String(index)
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-800">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            :class="column.class"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
        <tr
          v-for="(row, index) in data"
          :key="getRowKey(row, index)"
          :class="index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
            :class="shouldRenderHtml(column.key) ? 'html-content' : 'whitespace-nowrap'"
          >
            <span
              v-if="shouldRenderHtml(column.key)"
              v-html="row[column.key]"
            />
            <template v-else>
              {{ row[column.key] }}
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.html-content :deep(a) {
  color: rgb(var(--color-primary-500));
}

.html-content :deep(a:hover) {
  color: rgb(var(--color-primary-600));
}

:global(.dark) .html-content :deep(a) {
  color: rgb(var(--color-primary-400));
}

:global(.dark) .html-content :deep(a:hover) {
  color: rgb(var(--color-primary-500));
}
</style>
