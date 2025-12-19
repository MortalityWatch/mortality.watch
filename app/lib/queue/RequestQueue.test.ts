import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RequestQueue } from './RequestQueue'

describe('RequestQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('constructor', () => {
    it('should use default values when no options provided', () => {
      const queue = new RequestQueue()
      const stats = queue.getStats()
      expect(stats.maxConcurrent).toBe(5)
    })

    it('should accept custom maxConcurrent', () => {
      const queue = new RequestQueue({ maxConcurrent: 3 })
      const stats = queue.getStats()
      expect(stats.maxConcurrent).toBe(3)
    })

    it('should accept custom timeoutMs', () => {
      const queue = new RequestQueue({ timeoutMs: 10000 })
      const stats = queue.getStats()
      expect(stats.maxConcurrent).toBe(5)
    })
  })

  describe('enqueue', () => {
    it('should execute a single request immediately', async () => {
      const queue = new RequestQueue({ maxConcurrent: 3 })
      const result = await queue.enqueue(() => Promise.resolve('test'))
      expect(result).toBe('test')
    })

    it('should execute multiple requests up to maxConcurrent in parallel', async () => {
      const queue = new RequestQueue({ maxConcurrent: 2, timeoutMs: 0 })
      const executionOrder: number[] = []
      const resolvers: Array<() => void> = []

      const createRequest = (id: number) => {
        return queue.enqueue(() => new Promise<number>((resolve) => {
          executionOrder.push(id)
          resolvers.push(() => resolve(id))
        }))
      }

      // Start 3 requests
      const p1 = createRequest(1)
      const p2 = createRequest(2)
      const p3 = createRequest(3)

      // Allow promises to start
      await vi.runAllTimersAsync()

      // Only 2 should have started (maxConcurrent = 2)
      expect(executionOrder).toEqual([1, 2])
      expect(queue.getStats().active).toBe(2)
      expect(queue.getStats().queued).toBe(1)

      // Resolve first request
      resolvers[0]!()
      await vi.runAllTimersAsync()
      await p1

      // Third request should now start
      expect(executionOrder).toEqual([1, 2, 3])
      expect(queue.getStats().active).toBe(2)
      expect(queue.getStats().queued).toBe(0)

      // Resolve remaining
      resolvers[1]!()
      resolvers[2]!()
      await Promise.all([p2, p3])
    })

    it('should maintain FIFO order for queued requests', async () => {
      const queue = new RequestQueue({ maxConcurrent: 1, timeoutMs: 0 })
      const results: number[] = []
      const resolvers: Array<() => void> = []

      const createRequest = (id: number) => {
        return queue.enqueue(() => new Promise<void>((resolve) => {
          resolvers.push(() => {
            results.push(id)
            resolve()
          })
        }))
      }

      const p1 = createRequest(1)
      const p2 = createRequest(2)
      const p3 = createRequest(3)

      await vi.runAllTimersAsync()

      // Resolve in order
      resolvers[0]!()
      await vi.runAllTimersAsync()
      await p1

      resolvers[1]!()
      await vi.runAllTimersAsync()
      await p2

      resolvers[2]!()
      await vi.runAllTimersAsync()
      await p3

      expect(results).toEqual([1, 2, 3])
    })

    it('should propagate errors correctly', async () => {
      const queue = new RequestQueue({ maxConcurrent: 3 })
      const error = new Error('Test error')

      await expect(queue.enqueue(() => Promise.reject(error))).rejects.toThrow('Test error')
    })

    it('should convert non-Error rejections to Error', async () => {
      const queue = new RequestQueue({ maxConcurrent: 3 })

      await expect(queue.enqueue(() => Promise.reject('string error'))).rejects.toThrow('string error')
    })
  })

  describe('timeout handling', () => {
    it('should timeout requests that wait too long in queue', async () => {
      const queue = new RequestQueue({ maxConcurrent: 1, timeoutMs: 1000 })
      let blockingResolver: () => void

      // Start a long-running request to block the queue
      const blockingPromise = queue.enqueue(() => new Promise<void>((resolve) => {
        blockingResolver = resolve
      }))

      // Queue another request that will timeout - capture rejection immediately
      let timeoutError: Error | undefined
      const timeoutPromise = queue.enqueue(() => Promise.resolve('should not reach'))
        .catch((e: Error) => { timeoutError = e })

      // Advance time past timeout
      await vi.advanceTimersByTimeAsync(1001)

      // Wait for the promise to settle
      await timeoutPromise

      expect(timeoutError).toBeDefined()
      expect(timeoutError!.message).toBe('Request timeout after 1000ms')

      // Clean up: resolve the blocking promise
      blockingResolver!()
      await blockingPromise
    })

    it('should not timeout requests that start executing before timeout', async () => {
      const queue = new RequestQueue({ maxConcurrent: 2, timeoutMs: 1000 })
      let resolver: () => void

      // Request that will complete
      const promise = queue.enqueue(() => new Promise<string>((resolve) => {
        resolver = () => resolve('completed')
      }))

      // Advance time but not past timeout
      await vi.advanceTimersByTimeAsync(500)

      // Resolve the request
      resolver!()
      const result = await promise

      expect(result).toBe('completed')
    })

    it('should disable timeout when timeoutMs is 0', async () => {
      const queue = new RequestQueue({ maxConcurrent: 1, timeoutMs: 0 })
      let blockingResolver: () => void

      // Block the queue
      const blockingPromise = queue.enqueue(() => new Promise<void>((resolve) => {
        blockingResolver = resolve
      }))

      // Queue another request
      queue.enqueue(() => Promise.resolve('queued'))

      // Advance time significantly
      await vi.advanceTimersByTimeAsync(100000)

      // Should still be queued, not rejected
      expect(queue.getStats().queued).toBe(1)

      // Clean up
      blockingResolver!()
      await blockingPromise
    })
  })

  describe('getStats', () => {
    it('should return correct initial stats', () => {
      const queue = new RequestQueue({ maxConcurrent: 5 })
      const stats = queue.getStats()

      expect(stats).toEqual({
        active: 0,
        queued: 0,
        maxConcurrent: 5
      })
    })

    it('should track active and queued counts', async () => {
      const queue = new RequestQueue({ maxConcurrent: 2, timeoutMs: 0 })
      const resolvers: Array<() => void> = []

      // Start 4 requests
      for (let i = 0; i < 4; i++) {
        queue.enqueue(() => new Promise<void>((resolve) => {
          resolvers.push(resolve)
        }))
      }

      await vi.runAllTimersAsync()

      expect(queue.getStats()).toEqual({
        active: 2,
        queued: 2,
        maxConcurrent: 2
      })

      // Resolve all to clean up
      resolvers.forEach(r => r())
      await vi.runAllTimersAsync()
    })
  })

  describe('concurrent execution', () => {
    it('should handle burst of requests correctly', async () => {
      const queue = new RequestQueue({ maxConcurrent: 3, timeoutMs: 0 })
      const results: number[] = []

      const promises = Array.from({ length: 10 }, (_, i) =>
        queue.enqueue(async () => {
          results.push(i)
          return i
        })
      )

      const values = await Promise.all(promises)

      expect(values).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
      expect(results.length).toBe(10)
    })

    it('should handle mixed success and failure', async () => {
      const queue = new RequestQueue({ maxConcurrent: 2 })

      const results = await Promise.allSettled([
        queue.enqueue(() => Promise.resolve('success1')),
        queue.enqueue(() => Promise.reject(new Error('error1'))),
        queue.enqueue(() => Promise.resolve('success2')),
        queue.enqueue(() => Promise.reject(new Error('error2')))
      ])

      expect(results[0]).toEqual({ status: 'fulfilled', value: 'success1' })
      expect(results[1]).toEqual({ status: 'rejected', reason: new Error('error1') })
      expect(results[2]).toEqual({ status: 'fulfilled', value: 'success2' })
      expect(results[3]).toEqual({ status: 'rejected', reason: new Error('error2') })
    })
  })
})
