/**
 * Generic Request Queue
 *
 * Limits concurrent requests to prevent overwhelming external services.
 * Features:
 * - Configurable max concurrency
 * - Request timeout handling
 * - FIFO queue ordering
 * - Error propagation
 */

interface QueuedRequest<T> {
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
  timeoutId?: ReturnType<typeof setTimeout>
}

export interface RequestQueueOptions {
  /** Maximum concurrent requests (default: 5) */
  maxConcurrent?: number
  /** Request timeout in milliseconds (default: 30000) */
  timeoutMs?: number
}

export class RequestQueue {
  private queue: QueuedRequest<unknown>[] = []
  private activeCount = 0
  private readonly maxConcurrent: number
  private readonly timeoutMs: number

  constructor(options: RequestQueueOptions = {}) {
    this.maxConcurrent = options.maxConcurrent ?? 5
    this.timeoutMs = options.timeoutMs ?? 30000
  }

  /**
   * Add a request to the queue and process it when a slot is available
   */
  async enqueue<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        execute,
        resolve: resolve as (value: unknown) => void,
        reject
      }

      // Set up timeout
      if (this.timeoutMs > 0) {
        request.timeoutId = setTimeout(() => {
          // Remove from queue if still waiting
          const index = this.queue.indexOf(request as QueuedRequest<unknown>)
          if (index !== -1) {
            this.queue.splice(index, 1)
            reject(new Error(`Request timeout after ${this.timeoutMs}ms`))
          }
        }, this.timeoutMs)
      }

      this.queue.push(request as QueuedRequest<unknown>)
      this.processQueue()
    })
  }

  /**
   * Process queued requests up to the concurrency limit
   */
  private processQueue(): void {
    while (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
      const request = this.queue.shift()
      if (!request) break

      // Clear timeout since we're now executing
      if (request.timeoutId) {
        clearTimeout(request.timeoutId)
      }

      this.activeCount++

      this.executeRequest(request).finally(() => {
        this.activeCount--
        this.processQueue()
      })
    }
  }

  /**
   * Execute a single request with error handling
   */
  private async executeRequest(request: QueuedRequest<unknown>): Promise<void> {
    try {
      const result = await request.execute()
      request.resolve(result)
    } catch (error) {
      request.reject(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get current queue statistics
   */
  getStats(): { active: number, queued: number, maxConcurrent: number } {
    return {
      active: this.activeCount,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent
    }
  }
}
