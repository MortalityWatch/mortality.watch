<script setup lang="ts">
interface MenuItem {
  label: string
  icon: string
  to: string
}

const { isIncognito } = useIncognitoMode()
const { isAuthenticated, user } = useAuth()

// Main navigation items
const items = computed(() => [{
  label: 'Explorer',
  to: '/explorer'
}, {
  label: 'Ranking',
  to: '/ranking'
}, {
  label: 'Charts',
  to: '/charts'
}, {
  label: 'Features',
  to: '/features'
}, {
  label: 'Sources',
  to: '/sources'
}, {
  label: 'Methods',
  to: '/methods'
}, {
  label: 'About',
  to: '/about'
}])

// User menu items (shown when authenticated)
const userMenuItems = computed<MenuItem[]>(() => {
  const menu: MenuItem[] = [{
    label: 'My Charts',
    to: '/my-charts',
    icon: 'i-lucide-save'
  }, {
    label: 'Profile',
    to: '/profile',
    icon: 'i-lucide-user'
  }]

  // Add admin link if user is admin
  if (user.value?.role === 'admin') {
    menu.push({
      label: 'Admin Panel',
      to: '/admin',
      icon: 'i-lucide-shield'
    })
  }

  menu.push({
    label: 'Sign Out',
    icon: 'i-lucide-log-out',
    to: '/logout'
  })

  return menu
})
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
        <UDropdownMenu
          :items="[userMenuItems]"
          :popper="{ placement: 'bottom-end' }"
        >
          <UButton
            variant="ghost"
            icon="i-lucide-user"
            :label="user?.displayName || user?.firstName || 'Account'"
            trailing-icon="i-lucide-chevron-down"
          />
        </UDropdownMenu>
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
