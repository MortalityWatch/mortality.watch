import {
  eu27,
  africa,
  asia,
  europe,
  northAmerica,
  oceania,
  southAmerica
} from '@/model'

/**
 * Composable for filtering countries by jurisdiction type
 * Handles regions, states, and country groups
 */
export function useJurisdictionFilter() {
  /**
   * Determine if a country should be shown based on jurisdiction type
   * @param iso3c - ISO 3166-1 alpha-3 country code
   * @param jurisdictionType - Type of jurisdiction filter to apply
   * @returns true if country should be shown, false otherwise
   */
  function shouldShowCountry(iso3c: string, jurisdictionType: string): boolean {
    const isUSAState = iso3c.startsWith('USA-')
    const isCANState = iso3c.startsWith('CAN-')
    const isDEUState = iso3c.startsWith('DEU-')

    switch (jurisdictionType) {
      case 'countries':
        return !isUSAState && !isDEUState && !isCANState
      case 'countries_states':
        return true
      case 'usa':
        return isUSAState
      case 'can':
        return isCANState
      case 'eu27':
        return eu27.includes(iso3c)
      case 'af':
        return africa.includes(iso3c)
      case 'as':
        return asia.includes(iso3c)
      case 'eu':
        return europe.includes(iso3c)
      case 'na':
        return northAmerica.includes(iso3c)
      case 'oc':
        return oceania.includes(iso3c)
      case 'sa':
        return southAmerica.includes(iso3c)
      case 'deu':
        return isDEUState
      default:
        return false
    }
  }

  return {
    shouldShowCountry
  }
}
