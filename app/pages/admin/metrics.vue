<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

definePageMeta({
  middleware: 'admin'
})

useSeoMeta({
  title: 'Business Metrics',
  description: 'Business intelligence dashboard for Mortality Watch'
})

interface MetricsData {
  users: {
    total: number
    free: number
    pro: number
    recentSignups: number
  }
  registrations: Array<{
    date: string
    count: number
  }>
  revenue: {
    mrr: number
    arr: number
    activeSubscriptions: number
    monthlySubscribers: number
    yearlySubscribers: number
  }
  conversion: {
    rate: number
    totalFreeUsers: number
    totalProUsers: number
  }
  churn: {
    rate: number
    churnedCount: number
    totalActiveSubscriptions: number
  }
  features: {
    totalCharts: number
    publicCharts: number
    featuredCharts: number
    recentCharts: number
    totalViews: number
    topCharts: Array<{
      id: number
      name: string
      views: number
      isPublic: boolean
      isFeatured: boolean
    }>
  }
  growth: Array<{
    date: Date
    free: number
    pro: number
    total: number
  }>
}

const loading = ref(true)
const error = ref<string | null>(null)
const metrics = ref<MetricsData | null>(null)

// Fetch metrics data
async function fetchMetrics() {
  try {
    loading.value = true
    error.value = null

    const response = await $fetch<{ success: boolean, data: MetricsData }>('/api/metrics/dashboard')

    if (response.success) {
      metrics.value = response.data
    } else {
      error.value = 'Failed to load metrics'
    }
  } catch (err) {
    console.error('Error fetching metrics:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load metrics'
  } finally {
    loading.value = false
  }
}

// Fetch on mount
onMounted(() => {
  fetchMetrics()
})

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Format percentage
function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

// Chart data for registrations
const registrationsChartData = computed(() => {
  if (!metrics.value) return null

  return {
    labels: metrics.value.registrations.map(r => r.date),
    datasets: [
      {
        label: 'Daily Signups',
        data: metrics.value.registrations.map(r => r.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }
})

// Chart data for user growth
const growthChartData = computed(() => {
  if (!metrics.value) return null

  return {
    labels: metrics.value.growth.map(g => new Date(g.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Total Users',
        data: metrics.value.growth.map(g => g.total),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Pro Users',
        data: metrics.value.growth.map(g => g.pro),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Free Users',
        data: metrics.value.growth.map(g => g.free),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }
})

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0
      }
    }
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold mb-2">
          Business Metrics
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Track KPIs, conversions, and revenue
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        :loading="loading"
        @click="fetchMetrics"
      >
        Refresh
      </UButton>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading && !metrics"
      class="flex items-center justify-center py-12"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-primary-500"
      />
    </div>

    <!-- Error State -->
    <UCard
      v-else-if="error"
      class="mb-8"
    >
      <div class="flex items-center gap-3 text-red-600 dark:text-red-400">
        <UIcon
          name="i-lucide-alert-circle"
          class="w-5 h-5"
        />
        <span>{{ error }}</span>
      </div>
    </UCard>

    <!-- Metrics Dashboard -->
    <div v-else-if="metrics">
      <!-- Key Metrics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- Total Users -->
        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-lg bg-primary-100 dark:bg-primary-900">
              <UIcon
                name="i-lucide-users"
                class="w-6 h-6 text-primary-600 dark:text-primary-400"
              />
            </div>
            <div>
              <p class="text-2xl font-bold">
                {{ metrics.users.total }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Total Users
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ metrics.users.recentSignups }} last 7 days
              </p>
            </div>
          </div>
        </UCard>

        <!-- MRR -->
        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-lg bg-success-100 dark:bg-success-900">
              <UIcon
                name="i-lucide-dollar-sign"
                class="w-6 h-6 text-success-600 dark:text-success-400"
              />
            </div>
            <div>
              <p class="text-2xl font-bold">
                {{ formatCurrency(metrics.revenue.mrr) }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                MRR
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ metrics.revenue.activeSubscriptions }} active
              </p>
            </div>
          </div>
        </UCard>

        <!-- Conversion Rate -->
        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-lg bg-warning-100 dark:bg-warning-900">
              <UIcon
                name="i-lucide-trending-up"
                class="w-6 h-6 text-warning-600 dark:text-warning-400"
              />
            </div>
            <div>
              <p class="text-2xl font-bold">
                {{ formatPercentage(metrics.conversion.rate) }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Free → Pro
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ metrics.users.pro }} / {{ metrics.users.total }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Churn Rate -->
        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-lg bg-error-100 dark:bg-error-900">
              <UIcon
                name="i-lucide-trending-down"
                class="w-6 h-6 text-error-600 dark:text-error-400"
              />
            </div>
            <div>
              <p class="text-2xl font-bold">
                {{ formatPercentage(metrics.churn.rate) }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Churn Rate
              </p>
              <p class="text-xs text-gray-500 mt-1">
                {{ metrics.churn.churnedCount }} canceling
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- User Growth Chart -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">
              User Growth
            </h2>
          </template>
          <div style="height: 300px">
            <Line
              v-if="growthChartData"
              :data="growthChartData"
              :options="chartOptions"
            />
          </div>
        </UCard>

        <!-- Daily Registrations Chart -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">
              Daily Registrations (Last 30 Days)
            </h2>
          </template>
          <div style="height: 300px">
            <Line
              v-if="registrationsChartData"
              :data="registrationsChartData"
              :options="chartOptions"
            />
          </div>
        </UCard>
      </div>

      <!-- Revenue & Conversion Details -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Revenue Breakdown -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">
              Revenue Breakdown
            </h2>
          </template>

          <div class="space-y-4">
            <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400">Monthly Recurring Revenue (MRR)</span>
              <span class="font-bold text-lg">{{ formatCurrency(metrics.revenue.mrr) }}</span>
            </div>
            <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400">Annual Recurring Revenue (ARR)</span>
              <span class="font-bold text-lg">{{ formatCurrency(metrics.revenue.arr) }}</span>
            </div>
            <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400">Monthly Subscribers</span>
              <span class="font-medium">{{ metrics.revenue.monthlySubscribers }}</span>
            </div>
            <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400">Yearly Subscribers</span>
              <span class="font-medium">{{ metrics.revenue.yearlySubscribers }}</span>
            </div>
            <div class="flex justify-between items-center py-3">
              <span class="text-gray-600 dark:text-gray-400">Total Active Subscriptions</span>
              <span class="font-medium">{{ metrics.revenue.activeSubscriptions }}</span>
            </div>
          </div>
        </UCard>

        <!-- User Breakdown -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">
              User Breakdown
            </h2>
          </template>

          <div class="space-y-4">
            <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400">Total Users</span>
              <span class="font-bold text-lg">{{ metrics.users.total }}</span>
            </div>
            <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400">Free Tier Users</span>
              <span class="font-medium">{{ metrics.users.free }}</span>
            </div>
            <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400">Pro Tier Users</span>
              <span class="font-medium">{{ metrics.users.pro }}</span>
            </div>
            <div class="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700">
              <span class="text-gray-600 dark:text-gray-400">Conversion Rate</span>
              <span class="font-medium">{{ formatPercentage(metrics.conversion.rate) }}</span>
            </div>
            <div class="flex justify-between items-center py-3">
              <span class="text-gray-600 dark:text-gray-400">Recent Signups (7 days)</span>
              <span class="font-medium">{{ metrics.users.recentSignups }}</span>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Feature Usage -->
      <UCard class="mb-8">
        <template #header>
          <h2 class="text-xl font-semibold">
            Feature Usage
          </h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p class="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {{ metrics.features.totalCharts }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total Charts
            </p>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p class="text-3xl font-bold text-success-600 dark:text-success-400">
              {{ metrics.features.publicCharts }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Public Charts
            </p>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p class="text-3xl font-bold text-warning-600 dark:text-warning-400">
              {{ metrics.features.featuredCharts }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Featured Charts
            </p>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p class="text-3xl font-bold text-info-600 dark:text-info-400">
              {{ metrics.features.recentCharts }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Last 30 Days
            </p>
          </div>
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {{ metrics.features.totalViews }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total Views
            </p>
          </div>
        </div>

        <!-- Top Charts Table -->
        <div>
          <h3 class="text-lg font-medium mb-3">
            Top Charts by Views
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    Chart Name
                  </th>
                  <th class="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    Views
                  </th>
                  <th class="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="chart in metrics.features.topCharts"
                  :key="chart.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td class="px-4 py-3 text-sm">
                    {{ chart.name }}
                  </td>
                  <td class="px-4 py-3 text-sm font-medium">
                    {{ chart.views }}
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <div class="flex gap-2">
                      <span
                        v-if="chart.isFeatured"
                        class="inline-flex items-center px-2 py-1 rounded text-xs bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300"
                      >
                        Featured
                      </span>
                      <span
                        v-if="chart.isPublic"
                        class="inline-flex items-center px-2 py-1 rounded text-xs bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300"
                      >
                        Public
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </UCard>

      <!-- Conversion Funnel -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">
            Conversion Funnel
          </h2>
        </template>

        <div class="space-y-4">
          <!-- Free Users -->
          <div>
            <div class="flex justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Free Users</span>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ metrics.users.free }}</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8">
              <div
                class="bg-success-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                :style="{ width: '100%' }"
              >
                100%
              </div>
            </div>
          </div>

          <!-- Arrow -->
          <div class="flex justify-center">
            <UIcon
              name="i-lucide-arrow-down"
              class="w-6 h-6 text-gray-400"
            />
          </div>

          <!-- Pro Users -->
          <div>
            <div class="flex justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Pro Users (Converted)</span>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ metrics.users.pro }}</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8">
              <div
                class="bg-warning-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                :style="{ width: `${Math.min(metrics.conversion.rate, 100)}%` }"
              >
                {{ formatPercentage(metrics.conversion.rate) }}
              </div>
            </div>
          </div>

          <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              <strong>Conversion Rate:</strong> {{ formatPercentage(metrics.conversion.rate) }} of users upgrade to Pro tier
            </p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
