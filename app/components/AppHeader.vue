<script setup lang="ts">
import { useTutorial } from '@/composables/useTutorial'

interface MenuItem {
  label: string
  icon: string
  to: string
}

const { isIncognito } = useIncognitoMode()
const { isAuthenticated, user } = useAuth()
const { isPro } = useFeatureAccess()
const { startTutorial } = useTutorial()
const { loginUrl, signupUrl } = useAuthRedirect()
const colorMode = useColorMode()

// Color mode toggle - cycles through light -> dark -> system
const colorModeIcon = computed(() => {
  const pref = colorMode.preference
  if (pref === 'light') {
    return 'i-lucide-sun'
  }
  if (pref === 'dark') {
    return 'i-lucide-moon'
  }
  return 'i-lucide-sun-moon' // system
})

const colorModeLabel = computed(() => {
  const pref = colorMode.preference
  if (pref === 'light') {
    return 'Light mode'
  }
  if (pref === 'dark') {
    return 'Dark mode'
  }
  return 'System theme'
})

function toggleColorMode(): void {
  // Cycle: light -> dark -> system -> light
  const current = colorMode.preference
  if (current === 'light') {
    colorMode.preference = 'dark'
  } else if (current === 'dark') {
    colorMode.preference = 'system'
  } else {
    colorMode.preference = 'light'
  }
}

// Check if we're on pages with tutorials to show help button
const route = useRoute()
const isExplorerPage = computed(() => route.path === '/explorer')
const isRankingPage = computed(() => route.path === '/ranking')
const showHelpButton = computed(() => isExplorerPage.value || isRankingPage.value)

// Determine which tutorial to start based on current page
const handleHelpClick = (): void => {
  if (isRankingPage.value) {
    startTutorial('ranking')
  } else {
    startTutorial('explorer')
  }
}

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
  }]

  // Add "My Charts" if user is authenticated
  if (isAuthenticated.value) {
    navItems.push({
      label: 'My Charts',
      icon: 'i-lucide-book-heart',
      to: '/my-charts'
    })
  }

  // Add Chart Gallery
  navItems.push({
    label: 'Chart Gallery',
    icon: 'i-lucide-gallery-horizontal-end',
    to: '/charts'
  })

  // Add "Features" for non-pro users (PUBLIC and REGISTERED)
  if (!isPro.value) {
    navItems.push({
      label: 'Features',
      icon: 'i-lucide-sparkles',
      to: '/features'
    })
  }

  return navItems
})

// Secondary navigation items (footer links)
const secondaryItems = computed<MenuItem[]>(() => {
  const navItems: MenuItem[] = [{
    label: 'About',
    icon: 'i-lucide-info',
    to: '/about'
  }, {
    label: 'Sources',
    icon: 'i-lucide-database',
    to: '/sources'
  }, {
    label: 'Methods',
    icon: 'i-lucide-flask-conical',
    to: '/methods'
  }]

  // Add Features for Pro users in secondary nav
  if (isPro.value) {
    navItems.push({
      label: 'Features',
      icon: 'i-lucide-sparkles',
      to: '/features'
    })
  }

  navItems.push({
    label: 'Support Us',
    icon: 'i-lucide-heart',
    to: '/donate'
  }, {
    label: 'Legal',
    icon: 'i-lucide-scale',
    to: '/legal'
  })

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
      <!-- Help button (only on pages with tutorials) -->
      <UButton
        v-if="showHelpButton"
        icon="i-lucide-help-circle"
        color="neutral"
        variant="ghost"
        aria-label="Show tutorial"
        @click="handleHelpClick"
      />

      <UButton
        :key="`color-mode-${colorMode.preference}`"
        :icon="colorModeIcon"
        :aria-label="colorModeLabel"
        color="neutral"
        variant="ghost"
        @click="toggleColorMode"
      />

      <!-- Authentication buttons -->
      <UDropdownMenu
        v-if="isAuthenticated"
        :items="[userMenuItems]"
        :content="{ align: 'end' }"
      >
        <UButton
          variant="ghost"
          icon="i-lucide-user"
          :label="user?.displayName || user?.firstName || 'Account'"
          trailing-icon="i-lucide-chevron-down"
        />
      </UDropdownMenu>
      <template v-else>
        <UButton
          :to="loginUrl"
          variant="ghost"
          label="Sign In"
        />
        <!-- Hide Sign Up on mobile to prevent top bar overflow -->
        <UButton
          :to="signupUrl"
          label="Sign Up"
          class="hidden sm:inline-flex"
        />
      </template>
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
        :ui="{ item: 'mb-2' }"
      />

      <USeparator class="my-2" />

      <UNavigationMenu
        :items="secondaryItems"
        orientation="vertical"
        class="-mx-2.5"
        :ui="{ item: 'mb-2' }"
      />
    </template>
  </UHeader>
</template>
