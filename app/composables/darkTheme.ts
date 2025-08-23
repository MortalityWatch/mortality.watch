import { computed, ref } from 'vue'

const darkThemeState = ref(
  (typeof window !== 'undefined'
    && window?.matchMedia('(prefers-color-scheme: dark)').matches)
  ?? false
)

export const isDarkTheme = computed(() => darkThemeState.value)

export const toggleDarkTheme = () => {
  darkThemeState.value = !darkThemeState.value
  document.documentElement.classList.toggle('p-dark')
}
