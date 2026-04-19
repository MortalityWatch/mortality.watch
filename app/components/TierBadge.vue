<script setup lang="ts">
/**
 * Reusable tier badge component
 * Displays user tier with consistent styling across the app
 */
const props = withDefaults(defineProps<{
  tier: 0 | 1 | 2
  size?: 'xs' | 'sm' | 'md' | 'lg'
}>(), {
  size: 'md'
})

const badgeClasses = computed(() => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium'

  // Size classes
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-sm'
  }

  // Tier-specific color classes (tier 2 is treated the same as tier 1
  // since payments were disabled and Pro collapsed into Registered)
  const colorClasses = {
    2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    1: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    0: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }

  return `${baseClasses} ${sizeClasses[props.size]} ${colorClasses[props.tier]}`
})

const tierLabels: Record<number, string> = {
  2: 'Free',
  1: 'Free',
  0: 'Public'
}

const tierLabel = computed(() => tierLabels[props.tier] ?? 'Free')
</script>

<template>
  <span :class="badgeClasses">
    {{ tierLabel }}
  </span>
</template>
