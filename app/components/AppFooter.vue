<template>
  <USeparator
    icon="i-simple-icons-nuxtdotjs"
    class="h-px"
  />

  <UFooter :ui="{ top: 'border-b border-default' }">
    <template #left>
      <p class="text-muted text-sm">
        Copyright © {{ new Date().getFullYear() }}. All rights reserved.
      </p>
    </template>

    <template #right>
      <UColorModeButton />

      <UButton
        to="https://github.com/nuxt-ui-pro/saas"
        target="_blank"
        icon="i-simple-icons-github"
        aria-label="GitHub"
        color="neutral"
        variant="ghost"
      />
    </template>
  </UFooter>
</template>
