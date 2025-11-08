<script setup lang="ts">
const { user, refreshSession } = useAuth()
const toast = useToast()

const inviteCode = ref('')
const applying = ref(false)
const validating = ref(false)
const codeInfo = ref<{ valid: boolean; message?: string; grantsProUntil?: Date } | null>(null)

// Clear validation when user changes the code
watch(inviteCode, () => {
  codeInfo.value = null
})

async function validateCode() {
  if (!inviteCode.value.trim()) {
    codeInfo.value = null
    return
  }

  validating.value = true
  try {
    const result = await $fetch<{ valid: boolean; message?: string; grantsProUntil?: Date }>('/api/auth/validate-invite-code', {
      method: 'POST',
      body: { code: inviteCode.value.trim() }
    })
    codeInfo.value = result
  } catch (error) {
    codeInfo.value = { valid: false, message: 'Invalid invite code' }
  } finally {
    validating.value = false
  }
}

async function applyInviteCode() {
  if (!inviteCode.value.trim()) {
    toast.add({
      title: 'Error',
      description: 'Please enter an invite code',
      color: 'error'
    })
    return
  }

  applying.value = true
  try {
    const result = await $fetch<{ success: boolean; message: string }>('/api/user/apply-invite-code', {
      method: 'POST',
      body: { code: inviteCode.value.trim() }
    })

    if (result.success) {
      toast.add({
        title: 'Success!',
        description: result.message,
        color: 'success'
      })

      // Refresh user session to get updated tier
      await refreshSession()

      // Clear the form
      inviteCode.value = ''
      codeInfo.value = null
    }
  } catch (error: any) {
    const errorMessage = error.data?.message || error.message || 'Failed to apply invite code'
    toast.add({
      title: 'Error',
      description: errorMessage,
      color: 'error'
    })
  } finally {
    applying.value = false
  }
}

// Show this component only if user is not already Pro (tier < 2)
const showInviteCodeCard = computed(() => {
  return user.value && user.value.tier < 2
})
</script>

<template>
  <UCard v-if="showInviteCodeCard">
    <template #header>
      <div>
        <h2 class="text-xl font-semibold">
          Have an Invite Code?
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upgrade to Pro with an invite code
        </p>
      </div>
    </template>

    <div class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        If you have an invite code for beta access or a promotion, enter it below to unlock Pro features.
      </p>

      <div class="space-y-3">
        <UFormField
          label="Invite Code"
          help="Enter the code exactly as provided"
        >
          <UInput
            v-model="inviteCode"
            placeholder="e.g., BETA-2025"
            size="lg"
            :disabled="applying"
            @blur="validateCode"
            @keydown.enter="applyInviteCode"
          />
        </UFormField>

        <!-- Validation feedback -->
        <UAlert
          v-if="codeInfo?.valid"
          color="success"
          variant="soft"
          :title="codeInfo.message || 'Valid code'"
          icon="i-lucide-check-circle"
        />

        <UAlert
          v-else-if="codeInfo && !codeInfo.valid"
          color="warning"
          variant="soft"
          :title="codeInfo.message || 'Invalid code'"
          icon="i-lucide-alert-triangle"
        />

        <div class="flex gap-2">
          <UButton
            :loading="applying || validating"
            :disabled="applying || validating || !inviteCode.trim() || (codeInfo !== null && !codeInfo.valid)"
            @click="applyInviteCode"
          >
            Apply Code
          </UButton>

          <UButton
            v-if="inviteCode"
            variant="ghost"
            color="gray"
            :disabled="applying || validating"
            @click="inviteCode = ''; codeInfo = null"
          >
            Clear
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>
