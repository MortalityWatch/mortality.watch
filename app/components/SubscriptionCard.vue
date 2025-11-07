<script setup lang="ts">
import { handleError } from '@/lib/errors/errorHandler'
import { formatChartDate } from '@/lib/utils/dates'

const { getSubscriptionStatus, manageSubscription, subscribe } = useStripe()

interface SubscriptionStatus {
  hasSubscription: boolean
  subscription: {
    id: number
    status: string
    plan: 'monthly' | 'yearly' | null
    isActive: boolean
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    daysRemaining: number | null
    cancelAtPeriodEnd: boolean
    canceledAt: string | null
    trialEnd: string | null
  } | null
  tier: number
}

const subscriptionStatus = ref<SubscriptionStatus | null>(null)
const loading = ref(true)
const subscribing = ref(false)
const managingSubscription = ref(false)

const statusBadgeColor = computed(() => {
  if (!subscriptionStatus.value?.subscription) return 'neutral'

  const subscription = subscriptionStatus.value.subscription

  // If subscription is being canceled at period end, show warning
  if (subscription.cancelAtPeriodEnd && subscription.status === 'active') {
    return 'warning'
  }

  switch (subscription.status) {
    case 'active':
      return 'success'
    case 'trialing':
      return 'info'
    case 'past_due':
    case 'unpaid':
      return 'warning'
    case 'canceled':
    case 'inactive':
      return 'error'
    default:
      return 'neutral'
  }
})

const statusLabel = computed(() => {
  if (!subscriptionStatus.value?.subscription) return 'No Subscription'

  const subscription = subscriptionStatus.value.subscription

  // If subscription is being canceled at period end, show special label
  if (subscription.cancelAtPeriodEnd && subscription.status === 'active') {
    return 'Canceling'
  }

  const status = subscription.status
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
})

const planLabel = computed(() => {
  if (!subscriptionStatus.value?.subscription?.plan) return null

  return subscriptionStatus.value.subscription.plan === 'monthly'
    ? 'Monthly ($9.99/mo)'
    : 'Annual ($99/yr)'
})

async function loadSubscriptionStatus() {
  loading.value = true
  try {
    subscriptionStatus.value = await getSubscriptionStatus()
  } catch (error) {
    handleError(error, 'Failed to load subscription status', 'loadSubscriptionStatus')
  } finally {
    loading.value = false
  }
}

async function handleManageSubscription() {
  managingSubscription.value = true
  try {
    await manageSubscription()
  } catch (error) {
    handleError(error, 'Failed to open subscription management', 'manageSubscription')
    managingSubscription.value = false
  }
}

async function handleSubscribe(plan: 'monthly' | 'yearly') {
  subscribing.value = true
  try {
    await subscribe(plan)
  } catch (error) {
    handleError(error, 'Failed to start subscription checkout', 'subscribe')
    subscribing.value = false
  }
}

onMounted(() => {
  loadSubscriptionStatus()
})

// Reload subscription when returning from Stripe portal
onActivated(() => {
  loadSubscriptionStatus()
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold">
            Subscription
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your subscription and billing
          </p>
        </div>
        <UBadge
          v-if="!loading && subscriptionStatus"
          :color="statusBadgeColor"
          variant="subtle"
          size="lg"
        >
          {{ statusLabel }}
        </UBadge>
      </div>
    </template>

    <div
      v-if="loading"
      class="py-8 text-center"
    >
      <LoadingSpinner class="mx-auto mb-2" />
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Loading subscription...
      </p>
    </div>

    <div
      v-else-if="subscriptionStatus"
      class="space-y-6"
    >
      <!-- Active Subscription -->
      <div v-if="subscriptionStatus.hasSubscription && subscriptionStatus.subscription">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Current Plan
            </label>
            <p class="text-base text-gray-900 dark:text-gray-100">
              {{ planLabel || 'Pro' }}
            </p>
          </div>

          <div v-if="subscriptionStatus.subscription.currentPeriodEnd">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {{ subscriptionStatus.subscription.cancelAtPeriodEnd ? 'Active Until' : 'Renews On' }}
            </label>
            <p class="text-base text-gray-900 dark:text-gray-100">
              {{ formatChartDate(subscriptionStatus.subscription.currentPeriodEnd, 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
            </p>
            <p
              v-if="subscriptionStatus.subscription.daysRemaining !== null"
              class="text-xs text-gray-500 dark:text-gray-400 mt-1"
            >
              {{ subscriptionStatus.subscription.daysRemaining }} days remaining
            </p>
          </div>

          <div
            v-if="subscriptionStatus.subscription.cancelAtPeriodEnd"
            class="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-md border border-yellow-200 dark:border-yellow-800"
          >
            <div class="flex items-start gap-2">
              <UIcon
                name="i-lucide-info"
                class="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0"
              />
              <p class="text-sm text-yellow-800 dark:text-yellow-200">
                Your subscription will be canceled at the end of the current billing period.
              </p>
            </div>
          </div>

          <div
            v-if="subscriptionStatus.subscription.status === 'past_due' || subscriptionStatus.subscription.status === 'unpaid'"
            class="p-3 bg-red-50 dark:bg-red-900/10 rounded-md border border-red-200 dark:border-red-800"
          >
            <div class="flex items-start gap-2">
              <UIcon
                name="i-lucide-alert-triangle"
                class="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0"
              />
              <p class="text-sm text-red-800 dark:text-red-200">
                Your payment is {{ subscriptionStatus.subscription.status === 'past_due' ? 'past due' : 'unpaid' }}. Please update your payment method.
              </p>
            </div>
          </div>

          <div class="flex gap-2 pt-2">
            <UButton
              :loading="managingSubscription"
              :disabled="managingSubscription"
              @click="handleManageSubscription"
            >
              Manage Subscription
            </UButton>
          </div>
        </div>
      </div>

      <!-- No Subscription -->
      <div
        v-else
        class="space-y-6"
      >
        <p class="text-gray-600 dark:text-gray-400">
          You don't have an active subscription. Upgrade to Pro to unlock all features.
        </p>

        <div class="grid gap-4 sm:grid-cols-2">
          <!-- Monthly Plan -->
          <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
            <div class="mb-3">
              <h3 class="text-lg font-semibold mb-1">
                Monthly
              </h3>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl font-bold">$9.99</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">/month</span>
              </div>
            </div>
            <ul class="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
              <li class="flex items-start gap-2">
                <UIcon
                  name="i-lucide-check"
                  class="w-4 h-4 text-success-500 mt-0.5 shrink-0"
                />
                <span>All Pro features</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon
                  name="i-lucide-check"
                  class="w-4 h-4 text-success-500 mt-0.5 shrink-0"
                />
                <span>Cancel anytime</span>
              </li>
            </ul>
            <UButton
              block
              :loading="subscribing"
              :disabled="subscribing"
              @click="handleSubscribe('monthly')"
            >
              Subscribe Monthly
            </UButton>
          </div>

          <!-- Annual Plan -->
          <div class="p-4 border-2 border-primary-500 dark:border-primary-400 rounded-lg relative">
            <UBadge
              color="primary"
              variant="solid"
              size="xs"
              class="absolute -top-2 right-4"
            >
              Save $20
            </UBadge>
            <div class="mb-3">
              <h3 class="text-lg font-semibold mb-1">
                Annual
              </h3>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl font-bold">$99</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">/year</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ($8.25/month)
              </p>
            </div>
            <ul class="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
              <li class="flex items-start gap-2">
                <UIcon
                  name="i-lucide-check"
                  class="w-4 h-4 text-success-500 mt-0.5 shrink-0"
                />
                <span>All Pro features</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon
                  name="i-lucide-check"
                  class="w-4 h-4 text-success-500 mt-0.5 shrink-0"
                />
                <span>2 months free</span>
              </li>
            </ul>
            <UButton
              block
              color="primary"
              :loading="subscribing"
              :disabled="subscribing"
              @click="handleSubscribe('yearly')"
            >
              Subscribe Annually
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
