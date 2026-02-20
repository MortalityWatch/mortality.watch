import { logger } from '../utils/logger'
import { errorTracker } from '../utils/errorTracking'

interface ErrorWithStatus extends Error {
  statusCode?: number
  status?: number
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error: ErrorWithStatus, { event }) => {
    const statusCode = error.statusCode || error.status || 500
    const isNotFound = statusCode === 404 || error.message?.startsWith('Page not found:')

    // Bot scans and random probes generate large 404 noise; keep them out of error tracking.
    if (isNotFound) {
      logger.warn('Ignoring expected not-found error', {
        url: event?.path,
        statusCode,
        message: error.message
      })
      return
    }

    logger.error('Server error', error, {
      url: event?.path,
      statusCode
    })

    errorTracker.captureError(error, {
      tags: {
        scope: 'nitro-error-hook'
      },
      extra: {
        url: event?.path,
        statusCode
      }
    })
  })

  nitroApp.hooks.hook('request', (event) => {
    // Add custom error handler to each request
    event.context.$errorHandler = (error: ErrorWithStatus) => {
      // Log the full error server-side
      logger.error('Request error', error instanceof Error ? error : new Error(String(error)))

      // In production, don't expose stack traces
      const isProduction = process.env.NODE_ENV === 'production'

      // Create sanitized error for client
      const statusCode = error.statusCode || error.status || 500
      const message = error.message || 'Internal server error'

      throw createError({
        statusCode,
        message,
        // Only include stack in development
        ...(!isProduction && error.stack && { stack: error.stack })
      })
    }
  })
})
