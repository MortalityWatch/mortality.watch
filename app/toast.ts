import { useNuxtApp } from '#app'
import { logger } from '@/lib/logger'

const log = logger.withPrefix('Toast')

export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  // Log toasts for debugging (respects log level settings)
  if (type === 'error') {
    log.error(message)
  } else if (type === 'warning') {
    log.warn(message)
  } else {
    log.info(message)
  }

  const nuxtApp = useNuxtApp()
  const toast = nuxtApp.$toast

  if (!toast) {
    log.warn('Toast UI not available')
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
