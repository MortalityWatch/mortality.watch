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
  maxUses: 1,
  notes: ''
})

// Filters
const activeFilter = ref<'all' | 'active' | 'inactive'>('all')
const searchQuery = ref('')

// Load invite codes
async function loadInviteCodes() {
  loading.value = true
  try {
    const response = await $fetch<{ success: boolean; inviteCodes: InviteCode[]; total: number }>('/api/admin/invite-codes')
    codes.value = response.inviteCodes
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to load invite codes',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Filtered codes
const filteredCodes = computed(() => {
  let filtered = codes.value

  // Active filter
  if (activeFilter.value === 'active') {
    filtered = filtered.filter(code => code.isActive)
  } else if (activeFilter.value === 'inactive') {
    filtered = filtered.filter(code => !code.isActive)
  }

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(code =>
      code.code.toLowerCase().includes(query) ||
      code.notes?.toLowerCase().includes(query)
    )
  }

  return filtered
})

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
    const response = await $fetch<{ success: boolean; inviteCode: InviteCode }>('/api/admin/invite-codes', {
      method: 'POST',
      body: {
        code: newCode.value.code.trim().toUpperCase(),
        maxUses: newCode.value.maxUses,
        grantsProMonths: newCode.value.grantsProMonths,
        notes: newCode.value.notes || undefined
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
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to create invite code',
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
    const response = await $fetch<{ success: boolean; inviteCode: InviteCode }>(`/api/admin/invite-codes/${editingCode.value.id}`, {
      method: 'PATCH',
      body: {
        isActive: editForm.value.isActive,
        maxUses: editForm.value.maxUses,
        notes: editForm.value.notes || undefined
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
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to update invite code',
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
    if (index !== -1) {
      codes.value[index].isActive = false
    }

    toast.add({
      title: 'Success',
      description: 'Invite code deactivated',
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to deactivate code',
      color: 'error'
    })
  }
}

// Open edit modal
function openEditModal(code: InviteCode) {
  editingCode.value = code
  editForm.value = {
    isActive: code.isActive,
    maxUses: code.maxUses,
    notes: code.notes || ''
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
    await navigator.clipboard.writeText(`https://mortality.watch/signup?code=${code}`)
    toast.add({
      title: 'Copied!',
      description: 'Signup link copied to clipboard',
      color: 'success'
    })
  } catch (error) {
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

    <!-- Filters & Search -->
    <UCard class="mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Search codes..."
          class="flex-1"
        />
        <USelectMenu
          v-model="activeFilter"
          :options="[
            { label: 'All Codes', value: 'all' },
            { label: 'Active Only', value: 'active' },
            { label: 'Inactive Only', value: 'inactive' }
          ]"
          value-attribute="value"
          option-attribute="label"
        />
      </div>
    </UCard>

    <!-- Codes Table -->
    <UCard>
      <div v-if="loading" class="py-12 text-center">
        <LoadingSpinner class="mx-auto mb-2" />
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Loading invite codes...
        </p>
      </div>

      <div v-else-if="filteredCodes.length === 0" class="py-12 text-center">
        <UIcon name="i-lucide-inbox" class="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p class="text-gray-600 dark:text-gray-400">
          {{ searchQuery ? 'No codes found matching your search' : 'No invite codes yet' }}
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th class="text-left py-3 px-4 font-medium text-sm text-gray-600 dark:text-gray-400">Code</th>
              <th class="text-left py-3 px-4 font-medium text-sm text-gray-600 dark:text-gray-400">Status</th>
              <th class="text-left py-3 px-4 font-medium text-sm text-gray-600 dark:text-gray-400">Uses</th>
              <th class="text-left py-3 px-4 font-medium text-sm text-gray-600 dark:text-gray-400">Pro Until</th>
              <th class="text-left py-3 px-4 font-medium text-sm text-gray-600 dark:text-gray-400">Notes</th>
              <th class="text-right py-3 px-4 font-medium text-sm text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="code in filteredCodes"
              :key="code.id"
              class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <code class="font-mono text-sm font-semibold">{{ code.code }}</code>
                  <UButton
                    icon="i-lucide-copy"
                    size="xs"
                    variant="ghost"
                    color="gray"
                    @click="copyCode(code.code)"
                  />
                </div>
              </td>
              <td class="py-3 px-4">
                <UBadge
                  :color="getStatusColor(getCodeStatus(code))"
                  variant="subtle"
                >
                  {{ getCodeStatus(code) }}
                </UBadge>
              </td>
              <td class="py-3 px-4">
                <span class="text-sm">{{ code.currentUses }} / {{ code.maxUses }}</span>
              </td>
              <td class="py-3 px-4">
                <span class="text-sm">{{ formatDate(code.grantsProUntil) }}</span>
              </td>
              <td class="py-3 px-4">
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ code.notes || '—' }}
                </span>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center justify-end gap-2">
                  <UButton
                    icon="i-lucide-pencil"
                    size="xs"
                    variant="ghost"
                    color="gray"
                    @click="openEditModal(code)"
                  />
                  <UButton
                    v-if="code.isActive"
                    icon="i-lucide-x"
                    size="xs"
                    variant="ghost"
                    color="error"
                    @click="deactivateCode(code)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Create Modal -->
    <UModal v-model="showCreateModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            Create Invite Code
          </h3>
        </template>

        <div class="space-y-4">
          <UFormField label="Code" required>
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

          <UFormField label="Max Uses" required>
            <UInput
              v-model.number="newCode.maxUses"
              type="number"
              min="1"
            />
          </UFormField>

          <UFormField label="Pro Access Duration" help="How long users get Pro access (in months)">
            <UInput
              v-model.number="newCode.grantsProMonths"
              type="number"
              min="1"
              max="24"
            />
          </UFormField>

          <UFormField label="Notes" help="Internal notes about this code">
            <UTextarea
              v-model="newCode.notes"
              placeholder="e.g., Beta wave 1, Conference promo, etc."
              rows="2"
            />
          </UFormField>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="gray"
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
      </UCard>
    </UModal>

    <!-- Edit Modal -->
    <UModal v-model="showEditModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">
            Edit Invite Code
          </h3>
        </template>

        <div v-if="editingCode" class="space-y-4">
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

          <UFormField label="Notes">
            <UTextarea
              v-model="editForm.notes"
              rows="2"
            />
          </UFormField>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="gray"
              @click="showEditModal = false"
            >
              Cancel
            </UButton>
            <UButton @click="updateInviteCode">
              Save Changes
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
