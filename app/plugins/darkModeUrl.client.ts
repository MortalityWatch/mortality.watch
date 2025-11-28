/**
 * Dark Mode URL Parameter Plugin
 *
 * Reads the `dm` query parameter and applies dark mode when `dm=1`.
 * This ensures that chart downloads and shared links respect the dark mode state.
 *
 * Note: This plugin runs on the client-side only and sets the color mode preference
 * before the page renders, ensuring charts render with the correct theme.
 */
export default defineNuxtPlugin(() => {
  const route = useRoute()
  const colorMode = useColorMode()

  // Check for dm parameter in URL
  // dm=1 means dark mode should be enabled
  if (route.query.dm === '1') {
    colorMode.preference = 'dark'
  }
})
