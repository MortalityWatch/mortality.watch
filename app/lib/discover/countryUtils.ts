/**
 * Country Utilities for Discovery Feature
 *
 * Shared utilities for handling country codes, flags, and sub-national regions.
 */

import isoCountries from 'i18n-iso-countries'

/**
 * Get ISO2 code for a country, handling sub-national regions
 */
export function getIso2Code(iso3c: string): string | null {
  // Handle sub-national regions
  if (iso3c.startsWith('USA-')) return 'us'
  if (iso3c.startsWith('CAN-')) return 'ca'
  if (iso3c.startsWith('DEU-')) return 'de'

  // Handle UK special cases
  if (iso3c === 'GBRTENW') return 'gb'
  if (iso3c === 'GBR_SCO') return 'gb'
  if (iso3c === 'GBR_NIR') return 'gb'

  // Standard ISO3 to ISO2 conversion
  return isoCountries.alpha3ToAlpha2(iso3c)?.toLowerCase() || null
}

/**
 * Convert ISO2 country code to flag emoji
 */
export function getFlagEmojiFromCode(code: string): string {
  if (!code || code.length !== 2) return ''
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

/**
 * Get flag emoji for any country code (ISO3 or sub-national)
 */
export function getFlagEmoji(iso3c: string): string {
  const iso2 = getIso2Code(iso3c)
  return iso2 ? getFlagEmojiFromCode(iso2) : ''
}

/**
 * Check if a country code is a sub-national region
 */
export function isSubNationalRegion(iso3c: string): boolean {
  return (
    iso3c.startsWith('USA-')
    || iso3c.startsWith('CAN-')
    || iso3c.startsWith('DEU-')
  )
}

/**
 * Get parent country code for sub-national regions
 */
export function getParentCountry(iso3c: string): string | null {
  if (iso3c.startsWith('USA-')) return 'USA'
  if (iso3c.startsWith('CAN-')) return 'CAN'
  if (iso3c.startsWith('DEU-')) return 'DEU'
  return null
}
