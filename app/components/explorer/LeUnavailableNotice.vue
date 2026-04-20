<script setup lang="ts">
/**
 * Inline notice surfacing why life expectancy is unavailable for one or more
 * of the active jurisdictions. Reads the per-row `le_unavailable_reason`
 * column produced by the data pipeline (see MortalityWatch/data#15).
 *
 * Renders nothing when:
 * - the LE metric is not selected, or
 * - no active jurisdiction carries a reason (the typical case once LE
 *   is computable for every selection).
 *
 * Defensive shipping: the column won't appear in published data until the
 * companion data PR merges and the cron republishes; this component is a
 * graceful no-op until then.
 */

import { computed } from 'vue'
import type { Country } from '@/model'
import { describeLeUnavailableReason } from '@/lib/le/unavailableReason'

const props = defineProps<{
  /** Whether the active metric is Life Expectancy */
  isLifeExpectancyType: boolean
  /** Map of country ISO3C → raw `le_unavailable_reason` from the dataset */
  reasons: Map<string, string>
  /** All countries metadata for jurisdiction-name lookup */
  allCountries: Record<string, Country>
}>()

const getJurisdictionName = (iso3c: string): string =>
  props.allCountries[iso3c]?.jurisdiction || iso3c

interface NoticeRow {
  iso3c: string
  jurisdiction: string
  message: string
}

const notices = computed<NoticeRow[]>(() => {
  if (!props.isLifeExpectancyType) return []
  const rows: NoticeRow[] = []
  for (const [iso3c, reason] of props.reasons) {
    rows.push({
      iso3c,
      jurisdiction: getJurisdictionName(iso3c),
      message: describeLeUnavailableReason(reason)
    })
  }
  return rows.sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction))
})
</script>

<template>
  <div
    v-if="notices.length > 0"
    class="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100"
    role="note"
    data-testid="le-unavailable-notice"
  >
    <div class="font-medium mb-1">
      Life expectancy unavailable
    </div>
    <ul class="space-y-1">
      <li
        v-for="notice in notices"
        :key="notice.iso3c"
      >
        <span class="font-medium">{{ notice.jurisdiction }}:</span>
        {{ notice.message }}
      </li>
    </ul>
  </div>
</template>
