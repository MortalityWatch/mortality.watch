/**
 * Circuit Breaker Pattern
 *
 * Protects against cascading failures when calling external services.
 * Implements three states: Closed, Open, Half-Open
 *
 * - Closed: Normal operation, requests pass through
 * - Open: Too many failures, requests fail fast without calling service
 * - Half-Open: After timeout, allow one request to test if service recovered
 */

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, blocking requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

interface CircuitBreakerConfig {
  /**
   * Number of failures before opening the circuit
   */
  failureThreshold: number

  /**
   * Time window for counting failures (milliseconds)
   */
  failureWindow: number

  /**
   * Time to wait before attempting to close circuit (milliseconds)
   */
  resetTimeout: number

  /**
   * Number of successful requests needed to close circuit from half-open
   */
  successThreshold: number
}

interface CircuitStats {
  failures: number
  successes: number
  lastFailure: number | null
  lastSuccess: number | null
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private stats: CircuitStats = {
    failures: 0,
    successes: 0,
    lastFailure: null,
    lastSuccess: null
  }

  private config: CircuitBreakerConfig
  private name: string

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      failureWindow: config.failureWindow ?? 60000, // 1 minute
      resetTimeout: config.resetTimeout ?? 60000, // 1 minute
      successThreshold: config.successThreshold ?? 2
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if we should try half-open
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN
        console.log(`[CircuitBreaker:${this.name}] State: HALF_OPEN (testing service)`)
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.name}. Service unavailable.`)
      }
    }

    try {
      const result = await fn()
      this.recordSuccess()
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }

  /**
   * Record a successful request
   */
  private recordSuccess() {
    this.stats.successes++
    this.stats.lastSuccess = Date.now()

    if (this.state === CircuitState.HALF_OPEN) {
      // Check if we've had enough successes to close the circuit
      if (this.stats.successes >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED
        this.stats.failures = 0
        this.stats.successes = 0
        console.log(`[CircuitBreaker:${this.name}] State: CLOSED (service recovered)`)
      }
    }
  }

  /**
   * Record a failed request
   */
  private recordFailure() {
    const now = Date.now()
    this.stats.failures++
    this.stats.lastFailure = now

    // Reset success count on failure
    this.stats.successes = 0

    // Remove old failures outside the window
    if (this.stats.lastFailure && (now - this.stats.lastFailure > this.config.failureWindow)) {
      this.stats.failures = 1
    }

    // Check if we should open the circuit
    if (this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN) {
      if (this.stats.failures >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN
        console.log(
          `[CircuitBreaker:${this.name}] State: OPEN (${this.stats.failures} failures)`
        )
      }
    }
  }

  /**
   * Check if enough time has passed to attempt reset
   */
  private shouldAttemptReset(): boolean {
    if (!this.stats.lastFailure) return false
    const timeSinceLastFailure = Date.now() - this.stats.lastFailure
    return timeSinceLastFailure >= this.config.resetTimeout
  }

  /**
   * Get current circuit breaker status
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      stats: {
        ...this.stats,
        timeSinceLastFailure: this.stats.lastFailure
          ? Date.now() - this.stats.lastFailure
          : null
      },
      config: this.config
    }
  }

  /**
   * Manually reset the circuit breaker
   */
  reset() {
    this.state = CircuitState.CLOSED
    this.stats = {
      failures: 0,
      successes: 0,
      lastFailure: null,
      lastSuccess: null
    }
    console.log(`[CircuitBreaker:${this.name}] Manually reset to CLOSED`)
  }

  /**
   * Check if circuit is currently open
   */
  isOpen(): boolean {
    return this.state === CircuitState.OPEN && !this.shouldAttemptReset()
  }
}

/**
 * Global circuit breaker for baseline API
 */
export const baselineCircuitBreaker = new CircuitBreaker('BaselineAPI', {
  failureThreshold: 3, // Open after 3 failures
  failureWindow: 30000, // Count failures in 30 second window
  resetTimeout: 60000, // Try again after 1 minute
  successThreshold: 2 // Need 2 successes to close
})
