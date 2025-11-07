<script setup lang="ts">
import { computed } from 'vue'
import { baselineMethods } from '@/model'
import FeatureBadge from '@/components/FeatureBadge.vue'

interface BaselineMethodItem {
  name: string
  value: string
  label: string
  disabled?: boolean
}

const props = defineProps<{
  modelValue: BaselineMethodItem
  isUpdating?: boolean
  items?: Array<{ name: string, value: string, label?: string, disabled?: boolean }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BaselineMethodItem]
}>()

// Feature access for tier-based features
const { can } = useFeatureAccess()

// Feature gate: Show all baseline methods but disable advanced ones for non-registered users
const baselineMethodsWithLabels = computed((): Array<{ name: string, value: string, label: string, disabled: boolean }> => {
  const hasAccess = can('ALL_BASELINES')
  const methods = props.items || baselineMethods
  return methods.map((t) => {
    const isBasicMethod = t.value === 'naive' || t.value === 'mean' || t.value === 'median'
    const disabled = !hasAccess && !isBasicMethod
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const label = (t as any).label || t.name
    return {
      name: t.name,
      value: t.value,
      label,
      disabled: Boolean(disabled)
    }
  })
})

const selectedValue = computed({
  get: () => ({
    ...props.modelValue,
    disabled: Boolean(props.modelValue.disabled)
  }),
  set: (v: { name: string, value: string, label: string, disabled: boolean }) => {
    emit('update:modelValue', {
      name: v.name,
      value: v.value,
      label: v.label,
      disabled: v.disabled
    })
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiControlRow label="Method">
      <UInputMenu
        v-model="selectedValue"
        :items="baselineMethodsWithLabels"
        placeholder="Select Baseline Method"
        :disabled="props.isUpdating"
        size="sm"
        class="flex-1"
      />
      <template #help>
        <div class="text-xs text-gray-700 dark:text-gray-300 space-y-1">
          <div><strong>Last Value:</strong> Uses the final value from baseline period</div>
          <div><strong>Average:</strong> Mean of baseline period</div>
          <div><strong>Median:</strong> Median of baseline period</div>
          <div>
            <strong>Linear Regression:</strong> Linear trend projection
            <FeatureBadge
              feature="ALL_BASELINES"
              class="ml-1"
            />
          </div>
          <div>
            <strong>Exponential Smoothing (ETS):</strong> Adaptive trend and seasonality
            <FeatureBadge
              feature="ALL_BASELINES"
              class="ml-1"
            />
          </div>
        </div>
      </template>
    </UiControlRow>

    <!-- Feature upgrade hint for baseline methods -->
    <div
      v-if="!can('ALL_BASELINES')"
      class="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
    >
      <p class="text-xs text-blue-700 dark:text-blue-300">
        <UIcon
          name="i-heroicons-information-circle"
          class="inline-block mr-1 size-3"
        />
        Register for free to unlock advanced baseline methods.
      </p>
    </div>
  </div>
</template>
