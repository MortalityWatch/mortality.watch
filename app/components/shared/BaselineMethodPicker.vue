<script setup lang="ts">
import { computed } from 'vue'
import { baselineMethods } from '@/model'
import FeatureBadge from '@/components/FeatureBadge.vue'

const props = defineProps<{
  modelValue: { name: string, value: string, label: string, disabled?: boolean }
  isUpdating?: boolean
  items?: Array<{ name: string, value: string, label?: string, disabled?: boolean }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { name: string, value: string, label: string, disabled?: boolean }]
}>()

// Feature access for tier-based features
const { can } = useFeatureAccess()

// Feature gate: Show all baseline methods but disable advanced ones for non-registered users
const baselineMethodsWithLabels = computed(() => {
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
      disabled: disabled ?? false
    }
  })
})

const selectedValue = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <label class="text-sm font-medium whitespace-nowrap">
        Method
      </label>
      <UInputMenu
        v-model="selectedValue"
        :items="baselineMethodsWithLabels"
        placeholder="Select Baseline Method"
        :disabled="props.isUpdating"
        size="sm"
        class="flex-1"
      />
      <UPopover>
        <UButton
          icon="i-lucide-info"
          color="neutral"
          variant="ghost"
          size="xs"
          aria-label="Baseline method information"
        />
        <template #content>
          <div class="p-3 space-y-2 max-w-xs">
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
          </div>
        </template>
      </UPopover>
    </div>

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
