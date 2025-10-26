/**
 * Request Queue Manager
 *
 * Manages concurrent chart rendering requests to prevent server overload.
 * Implements request queuing with configurable concurrency limits and timeouts.
 */

interface QueuedRequest<T> {
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
  timestamp: number
}

interface QueueConfig {
  /**
   * Maximum number of concurrent requests being processed
   */
  maxConcurrent: number

  /**
   * Maximum time a request can wait in queue (milliseconds)
   */
  queueTimeout: number

  /**
   * Maximum queue size (reject new requests if exceeded)
   */
  maxQueueSize: number
}

export class RequestQueue {
  private queue: QueuedRequest<unknown>[] = []
  private activeCount = 0
  private config: QueueConfig

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent ?? 3,
      queueTimeout: config.queueTimeout ?? 30000, // 30 seconds
      maxQueueSize: config.maxQueueSize ?? 100
    }
  }

  /**
   * Add a request to the queue and process it when a slot is available
   */
  async enqueue<T>(execute: () => Promise<T>): Promise<T> {
    // Check queue size limit
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error('Request queue is full. Please try again later.')
    }

    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        execute,
        resolve: resolve as (value: unknown) => void,
        reject,
        timestamp: Date.now()
      }

      this.queue.push(request as QueuedRequest<unknown>)
      this.processQueue()
    })
  }

  /**
   * Process queued requests up to the concurrency limit
   */
  private async processQueue(): Promise<void> {
    // Process requests while we have capacity and items in queue
    while (this.activeCount < this.config.maxConcurrent && this.queue.length > 0) {
      const request = this.queue.shift()
      if (!request) break

      // Check if request has timed out while waiting in queue
      const waitTime = Date.now() - request.timestamp
      if (waitTime > this.config.queueTimeout) {
        request.reject(new Error(`Request timed out after ${waitTime}ms in queue`))
        continue
      }

      this.activeCount++

      // Process request asynchronously
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

  /**
   * Get queue statistics for monitoring
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeCount,
      availableSlots: this.config.maxConcurrent - this.activeCount,
      config: this.config
    }
  }

  /**
   * Clear all queued requests (active requests will continue)
   */
  clear() {
    const clearedCount = this.queue.length
    this.queue.forEach((request) => {
      request.reject(new Error('Request queue was cleared'))
    })
    this.queue = []
    return clearedCount
  }
}

/**
 * Global chart rendering queue
 * Limits concurrent chart renders to prevent memory exhaustion
 */
export const chartRenderQueue = new RequestQueue({
  maxConcurrent: 3, // Max 3 concurrent chart renders
  queueTimeout: 30000, // 30 second queue timeout
  maxQueueSize: 50 // Max 50 requests in queue
})

/**
 * Request throttle tracker
 * Tracks request rates per IP/identifier
 */
interface ThrottleEntry {
  count: number
  resetTime: number
}

export class RequestThrottle {
  private requests = new Map<string, ThrottleEntry>()
  private windowMs: number
  private maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Check if request should be throttled
   * Returns true if request should be allowed, false if throttled
   */
  check(identifier: string): boolean {
    const now = Date.now()
    const entry = this.requests.get(identifier)

    if (!entry || now > entry.resetTime) {
      // New window or expired entry
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }

    if (entry.count >= this.maxRequests) {
      return false // Throttled
    }

    entry.count++
    return true // Allowed
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string): number {
    const entry = this.requests.get(identifier)
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests
    }
    return Math.max(0, this.maxRequests - entry.count)
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now()
    for (const [identifier, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(identifier)
      }
    }
  }

  /**
   * Get throttle statistics
   */
  getStats() {
    return {
      trackedIdentifiers: this.requests.size,
      windowMs: this.windowMs,
      maxRequests: this.maxRequests
    }
  }
}

/**
 * Global chart rendering throttle
 * 100 requests per minute for anonymous users
 */
export const chartRenderThrottle = new RequestThrottle(
  60000, // 1 minute window
  100 // 100 requests max
)
