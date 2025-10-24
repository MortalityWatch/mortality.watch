/**
 * Get country filter options from runtime config
 * Returns empty array during SSR, actual filter on client
 */
export function useCountryFilter() {
  // During SSR, don't filter (for SEO and initial render)
  if (import.meta.server) {
    return { filterCountries: [] }
  }

  // Client-side only
  const config = useRuntimeConfig()
  const useLocalCacheOnly = config.public.useLocalCache === 'true'
  const devCountriesStr = config.public.devCountries as string
  const devCountries = devCountriesStr
    ? devCountriesStr.split(',').map(c => c.trim()).filter(c => c)
    : []

  // Only filter if in local cache mode AND dev countries are specified
  const filterCountries = useLocalCacheOnly && devCountries.length > 0 ? devCountries : []

  return { filterCountries }
}
