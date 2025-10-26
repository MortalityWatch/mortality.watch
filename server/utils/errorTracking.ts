/**
 * Error Tracking Utilities
 *
 * Provides centralized error tracking for the application.
 * Integrates with Sentry when configured, otherwise logs to console.
 *
 * Setup Instructions:
 * 1. Install Sentry: npm install @sentry/node
 * 2. Create a Sentry project at https://sentry.io
 * 3. Set SENTRY_DSN environment variable
 * 4. Uncomment Sentry.init() call below
 */

// Uncomment when Sentry is set up:
// import * as Sentry from '@sentry/node'

interface ErrorContext {
  user?: string
  tags?: Record<string, string>
  extra?: Record<string, unknown>
}

class ErrorTracker {
  private initialized = false

  constructor() {
    this.init()
  }

  /**
   * Initialize error tracking
   */
  private init() {
    const sentryDsn = process.env.SENTRY_DSN

    if (!sentryDsn) {
      console.warn('[ErrorTracking] SENTRY_DSN not configured, using console logging')
      return
    }

    try {
      // Uncomment when @sentry/node is installed:
      /*
      Sentry.init({
        dsn: sentryDsn,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Don't send errors in development
        enabled: process.env.NODE_ENV === 'production',

        beforeSend(event) {
          // Filter out sensitive data
          if (event.request?.headers) {
            delete event.request.headers.authorization
            delete event.request.headers.cookie
          }
          return event
        }
      })
      */

      this.initialized = true
      console.log('[ErrorTracking] Sentry initialized')
    } catch (error) {
      console.error('[ErrorTracking] Failed to initialize Sentry:', error)
    }
  }

  /**
   * Capture an error
   */
  captureError(error: Error | string, context?: ErrorContext) {
    const errorObj = typeof error === 'string' ? new Error(error) : error

    // Log to console in all environments
    console.error('[Error]', errorObj, context)

    if (!this.initialized) {
      return
    }

    // Uncomment when @sentry/node is installed:
    /*
    if (context?.tags) {
      Sentry.setTags(context.tags)
    }

    if (context?.extra) {
      Sentry.setExtras(context.extra)
    }

    if (context?.user) {
      Sentry.setUser({ id: context.user })
    }

    Sentry.captureException(errorObj)
    */
  }

  /**
   * Capture a message (non-error event)
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    console.log(`[${level.toUpperCase()}]`, message, context)

    if (!this.initialized) {
      return
    }

    // Uncomment when @sentry/node is installed:
    /*
    if (context?.tags) {
      Sentry.setTags(context.tags)
    }

    if (context?.extra) {
      Sentry.setExtras(context.extra)
    }

    Sentry.captureMessage(message, level)
    */
  }

  /**
   * Set user context for error tracking
   */
  setUser(_userId: string) {
    if (!this.initialized) {
      return
    }

    // Uncomment when @sentry/node is installed:
    /*
    Sentry.setUser({ id: _userId })
    */
  }

  /**
   * Clear user context
   */
  clearUser() {
    if (!this.initialized) {
      return
    }

    // Uncomment when @sentry/node is installed:
    /*
    Sentry.setUser(null)
    */
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker()

/**
 * Utility function to wrap async handlers with error tracking
 */
export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  handler: T,
  context?: ErrorContext
): T {
  return (async (...args: unknown[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      errorTracker.captureError(error as Error, context)
      throw error
    }
  }) as T
}
