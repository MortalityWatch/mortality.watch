import { computed } from 'vue'

/**
 * Unified theme composable for accessing color mode state (Vue components only)
 *
 * This replaces the various getIsDarkTheme() implementations scattered
 * throughout the codebase with a single, reactive source of truth.
 *
 * Usage in Vue components:
 * ```ts
 * const { isDark, colorMode } = useTheme()
 * ```
 *
 * For non-Vue contexts (Chart.js plugins, utilities), use getIsDark() instead.
 */
export const useTheme = () => {
  // In server context, always return light mode
  if (import.meta.server) {
    return {
      isDark: computed(() => false),
      colorMode: { value: 'light' }
    }
  }

  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - useColorMode is auto-imported by Nuxt, but not available in typecheck context
    const colorMode = useColorMode()
    const isDark = computed(() => colorMode.value === 'dark')

    return {
      isDark,
      colorMode
    }
  } catch (e) {
    console.error('[useTheme] Error accessing color mode:', e)
    // Fallback to light mode
    return {
      isDark: computed(() => false),
      colorMode: { value: 'light' }
    }
  }
}

/**
 * Get current dark mode state (for non-Vue contexts)
 *
 * This function can be used in Chart.js plugins and other utilities
 * that don't have access to Vue's reactivity system.
 *
 * Usage in non-Vue contexts:
 * ```ts
 * const isDark = getIsDark()
 * ```
 */
/**
 * Type for Nuxt's useColorMode auto-import
 */
interface GlobalWithNuxt {
  useColorMode?: () => { value: string }
}

/**
 * Server-side dark mode override
 * Used by SSR chart rendering to force dark mode during config generation
 */
let serverDarkModeOverride: boolean | null = null

/**
 * Set dark mode override for server-side rendering
 * Call this before generating chart configs in SSR context
 * @param isDark - Whether to force dark mode (null to clear override)
 */
export const setServerDarkMode = (isDark: boolean | null): void => {
  serverDarkModeOverride = isDark
}

export const getIsDark = (): boolean => {
  // Check server-side override first (for SSR chart rendering)
  if (serverDarkModeOverride !== null) {
    return serverDarkModeOverride
  }

  if (import.meta.server) return false
  try {
    // useColorMode is a Nuxt auto-import, only available on client
    const global = globalThis as GlobalWithNuxt
    const useColorModeFunc = global.useColorMode
    if (!useColorModeFunc) return false
    const colorMode = useColorModeFunc()
    return colorMode.value === 'dark'
  } catch (e) {
    console.error('[useTheme] Error getting dark theme:', e)
    return false
  }
}
