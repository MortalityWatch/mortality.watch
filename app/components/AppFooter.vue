<template>
  <USeparator class="h-px">
    <AppLogo class="w-auto h-4 shrink-0" />
  </USeparator>

  <UFooter :ui="{ top: 'border-b border-default', left: 'lg:flex-initial', right: 'lg:flex-initial' }">
    <template #left>
      <p class="text-muted text-sm">
        © {{ new Date().getFullYear() }} MortalityWatch. Open data for public health.
        <span class="mx-1">·</span>
        <ULink
          to="/donate"
          class="text-muted hover:text-default"
        >
          Support Us
        </ULink>
        <span class="mx-1">·</span>
        <ULink
          to="/legal/terms"
          class="text-muted hover:text-default"
        >
          Terms
        </ULink>
        <span class="mx-1">·</span>
        <ULink
          to="/legal/privacy"
          class="text-muted hover:text-default"
        >
          Privacy
        </ULink>
        <span class="mx-1">·</span>
        <ULink
          to="/legal/refund"
          class="text-muted hover:text-default"
        >
          Refund
        </ULink>
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
