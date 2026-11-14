/**
 * Jurisdiction label helpers
 *
 * Shared vocabulary for the ranking page so counts, titles and headers adapt
 * to whether the user is looking at countries, states/provinces or a mix.
 */

/**
 * Human-readable name for a jurisdiction type (matches the ranking select menu).
 * Example: 'countries' -> 'Countries', 'usa' -> 'U.S. States'
 */
export function getJurisdictionTypeName(jurisdictionType: string): string {
  const names: Record<string, string> = {
    countries: 'Countries',
    countries_states: 'Countries & States',
    usa: 'U.S. States',
    can: 'Canadian Provinces',
    deu: 'German States',
    eu27: 'EU27 Countries',
    af: 'African Countries',
    as: 'Asian Countries',
    eu: 'European Countries',
    na: 'North American Countries',
    oc: 'Oceanian Countries',
    sa: 'South American Countries'
  }
  return names[jurisdictionType] || 'Jurisdictions'
}

/**
 * Singular noun for a single row of the ranking table, chosen to match the
 * selected jurisdiction type (e.g. 'state' for US states, 'jurisdiction' as a
 * neutral fallback).
 */
export function getJurisdictionNoun(
  jurisdictionType: string,
  options: { plural?: boolean } = {}
): string {
  const singular: Record<string, string> = {
    countries: 'country',
    countries_states: 'jurisdiction',
    usa: 'state',
    can: 'province',
    deu: 'state',
    eu27: 'country',
    af: 'country',
    as: 'country',
    eu: 'country',
    na: 'country',
    oc: 'country',
    sa: 'country'
  }

  const base = singular[jurisdictionType] || 'jurisdiction'
  if (!options.plural) return base
  return base.endsWith('y') ? `${base.slice(0, -1)}ies` : `${base}s`
}

/**
 * Plural noun for the ranking table footer ("Showing 1 to 25 of 190 states").
 */
export function getJurisdictionNounPlural(jurisdictionType: string): string {
  return getJurisdictionNoun(jurisdictionType, { plural: true })
}
