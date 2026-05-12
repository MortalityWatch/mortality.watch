import { describe, expect, it } from 'vitest'
import { shouldNormalizeLeAgeGroups } from './normalizeLeAgeGroups'

describe('shouldNormalizeLeAgeGroups', () => {
  it('does not normalize non-LE metrics', () => {
    expect(shouldNormalizeLeAgeGroups('cmr', false, ['40-49', '50-59'])).toBe(false)
  })

  it('does not normalize LE when ADVANCED_LE is available', () => {
    expect(shouldNormalizeLeAgeGroups('le', true, ['40-49', '50-59'])).toBe(false)
  })

  it('does not normalize all-ages LE for users without ADVANCED_LE', () => {
    expect(shouldNormalizeLeAgeGroups('le', false, ['all'])).toBe(false)
  })

  it('normalizes single-age-group LE for users without ADVANCED_LE', () => {
    expect(shouldNormalizeLeAgeGroups('le', false, ['50-59'])).toBe(true)
  })

  it('normalizes multi-age-group LE for users without ADVANCED_LE', () => {
    expect(shouldNormalizeLeAgeGroups('le', false, ['40-49', '50-59'])).toBe(true)
  })

  it('normalizes empty LE age-group selection for users without ADVANCED_LE', () => {
    expect(shouldNormalizeLeAgeGroups('le', false, [])).toBe(true)
  })
})
