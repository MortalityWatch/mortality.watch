<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

useSeoMeta({
  title: 'Admin Dashboard',
  description: 'Mortality Watch administration'
})

const { user } = useAuth()

// Fetch real stats from API
const { data: statsData } = await useFetch<{
  totalUsers: number
  signupsToday: number
  proSubscribers: number
  savedCharts: number
}>('/api/admin/stats')

const stats = computed(() => [
  {
    label: 'Total Users',
    value: String(statsData.value?.totalUsers || 0),
    icon: 'i-lucide-users',
    color: 'primary' as const
  },
  {
    label: 'Signups Today',
    value: String(statsData.value?.signupsToday || 0),
    icon: 'i-lucide-user-plus',
    color: 'success' as const
  },
  {
    label: 'Pro Subscribers',
    value: String(statsData.value?.proSubscribers || 0),
    icon: 'i-lucide-crown',
    color: 'warning' as const
  },
  {
    label: 'Saved Charts',
    value: String(statsData.value?.savedCharts || 0),
    icon: 'i-lucide-bar-chart',
    color: 'info' as const
  }
])

const quickActions = [
  {
    label: 'Invite Codes',
    icon: 'i-lucide-ticket',
    to: '/admin/invite-codes',
    description: 'Manage invite codes and beta access'
  },
  {
    label: 'Featured Charts',
    icon: 'i-lucide-star',
    to: '/admin/featured-charts',
    description: 'Manage featured charts'
  },
  {
    label: 'Data Quality',
    icon: 'i-lucide-activity',
    to: '/admin/data-quality',
    description: 'Monitor data freshness and quality'
  }
]
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">
        Admin Dashboard
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Welcome back, {{ user?.name || user?.email }}
      </p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <UCard
        v-for="stat in stats"
        :key="stat.label"
      >
        <div class="flex items-center gap-4">
          <div :class="`p-3 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900`">
            <UIcon
              :name="stat.icon"
              :class="`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`"
            />
          </div>
          <div>
            <p class="text-2xl font-bold">
              {{ stat.value }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ stat.label }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Quick Actions -->
    <UCard>
      <template #header>
        <h2 class="text-xl font-semibold">
          Quick Actions
        </h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UCard
          v-for="action in quickActions"
          :key="action.label"
          class="cursor-pointer hover:shadow-md transition-shadow"
          @click="navigateTo(action.to)"
        >
          <div class="flex items-start gap-3">
            <UIcon
              :name="action.icon"
              class="w-6 h-6 text-primary-500 mt-0.5"
            />
            <div>
              <h3 class="font-medium text-lg mb-1">
                {{ action.label }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ action.description }}
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </UCard>

    <!-- System Info -->
    <UCard class="mt-8">
      <template #header>
        <h2 class="text-xl font-semibold">
          System Information
        </h2>
      </template>

      <div class="space-y-3">
        <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
          <span class="text-gray-600 dark:text-gray-400">Database</span>
          <span class="font-medium">SQLite (Drizzle ORM)</span>
        </div>
        <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
          <span class="text-gray-600 dark:text-gray-400">Auth Method</span>
          <span class="font-medium">JWT (httpOnly cookies)</span>
        </div>
        <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
          <span class="text-gray-600 dark:text-gray-400">Environment</span>
          <span class="font-medium">{{ $config.public.nodeEnv || 'development' }}</span>
        </div>
      </div>
    </UCard>
  </div>
</template>
