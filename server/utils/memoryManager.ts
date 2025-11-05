import { logger } from './logger'

/**
 * Memory Management Utilities
 *
 * Provides utilities for managing memory during chart rendering:
 * - Timeouts to prevent hanging requests
 * - Resource cleanup helpers
 * - Memory usage monitoring
 */

/**
 * Execute a function with a timeout
 * Throws an error if the function doesn't complete within the timeout period
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string = 'Operation'
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout>

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutHandle!)
    return result
  } catch (error) {
    clearTimeout(timeoutHandle!)
    throw error
  }
}

/**
 * Canvas-like object with necessary properties for cleanup
 * Works with both browser Canvas and node-canvas Canvas elements
 * Uses flexible typing to accommodate both browser and node-canvas implementations
 */
interface CanvasLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getContext: (type: any) => unknown | null
  width: number
  height: number
}

/**
 * Clean up canvas resources
 * Helps prevent memory leaks by explicitly clearing canvas contexts
 * Works with both browser and node-canvas Canvas implementations
 */
export function cleanupCanvas(canvas: CanvasLike) {
  try {
    const ctx = canvas.getContext('2d') as {
      clearRect?: (x: number, y: number, w: number, h: number) => void
      setTransform?: (a: number, b: number, c: number, d: number, e: number, f: number) => void
    } | null

    if (ctx) {
      // Clear the canvas
      if (ctx.clearRect) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }

      // Reset transforms
      if (ctx.setTransform) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
      }
    }
  } catch (error) {
    logger.warn('Error cleaning up canvas', { error })
  }
}

/**
 * Get current memory usage (Node.js only)
 */
export function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024) // MB
    }
  }
  return null
}

/**
 * Check if memory usage is above threshold
 * Returns true if memory usage is concerning
 */
export function isMemoryPressure(thresholdMB: number = 1024): boolean {
  const usage = getMemoryUsage()
  if (!usage) return false

  return usage.heapUsed > thresholdMB || usage.rss > thresholdMB * 1.5
}

/**
 * Log memory usage with label
 */
export function logMemoryUsage(label: string) {
  const usage = getMemoryUsage()
  if (usage && import.meta.dev) {
    logger.info(`[Memory] ${label}:`, usage)
  }
}

/**
 * Execute a function with memory tracking
 * Logs memory before and after execution (dev mode only)
 */
export async function withMemoryTracking<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  if (import.meta.dev) {
    logMemoryUsage(`${label} - Before`)
  }

  try {
    const result = await fn()

    if (import.meta.dev) {
      logMemoryUsage(`${label} - After`)
    }

    return result
  } catch (error) {
    if (import.meta.dev) {
      logMemoryUsage(`${label} - Error`)
    }
    throw error
  }
}
