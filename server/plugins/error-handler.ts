import { logger } from '../utils/logger'

interface ErrorWithStatus extends Error {
  statusCode?: number
  status?: number
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error: ErrorWithStatus, { event }) => {
    logger.error('Server error', error, {
      url: event?.path,
      statusCode: error.statusCode
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
