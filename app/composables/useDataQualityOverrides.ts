/**
 * Data Quality Overrides Composable
 *
 * Data quality page composable
 *
 * Provides:
 * - Override status management (monitor/muted/hidden)
 * - Individual country override updates
 * - Bulk jurisdiction override updates
 * - Override status helpers and icons
 *
 * This separates override management concerns from the page component,
 * making the code more modular and testable.
 */

import type { ComputedRef } from 'vue'
import type { CountryQuality } from './useDataQualityFilters'
import { logger } from '@/lib/logger'

export type OverrideStatus = 'monitor' | 'muted' | 'hidden'

export interface OverrideStatusCounts {
  monitor: number
  muted: number
  hidden: number
}

export function useDataQualityOverrides(
  filteredCountries: ComputedRef<CountryQuality[]>
) {
  // Update override status for a single country
  const updateOverrideStatus = async (
    country: CountryQuality,
    newStatus: OverrideStatus
  ) => {
    try {
      await $fetch('/api/admin/data-quality-override', {
        method: 'POST',
        body: {
          iso3c: country.iso3c,
          source: country.dataSource,
          status: newStatus
        }
      })

      // Update local state
      country.overrideStatus = newStatus

      // Show toast notification
      useToast().add({
        title: 'Override updated',
        description: `${country.jurisdiction} (${country.dataSource}) is now ${newStatus}`,
        color: 'success'
      })
    } catch (err) {
      logger.error('Failed to update override', err)
      useToast().add({
        title: 'Error',
        description: 'Failed to update override status',
        color: 'error'
      })
    }
  }

  // Cycle through override statuses: monitor -> muted -> hidden -> monitor
  const cycleOverrideStatus = (country: CountryQuality) => {
    let nextStatus: OverrideStatus

    switch (country.overrideStatus) {
      case 'monitor':
        nextStatus = 'muted'
        break
      case 'muted':
        nextStatus = 'hidden'
        break
      case 'hidden':
        nextStatus = 'monitor'
        break
    }

    updateOverrideStatus(country, nextStatus)
  }

  // Get status counts for a jurisdiction
  const getStatusCounts = (jurisdiction: string): OverrideStatusCounts => {
    const entries = filteredCountries.value.filter(c => c.jurisdiction === jurisdiction)
    return {
      monitor: entries.filter(e => e.overrideStatus === 'monitor').length,
      muted: entries.filter(e => e.overrideStatus === 'muted').length,
      hidden: entries.filter(e => e.overrideStatus === 'hidden').length
    }
  }

  // Get the most common override status for a jurisdiction
  const getMostCommonOverrideStatus = (jurisdiction: string): OverrideStatus => {
    const entries = filteredCountries.value.filter(c => c.jurisdiction === jurisdiction)

    if (entries.length === 0) return 'monitor'

    const statusCounts = getStatusCounts(jurisdiction)

    let currentStatus: OverrideStatus = 'monitor'
    let maxCount = statusCounts.monitor

    if (statusCounts.muted > maxCount) {
      currentStatus = 'muted'
      maxCount = statusCounts.muted
    }
    if (statusCounts.hidden > maxCount) {
      currentStatus = 'hidden'
    }

    return currentStatus
  }

  // Cycle override status for all sources in a jurisdiction
  const cycleJurisdictionOverride = (jurisdiction: string) => {
    const entries = filteredCountries.value.filter(c => c.jurisdiction === jurisdiction)

    if (entries.length === 0) return

    // Determine the most common current status
    const currentStatus = getMostCommonOverrideStatus(jurisdiction)

    // Determine next status
    let nextStatus: OverrideStatus

    switch (currentStatus) {
      case 'monitor':
        nextStatus = 'muted'
        break
      case 'muted':
        nextStatus = 'hidden'
        break
      case 'hidden':
        nextStatus = 'monitor'
        break
    }

    // Apply to all entries
    entries.forEach((entry) => {
      updateOverrideStatus(entry, nextStatus)
    })
  }

  // Get override status icon
  const getOverrideIcon = (status: OverrideStatus): string => {
    switch (status) {
      case 'monitor':
        return 'i-lucide-bell'
      case 'muted':
        return 'i-lucide-bell-off'
      case 'hidden':
        return 'i-lucide-eye-off'
    }
  }

  return {
    // Functions
    updateOverrideStatus,
    cycleOverrideStatus,
    cycleJurisdictionOverride,

    // Helpers
    getStatusCounts,
    getMostCommonOverrideStatus,
    getOverrideIcon
  }
}
