import { useNuxtApp } from '#app'

export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  const nuxtApp = useNuxtApp()
  const toast = nuxtApp.$toast

  if (!toast) {
    console.warn('[showToast] Toast not available, message:', message)
    return
  }

  const colorMap = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info'
  }

  toast.add({
    title: message,
    color: colorMap[type] as 'success' | 'error' | 'warning' | 'info'
  })
}
