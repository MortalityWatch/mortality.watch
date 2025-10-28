/**
 * Date/Period Type Model
 *
 * Phase 8.5.3: Eliminates brittle string array + indexOf pattern
 *
 * Encapsulates date label management and provides smart fallback logic
 * for handling date ranges across different chart types (yearly/monthly/weekly).
 */

export type ChartType = 'yearly' | 'monthly' | 'weekly'

/**
 * Represents a time period for a specific chart type
 * Encapsulates label generation, indexing, and validation
 */
export class ChartPeriod {
  constructor(
    private readonly labels: readonly string[],
    private readonly chartType: ChartType
  ) {
    if (!labels || labels.length === 0) {
      throw new Error('ChartPeriod requires non-empty labels array')
    }
  }

  /**
   * Find index of a date label with smart fallback
   * Returns a valid index even if exact match not found
   */
  indexOf(date: string): number {
    const idx = this.labels.indexOf(date)
    if (idx !== -1) return idx

    // Smart fallback: find closest match by year
    return this.findClosestDateIndex(date)
  }

  /**
   * Get label at index (safe)
   */
  labelAt(index: number): string | undefined {
    return this.labels[index]
  }

  /**
   * Find closest date to given date string
   * Returns index of closest matching date
   */
  findClosestDateIndex(date: string): number {
    const year = date.substring(0, 4)
    const yearMatches = this.labels.filter(l => l.startsWith(year))

    if (yearMatches.length > 0) {
      return this.labels.indexOf(yearMatches[0])
    }

    // Find nearest year
    const targetYear = parseInt(year)
    const availableYears = Array.from(
      new Set(this.labels.map(l => parseInt(l.substring(0, 4))))
    )
    const closestYear = availableYears.reduce((prev, curr) =>
      Math.abs(curr - targetYear) < Math.abs(prev - targetYear) ? curr : prev
    )

    const closestLabel = this.labels.find(l => l.startsWith(closestYear.toString()))
    return closestLabel ? this.labels.indexOf(closestLabel) : 0
  }

  /**
   * Find closest date label (returns the label string)
   */
  findClosestDate(date: string): string {
    const idx = this.findClosestDateIndex(date)
    return this.labels[idx] || this.labels[0]
  }

  /**
   * Create a date range within this period
   */
  createRange(from: string, to: string): DateRange {
    return new DateRange(this, from, to)
  }

  /**
   * Validate if a date range is valid
   */
  isValidRange(from: string, to: string): boolean {
    const fromIdx = this.indexOf(from)
    const toIdx = this.indexOf(to)
    return fromIdx >= 0 && toIdx >= 0 && fromIdx <= toIdx
  }

  /**
   * Get all labels
   */
  get allLabels(): readonly string[] {
    return this.labels
  }

  /**
   * Get first/last labels
   */
  get firstLabel(): string {
    return this.labels[0] ?? ''
  }

  get lastLabel(): string {
    return this.labels[this.labels.length - 1] ?? ''
  }

  /**
   * Get number of labels
   */
  get length(): number {
    return this.labels.length
  }

  /**
   * Check if a date exists in this period
   */
  contains(date: string): boolean {
    return this.labels.includes(date)
  }

  /**
   * Get chart type
   */
  get type(): ChartType {
    return this.chartType
  }
}

/**
 * Represents a date range within a chart period
 */
export class DateRange {
  constructor(
    private readonly period: ChartPeriod,
    public readonly from: string,
    public readonly to: string
  ) {}

  /**
   * Get start index
   */
  get fromIndex(): number {
    return this.period.indexOf(this.from)
  }

  /**
   * Get end index
   */
  get toIndex(): number {
    return this.period.indexOf(this.to)
  }

  /**
   * Get all labels in range (inclusive)
   */
  get labels(): string[] {
    const start = this.fromIndex
    const end = this.toIndex
    return this.period.allLabels.slice(start, end + 1) as string[]
  }

  /**
   * Check if a date is within this range
   */
  contains(date: string): boolean {
    const idx = this.period.indexOf(date)
    return idx >= this.fromIndex && idx <= this.toIndex
  }

  /**
   * Get range length (number of periods)
   */
  get length(): number {
    return this.toIndex - this.fromIndex + 1
  }

  /**
   * Get the period this range belongs to
   */
  get chartPeriod(): ChartPeriod {
    return this.period
  }
}
