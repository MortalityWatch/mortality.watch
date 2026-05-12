import { describe, it, expect } from 'vitest'
import {
  describeLeUnavailableReason,
  hasLeUnavailableReason
} from './unavailableReason'

describe('describeLeUnavailableReason', () => {
  it('describes the known "first_age_group_too_broad" reason', () => {
    const message = describeLeUnavailableReason('first_age_group_too_broad')
    expect(message).toMatch(/broad first age group/i)
    expect(message).toContain('0-64')
    // Must not leak the raw key into the UI
    expect(message).not.toContain('first_age_group_too_broad')
  })

  it('falls back to a generic message for unknown reasons', () => {
    const message = describeLeUnavailableReason('some_future_reason_we_dont_know')
    expect(message).toBe('LE not available for this jurisdiction')
  })

  it('falls back to a generic message for undefined / missing reason', () => {
    expect(describeLeUnavailableReason(undefined)).toBe('LE not available for this jurisdiction')
    expect(describeLeUnavailableReason(null)).toBe('LE not available for this jurisdiction')
    expect(describeLeUnavailableReason('')).toBe('LE not available for this jurisdiction')
  })
})

describe('hasLeUnavailableReason', () => {
  it('returns true for non-empty strings', () => {
    expect(hasLeUnavailableReason('first_age_group_too_broad')).toBe(true)
    expect(hasLeUnavailableReason('anything')).toBe(true)
  })

  it('returns false for empty / nullish values', () => {
    expect(hasLeUnavailableReason('')).toBe(false)
    expect(hasLeUnavailableReason(undefined)).toBe(false)
    expect(hasLeUnavailableReason(null)).toBe(false)
  })
})
