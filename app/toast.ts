export const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  // Simple console-based toast for now
  // In a real app, you'd integrate with a proper toast library like vue-toastification
  console.log(`[${type.toUpperCase()}] ${message}`)

  // You can also create a simple browser alert for critical messages
  if (type === 'error') {
    alert(message)
  }
}
