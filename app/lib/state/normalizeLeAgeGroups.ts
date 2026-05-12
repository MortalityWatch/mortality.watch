/**
 * Life expectancy age-group normalization for users without ADVANCED_LE access.
 *
 * Logged-out users can arrive on LE charts carrying age-group selections from
 * other metrics (for example via URL params or metric switching). Because the
 * LE age-group control is hidden for them, we must normalize back to all-ages
 * LE to avoid leaving the UI in a hidden invalid state.
 */

export function shouldNormalizeLeAgeGroups(
  type: string,
  hasAdvancedLEAccess: boolean,
  ageGroups: string[]
): boolean {
  if (type !== 'le') return false
  if (hasAdvancedLEAccess) return false
  if (ageGroups.length !== 1) return true
  return ageGroups[0] !== 'all'
}
