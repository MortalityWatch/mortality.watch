<script setup lang="ts">
import type { User } from '#db/schema'
import { formatChartDate } from '@/lib/utils/dates'

type AuthUser = Omit<User, 'passwordHash'>

defineProps<{
  user: AuthUser
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold">
            Account Information
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View your account details
          </p>
        </div>
        <TierBadge
          :tier="user.tier"
          size="lg"
        />
      </div>
    </template>

    <div class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Email Address
        </label>
        <div class="flex items-center gap-2">
          <p class="text-base text-gray-900 dark:text-gray-100">
            {{ user.email }}
          </p>
          <UBadge
            :color="user.emailVerified ? 'success' : 'warning'"
            variant="subtle"
            size="xs"
          >
            {{ user.emailVerified ? 'Verified' : 'Not Verified' }}
          </UBadge>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Account Type
        </label>
        <p class="text-base text-gray-900 dark:text-gray-100">
          {{ user.role === 'admin' ? 'Administrator' : 'User' }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Member Since
        </label>
        <p class="text-base text-gray-900 dark:text-gray-100">
          {{ formatChartDate(user.createdAt, 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
        </p>
      </div>
    </div>
  </UCard>
</template>
