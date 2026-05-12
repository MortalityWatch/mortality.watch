/**
 * Life Expectancy Unavailability Reasons
 *
 * The data pipeline publishes an optional `le_unavailable_reason` column on
 * LE-bearing mortality rows. When present, it identifies why life expectancy
 * could not be computed for a given jurisdiction. When LE is computable the
 * column is absent/NA.
 *
 * Keep this mapping in sync with the reason strings emitted by the data repo
 * (MortalityWatch/data). Unknown reason values fall back to a generic message
 * so new values from the pipeline never leak through as raw keys.
 */

/**
 * Known reason strings emitted by the data pipeline.
 * Extend this union when new reasons are added in the data repo.
 */
export type LeUnavailableReason
  = | 'first_age_group_too_broad'

const REASON_MESSAGES: Record<LeUnavailableReason, string> = {
  first_age_group_too_broad:
    'LE not computable: source publishes only a broad first age group '
    + '(e.g. `0-64`), which is too coarse for reliable life-expectancy calculation.'
}

const FALLBACK_MESSAGE = 'LE not available for this jurisdiction'

/**
 * Convert a raw `le_unavailable_reason` string from the data pipeline into a
 * human-readable explanation suitable for display in the UI.
 *
 * Unknown or missing reason values fall back to a generic message so that a
 * future reason string from the pipeline does not render as a raw key.
 *
 * @param reason - Raw reason string from the data row, or undefined
 * @returns Human-readable explanation
 */
export function describeLeUnavailableReason(reason: string | undefined | null): string {
  if (!reason) return FALLBACK_MESSAGE
  if (Object.prototype.hasOwnProperty.call(REASON_MESSAGES, reason)) {
    return REASON_MESSAGES[reason as LeUnavailableReason]
  }
  return FALLBACK_MESSAGE
}

/**
 * Returns true when the given value is a non-empty reason string.
 * The data pipeline emits the column as NA/empty when LE is computable.
 */
export function hasLeUnavailableReason(reason: string | undefined | null): reason is string {
  return typeof reason === 'string' && reason.length > 0
}
