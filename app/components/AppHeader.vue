<script setup lang="ts">
import { useTutorial } from '@/composables/useTutorial'

interface MenuItem {
  label: string
  icon: string
  to: string
}

const { isIncognito } = useIncognitoMode()
const { isAuthenticated, user, tier } = useAuth()
const { startTutorial } = useTutorial()

// Check if we're on the explorer page to show help button
const route = useRoute()
const isExplorerPage = computed(() => route.path === '/explorer')

// Main navigation items
const items = computed(() => {
  const navItems = [{
    label: 'Explorer',
    icon: 'i-lucide-line-chart',
    to: '/explorer'
  }, {
    label: 'Ranking',
    icon: 'i-lucide-chart-bar-decreasing',
    to: '/ranking'
  }, {
    label: 'Chart Gallery',
    icon: 'i-lucide-gallery-horizontal-end',
    to: '/charts'
  }]

  // Add "My Charts" if user is authenticated
  if (isAuthenticated.value) {
    navItems.push({
      label: 'My Charts',
      icon: 'i-lucide-book-heart',
      to: '/my-charts'
    })
  }

  // Add "Features" for non-pro users (PUBLIC and REGISTERED, tier < 2)
  if (tier.value < 2) {
    navItems.push({
      label: 'Features',
      icon: 'i-lucide-sparkles',
      to: '/features'
    })
  }

  return navItems
})

// User menu items (shown when authenticated)
const userMenuItems = computed<MenuItem[]>(() => {
  const menu: MenuItem[] = [{
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
      <!-- Help button (only on explorer page) -->
      <UButton
        v-if="isExplorerPage"
        icon="i-lucide-help-circle"
        color="neutral"
        variant="ghost"
        aria-label="Show tutorial"
        @click="startTutorial"
      />

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
