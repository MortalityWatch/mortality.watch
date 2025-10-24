/**
 * Health check endpoint for Docker/Kubernetes
 */
export default defineEventHandler(() => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString()
  }
})
