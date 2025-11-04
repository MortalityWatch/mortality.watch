<script setup lang="ts">
import type { User } from '#db/schema'

type AuthUser = Omit<User, 'passwordHash'>

defineProps<{
  user: AuthUser
  loading: boolean
}>()

const emit = defineEmits<{
  'export-data': []
}>()

function handleExportData() {
  emit('export-data')
}
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h2 class="text-xl font-semibold">
          Data & Privacy
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your personal data and privacy
        </p>
      </div>
    </template>

    <div class="space-y-6">
      <div class="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
        <div class="flex items-start gap-3 mb-3">
          <UIcon
            name="i-lucide-download"
            class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0"
          />
          <div>
            <h3 class="text-base font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Export Your Data
            </h3>
            <div class="text-sm text-blue-800 dark:text-blue-300 space-y-2">
              <p>
                Download a copy of all your personal data in JSON format (GDPR Article 15).
              </p>
              <p>
                This includes your profile, saved charts, and subscription history.
              </p>
            </div>
          </div>
        </div>
        <UButton
          color="primary"
          variant="soft"
          icon="i-lucide-download"
          :loading="loading"
          :disabled="loading"
          @click="handleExportData"
        >
          Export My Data
        </UButton>
      </div>
    </div>
  </UCard>
</template>
