<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

useSeoMeta({
  title: 'Invite Codes - Admin',
  description: 'Manage invite codes for beta access'
})

interface InviteCode {
  id: number
  code: string
  createdBy: number | null
  maxUses: number
  currentUses: number
  expiresAt: Date | null
  grantsProUntil: Date | null
  notes: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const toast = useToast()
const codes = ref<InviteCode[]>([])
const loading = ref(true)
const creating = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingCode = ref<InviteCode | null>(null)

// Form states
const newCode = ref({
  code: '',
  maxUses: 1,
  expiresAt: '',
  grantsProMonths: 6,
  notes: ''
})

const editForm = ref({
  isActive: true,
  maxUses: 1
})

// Clear editingCode when modal closes
watch(showEditModal, (isOpen) => {
  if (!isOpen) {
    editingCode.value = null
  }
})

// Load invite codes
async function loadInviteCodes() {
  loading.value = true
  try {
    const response = await $fetch<{ success: boolean, inviteCodes: InviteCode[], total: number }>('/api/admin/invite-codes')
    codes.value = response.inviteCodes
  } catch (error: unknown) {
    toast.add({
      title: 'Error',
      description: (error as { data?: { message?: string } }).data?.message || 'Failed to load invite codes',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Display all codes (no filtering)
const filteredCodes = computed(() => codes.value)

// Create new invite code
async function createInviteCode() {
  if (!newCode.value.code.trim()) {
    toast.add({
      title: 'Error',
      description: 'Code is required',
      color: 'error'
    })
    return
  }

  creating.value = true
  try {
    const response = await $fetch<{ success: boolean, inviteCode: InviteCode }>('/api/admin/invite-codes', {
      method: 'POST',
      body: {
        code: newCode.value.code.trim().toUpperCase(),
        maxUses: newCode.value.maxUses,
        grantsProMonths: newCode.value.grantsProMonths
      }
    })

    codes.value.unshift(response.inviteCode)
    toast.add({
      title: 'Success',
      description: 'Invite code created successfully',
      color: 'success'
    })

    // Reset form and close modal
    newCode.value = {
      code: '',
      maxUses: 1,
      expiresAt: '',
      grantsProMonths: 6,
      notes: ''
    }
    showCreateModal.value = false
  } catch (error: unknown) {
    toast.add({
      title: 'Error',
      description: (error as { data?: { message?: string } }).data?.message || 'Failed to create invite code',
      color: 'error'
    })
  } finally {
    creating.value = false
  }
}

// Update invite code
async function updateInviteCode() {
  if (!editingCode.value) return

  try {
    const response = await $fetch<{ success: boolean, inviteCode: InviteCode }>(`/api/admin/invite-codes/${editingCode.value.id}`, {
      method: 'PATCH',
      body: {
        isActive: editForm.value.isActive,
        maxUses: editForm.value.maxUses
      }
    })

    // Update local state
    const index = codes.value.findIndex(c => c.id === editingCode.value!.id)
    if (index !== -1) {
      codes.value[index] = response.inviteCode
    }

    toast.add({
      title: 'Success',
      description: 'Invite code updated successfully',
      color: 'success'
    })

    showEditModal.value = false
    editingCode.value = null
  } catch (error: unknown) {
    toast.add({
      title: 'Error',
      description: (error as { data?: { message?: string } }).data?.message || 'Failed to update invite code',
      color: 'error'
    })
  }
}

// Deactivate invite code
async function deactivateCode(code: InviteCode) {
  if (!confirm(`Are you sure you want to deactivate the code "${code.code}"?`)) {
    return
  }

  try {
    await $fetch(`/api/admin/invite-codes/${code.id}`, {
      method: 'DELETE'
    })

    // Update local state
    const index = codes.value.findIndex(c => c.id === code.id)
    if (index !== -1 && codes.value[index]) {
      codes.value[index]!.isActive = false
    }

    toast.add({
      title: 'Success',
      description: 'Invite code deactivated',
      color: 'success'
    })
  } catch (error: unknown) {
    toast.add({
      title: 'Error',
      description: (error as { data?: { message?: string } }).data?.message || 'Failed to deactivate code',
      color: 'error'
    })
  }
}

// Open edit modal
function openEditModal(code: InviteCode) {
  editingCode.value = code
  editForm.value = {
    isActive: code.isActive,
    maxUses: code.maxUses
  }
  showEditModal.value = true
}

// Generate random code
function generateRandomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude similar chars
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  newCode.value.code = `${part1}-${part2}`
}

// Copy code to clipboard
async function copyCode(code: string) {
  try {
    // Always use current domain to avoid staging/prod URL mismatches
    const siteUrl = window.location.origin
    await navigator.clipboard.writeText(`${siteUrl}/signup?code=${code}`)
    toast.add({
      title: 'Copied!',
      description: 'Signup link copied to clipboard',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Error',
      description: 'Failed to copy to clipboard',
      color: 'error'
    })
  }
}

// Format date
function formatDate(date: Date | null) {
  if (!date) return 'Never'
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Compute code status
function getCodeStatus(code: InviteCode) {
  if (!code.isActive) return 'Inactive'
  if (code.currentUses >= code.maxUses) return 'Full'
  if (code.expiresAt && new Date(code.expiresAt) < new Date()) return 'Expired'
  return 'Active'
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Active': return 'success'
    case 'Full': return 'warning'
    case 'Expired': return 'error'
    case 'Inactive': return 'gray'
    default: return 'gray'
  }
}

onMounted(() => {
  loadInviteCodes()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold mb-2">
          Invite Codes
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Manage invite codes for beta access and promotions
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        @click="showCreateModal = true"
      >
        Create Code
      </UButton>
    </div>

    <!-- Codes List -->
    <UCard v-if="loading">
      <div class="py-12 text-center">
        <LoadingSpinner class="mx-auto mb-2" />
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Loading invite codes...
        </p>
      </div>
    </UCard>

    <UCard v-else-if="filteredCodes.length === 0">
      <div class="py-12 text-center">
        <UIcon
          name="i-lucide-inbox"
          class="w-12 h-12 mx-auto mb-4 text-gray-400"
        />
        <p class="text-gray-600 dark:text-gray-400">
          No invite codes yet
        </p>
      </div>
    </UCard>

    <div
      v-else
      class="space-y-4"
    >
      <UCard
        v-for="code in filteredCodes"
        :key="code.id"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1 space-y-3">
            <!-- Code -->
            <div class="flex items-center gap-3">
              <code class="font-mono text-lg font-semibold">{{ code.code }}</code>
              <UBadge
                :color="getStatusColor(getCodeStatus(code))"
                variant="subtle"
              >
                {{ getCodeStatus(code) }}
              </UBadge>
            </div>

            <!-- Details -->
            <div class="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span class="font-medium">Uses:</span> {{ code.currentUses }} / {{ code.maxUses }}
              </div>
              <div>
                <span class="font-medium">Pro Until:</span> {{ formatDate(code.grantsProUntil) }}
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-copy"
              size="sm"
              variant="ghost"
              color="neutral"
              @click="copyCode(code.code)"
            >
              Copy Link
            </UButton>
            <UButton
              icon="i-lucide-pencil"
              size="sm"
              variant="ghost"
              color="neutral"
              @click="openEditModal(code)"
            >
              Edit
            </UButton>
            <UButton
              v-if="code.isActive"
              icon="i-lucide-x"
              size="sm"
              variant="ghost"
              color="error"
              @click="deactivateCode(code)"
            >
              Deactivate
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Create Modal -->
    <UModal
      v-model:open="showCreateModal"
      title="Create Invite Code"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField
            label="Code"
            required
          >
            <div class="flex gap-2">
              <UInput
                v-model="newCode.code"
                placeholder="e.g., BETA-2025"
                class="flex-1"
              />
              <UButton
                icon="i-lucide-shuffle"
                variant="ghost"
                @click="generateRandomCode"
              >
                Generate
              </UButton>
            </div>
          </UFormField>

          <UFormField
            label="Max Uses"
            required
          >
            <UInput
              v-model.number="newCode.maxUses"
              type="number"
              min="1"
            />
          </UFormField>

          <UFormField
            label="Pro Access Duration"
            help="How long users get Pro access (in months)"
          >
            <UInput
              v-model.number="newCode.grantsProMonths"
              type="number"
              min="1"
              max="24"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="showCreateModal = false"
          >
            Cancel
          </UButton>
          <UButton
            :loading="creating"
            @click="createInviteCode"
          >
            Create Code
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Edit Modal -->
    <UModal
      v-model:open="showEditModal"
      title="Edit Invite Code"
    >
      <template #body>
        <div
          v-if="editingCode"
          class="space-y-4"
        >
          <div class="p-3 bg-gray-100 dark:bg-gray-800 rounded">
            <code class="font-mono text-sm font-semibold">{{ editingCode.code }}</code>
          </div>

          <UFormField label="Status">
            <UCheckbox
              v-model="editForm.isActive"
              label="Active"
            />
          </UFormField>

          <UFormField label="Max Uses">
            <UInput
              v-model.number="editForm.maxUses"
              type="number"
              min="1"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="showEditModal = false"
          >
            Cancel
          </UButton>
          <UButton @click="updateInviteCode">
            Save Changes
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
