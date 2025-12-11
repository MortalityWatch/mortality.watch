<script setup lang="ts">
import type { Country } from '@/model'
import { computed, toRaw } from 'vue'
import { showToast } from '../../toast'

const props = defineProps<{
  allCountries: Record<string, Country>
  allAgeGroups: string[]
  countries: string[]
  ageGroups: string[]
  isAsmrType: boolean
  isLifeExpectancyType: boolean
  isUpdating: boolean
  maxCountriesAllowed: number | undefined
}>()

const emit = defineEmits(['countriesChanged', 'ageGroupsChanged'])

type CountryOption = {
  label: string
  value: string
  hasAsmr: boolean
  ageGroups?: string[]
  disabled?: boolean
  icon?: string
  chip?: {
    text: string
    color?: string
    size?: string
  }
}

const getCountryList = (
  allCountries: Record<string, Country>,
  ageGroups: string[]
): CountryOption[] => {
  const result: CountryOption[] = []
  for (const [iso3c, country] of Object.entries(allCountries)) {
    const countryAgs = country.age_groups()
    const allInSet = ageGroups.every(ag => countryAgs.has(ag))
    const hasAsmr = country.age_groups().size > 1

    // Disable countries that don't have the data type we need
    const needsAsmr = props.isAsmrType || props.isLifeExpectancyType
    const isDisabled = !allInSet || (needsAsmr && !hasAsmr)

    // Add badge chip to show data type availability
    let chip: CountryOption['chip'] | undefined
    if (hasAsmr) {
      chip = {
        text: 'Stratified',
        color: 'primary',
        size: '2xs'
      }
    } else {
      chip = {
        text: 'All-ages',
        color: 'neutral',
        size: '2xs'
      }
    }

    result.push({
      label: country.jurisdiction,
      value: iso3c,
      hasAsmr,
      ageGroups: !props.isAsmrType
        ? Array.from(countryAgs).filter(x => x !== 'all')
        : undefined,
      disabled: isDisabled,
      // Don't set icon - we'll use custom slot instead
      chip
    })
  }
  return result
}

const selectedCountries = computed({
  get: () => {
    // Map ISO3C codes to full option objects for display
    return props.countries.map(iso3c =>
      options.value.find(opt => opt.value === iso3c)
    ).filter((opt): opt is CountryOption => opt !== undefined)
  },
  set: (val: string[]) => {
    emit('countriesChanged', val)
  }
})

const selectedAgeGroups = computed({
  get: () => {
    // Map age group strings to full option objects for display
    return props.ageGroups.map(ag =>
      ageGroupOptions.value.find(opt => opt.value === ag)
    ).filter((opt): opt is { label: string, value: string } => opt !== undefined)
  },
  set: (val: string[]) => {
    emit('ageGroupsChanged', val)
  }
})

interface SelectOption {
  label: string
  value: string
  [key: string]: unknown
}

type SelectValue = string | SelectOption | (string | SelectOption)[] | null | undefined

const extractStringValues = (val: SelectValue): string[] => {
  if (!val) return []
  if (Array.isArray(val)) {
    return val.map(v => typeof v === 'string' ? v : (v as SelectOption).value)
  }
  return []
}

const handleCountryChange = (val: SelectValue) => {
  const countries = extractStringValues(val)
  selectedCountries.value = countries
  const lastSelected = countries[countries.length - 1]
  if (lastSelected) {
    const option = options.value.find(opt => opt.value === lastSelected)
    if (option && props.isAsmrType && !option.hasAsmr) {
      showToast(`No ASMR data for ${option.label} available, consider using CMR.`)
    }
  }
}

const handleAgeGroupChange = (val: SelectValue) => {
  const ageGroups = extractStringValues(val)
  selectedAgeGroups.value = ageGroups
  const lastSelected = ageGroups[ageGroups.length - 1]
  if (lastSelected) {
    const countriesToRemove: string[] = []
    const currentCountries = props.countries
    for (const country of currentCountries) {
      const countryAgs = props.allCountries[country]?.age_groups()
      if (!countryAgs?.has(lastSelected)) countriesToRemove.push(country)
    }
    if (countriesToRemove.length) {
      emit(
        'countriesChanged',
        currentCountries.filter(x => !countriesToRemove.includes(x))
      )
      showToast(
        `Due to missing data for selected age groups, `
        + `some jurisdictions have been automatically unselected.`
      )
    }
  }
}

const ageGroupOptions = computed(() =>
  props.allAgeGroups.map(ag => ({ label: ag, value: ag }))
)

// Computed
const options = computed(() => {
  const countries = toRaw(props.allCountries) as unknown as Record<
    string,
    Country
  >
  return getCountryList(countries, props.ageGroups)
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiControlRow
      label="Jurisdictions"
      help-title="Data Availability"
      :help-warning="props.isAsmrType || props.isLifeExpectancyType"
    >
      <UInputMenu
        v-model="selectedCountries"
        :items="options"
        multiple
        searchable
        size="sm"
        class="flex-1"
        delete-icon="i-lucide-x"
        :disabled="props.isUpdating"
        @update:model-value="handleCountryChange"
      >
        <template #item-leading="{ item }">
          <UBadge
            v-if="item.chip"
            :color="item.chip.color"
            size="xs"
            variant="subtle"
          >
            {{ item.chip.text }}
          </UBadge>
        </template>
      </UInputMenu>
      <template #help>
        <div class="space-y-3">
          <!-- Warning for restricted views -->
          <div
            v-if="props.isAsmrType || props.isLifeExpectancyType"
            class="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md"
          >
            <UIcon
              name="i-lucide-alert-circle"
              class="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5"
            />
            <div class="text-xs text-amber-800 dark:text-amber-200">
              <p class="font-medium">
                Age-stratified data required
              </p>
              <p class="text-amber-700 dark:text-amber-300 mt-0.5">
                Only jurisdictions with {{ props.isAsmrType ? 'ASMR' : 'LE' }} badges are available in {{ props.isAsmrType ? 'ASMR' : 'Life Expectancy' }} view.
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <UBadge
                color="primary"
                size="xs"
                variant="subtle"
              >
                {{ props.isAsmrType ? 'ASMR' : props.isLifeExpectancyType ? 'LE' : 'ASMR' }}
              </UBadge>
              <span class="font-medium">
                {{ props.isAsmrType ? 'Age-Standardized Mortality Rate' : props.isLifeExpectancyType ? 'Life Expectancy' : 'Age-Standardized Mortality Rate' }}
              </span>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400 ml-1">
              Age-stratified data available. Required for ASMR and Life Expectancy views.
            </p>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <UBadge
                color="neutral"
                size="xs"
                variant="subtle"
              >
                CMR
              </UBadge>
              <span class="font-medium">Crude Mortality Rate</span>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400 ml-1">
              All-ages data only. Not available for ASMR or Life Expectancy views.
            </p>
          </div>
        </div>
      </template>
    </UiControlRow>

    <UiControlRow
      v-if="!props.isAsmrType && !props.isLifeExpectancyType"
      label="Age Groups"
    >
      <UInputMenu
        v-model="selectedAgeGroups"
        :items="ageGroupOptions"
        placeholder="Select age groups"
        multiple
        searchable
        size="sm"
        class="flex-1"
        delete-icon="i-lucide-x"
        :disabled="props.isUpdating"
        @update:model-value="handleAgeGroupChange"
      />
    </UiControlRow>
  </div>
</template>
