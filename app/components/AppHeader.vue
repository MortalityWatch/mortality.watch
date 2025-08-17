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
  label: 'About',
  to: '/about'
}, {
  label: 'Donate',
  to: '/donate'
}])
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/">
        <AppLogo class="w-auto h-7 shrink-0" />
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="items"
      variant="link"
    />

    <template #right>
      <UColorModeButton />

      <!-- Authentication buttons removed -->
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
