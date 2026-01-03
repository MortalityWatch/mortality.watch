/**
 * Client-side Logger
 *
 * Browser-compatible structured logging with environment-aware log levels.
 * Provides consistent logging across the application with context support.
 *
 * Features:
 * - Log levels: debug, info, warn, error
 * - Context-aware logging with prefixes
 * - Environment-based filtering (debug only in development)
 * - Structured error logging with stack traces
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  [key: string]: unknown
}

class Logger {
  private minLevel: LogLevel

  constructor() {
    this.minLevel = this.getDefaultLogLevel()
  }

  private getDefaultLogLevel(): LogLevel {
    // Use Nuxt's import.meta.dev for client/dev, fallback to NODE_ENV for SSR/test
    const isDev = import.meta.dev || process.env.NODE_ENV !== 'production'
    return isDev ? 'debug' : 'warn'
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const minLevelIndex = levels.indexOf(this.minLevel)
    const currentLevelIndex = levels.indexOf(level)
    return currentLevelIndex >= minLevelIndex
  }

  private formatMessage(prefix: string, message: string, context?: LogContext): string {
    let output = prefix ? `[${prefix}] ${message}` : message
    if (context && Object.keys(context).length > 0) {
      output += ` ${JSON.stringify(context)}`
    }
    return output
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('', message, context))
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorObj = error instanceof Error ? error : undefined
      if (errorObj) {
        console.error(this.formatMessage('', message, context), errorObj)
      } else if (error !== undefined) {
        console.error(this.formatMessage('', message, { ...context, error }))
      } else {
        console.error(this.formatMessage('', message, context))
      }
    }
  }

  /**
   * Create a child logger with a prefix for consistent context
   */
  withPrefix(prefix: string): PrefixedLogger {
    return new PrefixedLogger(this, prefix)
  }
}

class PrefixedLogger {
  constructor(
    private parent: Logger,
    private prefix: string
  ) {}

  debug(message: string, context?: LogContext): void {
    this.parent.debug(`[${this.prefix}] ${message}`, context)
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(`[${this.prefix}] ${message}`, context)
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(`[${this.prefix}] ${message}`, context)
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.parent.error(`[${this.prefix}] ${message}`, error, context)
  }
}

// Singleton instance
export const logger = new Logger()

/**
 * Format an error for logging context
 * Extracts the error message whether it's an Error instance or unknown type
 */
export function formatError(error: unknown): { error: string } {
  return { error: error instanceof Error ? error.message : String(error) }
}

export default logger
