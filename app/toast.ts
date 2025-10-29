import { useNuxtApp } from '#app'

export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  // Always log toasts to console for debugging
  const logPrefix = `[Toast:${type.toUpperCase()}]`
  if (type === 'error') {
    console.error(logPrefix, message)
  } else if (type === 'warning') {
    console.warn(logPrefix, message)
  } else {
    console.log(logPrefix, message)
  }

  const nuxtApp = useNuxtApp()
  const toast = nuxtApp.$toast

  if (!toast) {
    console.warn('[showToast] Toast UI not available')
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
