/**
 * Health Check Endpoint
 *
 * Provides system health status including:
 * - Chart rendering queue statistics
 * - Request throttle statistics
 * - Cache statistics
 * - Memory usage
 */

import { chartRenderQueue, chartRenderThrottle } from '../utils/requestQueue'
import { filesystemCache } from '../utils/cache'
import { getMemoryUsage, isMemoryPressure } from '../utils/memoryManager'
import { baselineCircuitBreaker } from '../utils/circuitBreaker'

export default defineEventHandler(async (event) => {
  try {
    // Get queue statistics
    const queueStats = chartRenderQueue.getStats()

    // Get throttle statistics
    const throttleStats = chartRenderThrottle.getStats()

    // Get cache statistics
    const cacheStats = await filesystemCache.getStats()

    // Get memory usage
    const memoryUsage = getMemoryUsage()
    const memoryPressure = isMemoryPressure()

    // Get circuit breaker status
    const circuitStatus = baselineCircuitBreaker.getStatus()

    // Determine overall health status
    const isHealthy = queueStats.queueLength < queueStats.config.maxQueueSize * 0.8
      && !memoryPressure
      && queueStats.availableSlots > 0
      && !baselineCircuitBreaker.isOpen()

    const health = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),

      queue: {
        available: queueStats.queueLength < queueStats.config.maxQueueSize,
        length: queueStats.queueLength,
        active: queueStats.activeRequests,
        availableSlots: queueStats.availableSlots,
        maxConcurrent: queueStats.config.maxConcurrent,
        maxQueueSize: queueStats.config.maxQueueSize
      },

      throttle: {
        trackedIdentifiers: throttleStats.trackedIdentifiers,
        windowMs: throttleStats.windowMs,
        maxRequests: throttleStats.maxRequests
      },

      cache: {
        files: cacheStats.files,
        sizeBytes: cacheStats.size,
        sizeMB: Math.round(cacheStats.size / 1024 / 1024 * 100) / 100
      },

      circuitBreaker: {
        name: circuitStatus.name,
        state: circuitStatus.state,
        failures: circuitStatus.stats.failures,
        successes: circuitStatus.stats.successes,
        timeSinceLastFailureMs: circuitStatus.stats.timeSinceLastFailure
      },

      memory: memoryUsage
        ? {
            heapUsedMB: memoryUsage.heapUsed,
            heapTotalMB: memoryUsage.heapTotal,
            externalMB: memoryUsage.external,
            rssMB: memoryUsage.rss,
            pressure: memoryPressure
          }
        : null
    }

    // Set appropriate status code
    const statusCode = isHealthy ? 200 : 503

    setResponseStatus(event, statusCode)
    return health
  } catch (error) {
    console.error('Health check failed:', error)

    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})
