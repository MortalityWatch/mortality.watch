<script setup lang="ts">
const { tier } = useAuth()
</script>

<template>
  <USeparator class="h-px">
    <AppLogo class="w-auto h-4 shrink-0" />
  </USeparator>

  <UFooter :ui="{ top: 'border-b border-default', left: 'lg:flex-initial', right: 'lg:flex-initial' }">
    <template #left>
      <p class="text-muted text-sm">
        © {{ new Date().getFullYear() }} MortalityWatch. Open data for public health.
        <span class="mx-1 hidden lg:inline">·</span>
        <ULink
          to="/about"
          class="text-muted hover:text-default hidden lg:inline"
        >
          About
        </ULink>
        <span class="mx-1 hidden lg:inline">·</span>
        <ULink
          to="/sources"
          class="text-muted hover:text-default hidden lg:inline"
        >
          Sources
        </ULink>
        <span class="mx-1 hidden lg:inline">·</span>
        <ULink
          to="/methods"
          class="text-muted hover:text-default hidden lg:inline"
        >
          Methods
        </ULink>
        <template v-if="tier === 2">
          <span class="mx-1 hidden lg:inline">·</span>
          <ULink
            to="/features"
            class="text-muted hover:text-default hidden lg:inline"
          >
            Features
          </ULink>
        </template>
        <span class="mx-1 hidden lg:inline">·</span>
        <ULink
          to="/donate"
          class="text-muted hover:text-default hidden lg:inline"
        >
          Support Us
        </ULink>
        <span class="mx-1 hidden lg:inline">·</span>
        <ULink
          to="/legal/terms"
          class="text-muted hover:text-default hidden lg:inline"
        >
          Terms
        </ULink>
        <span class="mx-1 hidden lg:inline">·</span>
        <ULink
          to="/legal/privacy"
          class="text-muted hover:text-default hidden lg:inline"
        >
          Privacy
        </ULink>
        <span class="mx-1 hidden lg:inline">·</span>
        <ULink
          to="/legal/refund"
          class="text-muted hover:text-default hidden lg:inline"
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
