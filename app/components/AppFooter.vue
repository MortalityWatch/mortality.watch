<template>
  <USeparator class="h-px">
    <AppLogo class="w-auto h-4 shrink-0" />
  </USeparator>

  <UFooter :ui="{ top: 'border-b border-default' }">
    <template #left>
      <p class="text-muted text-sm">
        © {{ new Date().getFullYear() }} MortalityWatch. Open data for public health.
      </p>
    </template>

    <template #right>
      <UButton
        to="https://x.com/mortalitywatch"
        target="_blank"
        icon="i-simple-icons-x"
        aria-label="X (Twitter)"
        color="neutral"
        variant="ghost"
      />

      <UButton
        to="https://discord.gg/nkSUpBV3Zr"
        target="_blank"
        icon="i-simple-icons-discord"
        aria-label="Discord"
        color="neutral"
        variant="ghost"
      />

      <UButton
        to="https://github.com/mortalitywatch"
        target="_blank"
        icon="i-simple-icons-github"
        aria-label="GitHub"
        color="neutral"
        variant="ghost"
      />
    </template>
  </UFooter>
</template>
