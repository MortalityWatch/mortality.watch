/**
 * Structured Logging Utility
 *
 * Provides structured logging with context, levels, and correlation IDs.
 * Replaces console.log/warn/error across the codebase for better production debugging.
 *
 * Features:
 * - Log levels: debug, info, warn, error
 * - Request correlation IDs
 * - Contextual metadata (user ID, request path, etc.)
 * - Environment-based log level configuration
 * - JSON output for structured logs in production
 */

import type { H3Event } from 'h3'
import { getHeader, setHeader } from 'h3'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  correlationId?: string
  userId?: string
  requestPath?: string
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private minLevel: LogLevel

  constructor() {
    // Set minimum log level based on environment
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined
    this.minLevel = envLevel || this.getDefaultLogLevel()
  }

  private getDefaultLogLevel(): LogLevel {
    const env = process.env.NODE_ENV
    if (env === 'production') return 'info'
    if (env === 'test') return 'warn'
    return 'debug'
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const minLevelIndex = levels.indexOf(this.minLevel)
    const currentLevelIndex = levels.indexOf(level)
    return currentLevelIndex >= minLevelIndex
  }

  private formatOutput(entry: LogEntry): string {
    const env = process.env.NODE_ENV

    // JSON output for production
    if (env === 'production') {
      return JSON.stringify(entry)
    }

    // Human-readable output for development
    const timestamp = new Date(entry.timestamp).toISOString()
    const level = entry.level.toUpperCase().padEnd(5)
    let output = `[${timestamp}] ${level} ${entry.message}`

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`
      if (entry.error.stack) {
        output += `\n  Stack: ${entry.error.stack}`
      }
    }

    return output
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }

    const output = this.formatOutput(entry)

    // Use appropriate console method
    switch (level) {
      case 'error':
        console.error(output)
        break
      case 'warn':
        console.warn(output)
        break
      case 'info':
        console.info(output)
        break
      case 'debug':
        console.debug(output)
        break
    }
  }

  /**
   * Log a debug message (verbose logging for development)
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta)
  }

  /**
   * Log an informational message
   */
  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta)
  }

  /**
   * Log a warning message
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta)
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.log('error', message, meta, error)
  }

  /**
   * Create a child logger with additional context
   */
  withContext(context: LogContext): ChildLogger {
    return new ChildLogger(this, context)
  }

  /**
   * Extract correlation ID from H3 event
   */
  getCorrelationId(event: H3Event): string {
    // Try to get existing correlation ID from headers
    const existingId = getHeader(event, 'x-correlation-id')
    if (existingId) return existingId as string

    // Generate new correlation ID
    const correlationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Set it in response headers for client tracking
    setHeader(event, 'x-correlation-id', correlationId)

    return correlationId
  }

  /**
   * Create a logger with request context from H3 event
   */
  withRequest(event: H3Event): ChildLogger {
    const context: LogContext = {
      correlationId: this.getCorrelationId(event),
      requestPath: event.path,
      method: event.method
    }

    // Add user ID if available
    const user = event.context.user
    if (user?.id) {
      context.userId = user.id.toString()
    }

    return this.withContext(context)
  }
}

/**
 * Child logger that automatically includes parent context
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private baseContext: LogContext
  ) {}

  private mergeContext(additional?: Record<string, unknown>): LogContext {
    return { ...this.baseContext, ...additional }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.parent.debug(message, this.mergeContext(meta))
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.parent.info(message, this.mergeContext(meta))
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.parent.warn(message, this.mergeContext(meta))
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.parent.error(message, error, this.mergeContext(meta))
  }

  withContext(context: LogContext): ChildLogger {
    return new ChildLogger(this.parent, this.mergeContext(context))
  }
}

// Singleton instance
export const logger = new Logger()

// Export for direct use
export default logger
