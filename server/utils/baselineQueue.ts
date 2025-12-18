/**
 * Server-side Baseline Request Queue
 *
 * Limits concurrent requests to the stats API during SSR to prevent overwhelming the server.
 */

interface QueuedRequest<T> {
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
}

class BaselineRequestQueue {
  private queue: QueuedRequest<unknown>[] = []
  private activeCount = 0
  private maxConcurrent: number

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent
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
      request.reject(error as Error)
    }
  }
}

/**
 * Global server-side baseline request queue
 * Limits concurrent stats API requests to 3 during SSR
 */
export const serverBaselineQueue = new BaselineRequestQueue(3)
