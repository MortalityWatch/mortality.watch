import { useNuxtApp } from '#app'

export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  const nuxtApp = useNuxtApp()
  const toast = nuxtApp.$toast

  if (!toast) {
    console.warn('[showToast] Toast not available, message:', message)
    return
  }

  const colorMap = {
    success: 'green',
    error: 'red',
    warning: 'orange',
    info: 'blue'
  }

  toast.add({
    title: message,
    color: colorMap[type] as 'green' | 'red' | 'orange' | 'blue',
    timeout: 2000
  })
}
