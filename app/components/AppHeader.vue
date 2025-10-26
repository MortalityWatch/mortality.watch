<script setup lang="ts">
const items = computed(() => [{
  label: 'Explorer',
  to: '/explorer'
}, {
  label: 'Ranking',
  to: '/ranking'
}, {
  label: 'Sources',
  to: '/sources'
}, {
  label: 'Methods',
  to: '/methods'
}, {
  label: 'About',
  to: '/about'
}, {
  label: 'Donate',
  to: '/donate'
}])

const { isIncognito } = useIncognitoMode()
const { user, isAuthenticated, signOut } = useAuth()

const router = useRouter()

const userMenuItems = computed(() => {
  if (!user.value) return []
  return [[{
    label: user.value.email,
    slot: 'account',
    disabled: true
  }], [{
    label: 'Profile',
    icon: 'i-lucide-user',
    id: 'profile'
  }], [{
    label: 'Sign Out',
    icon: 'i-lucide-log-out',
    id: 'signout'
  }]]
})

interface DropdownItem {
  id?: string
  label: string
  icon?: string
  slot?: string
  disabled?: boolean
}

function handleDropdownSelect(item: DropdownItem) {
  if (item.id === 'profile') {
    router.push('/profile')
  } else if (item.id === 'signout') {
    signOut()
  }
}
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/">
        <AppLogo
          :class="[
            'w-auto h-7 shrink-0 transition-all duration-300',
            isIncognito && 'invert'
          ]"
        />
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="items"
      variant="link"
    />

    <template #right>
      <UColorModeButton />

      <!-- Authentication buttons -->
      <template v-if="isAuthenticated">
        <UDropdown
          :items="userMenuItems"
          mode="click"
          @select="handleDropdownSelect"
        >
          <UAvatar
            :alt="user?.name || user?.email"
            size="sm"
            class="cursor-pointer"
          />

          <template #account="{ item }">
            <div class="text-left">
              <p class="truncate font-medium text-gray-900 dark:text-white">
                {{ user?.name }}
              </p>
              <p class="truncate text-sm text-gray-500 dark:text-gray-400">
                {{ item.label }}
              </p>
            </div>
          </template>
        </UDropdown>
      </template>
      <template v-else>
        <UButton
          to="/login"
          variant="ghost"
          label="Sign In"
        />
        <UButton
          to="/signup"
          label="Sign Up"
        />
      </template>
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />
    </template>
  </UHeader>
</template>
