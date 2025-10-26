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
const { isAuthenticated } = useAuth()
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
        <UButton
          to="/profile"
          variant="ghost"
          icon="i-lucide-user"
          aria-label="Go to profile"
        />
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
