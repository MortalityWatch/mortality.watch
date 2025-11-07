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
    const isDisabled = !allInSet
      || (props.isAsmrType && !hasAsmr)
      || (props.isLifeExpectancyType && !hasAsmr)

    const iconName = hasAsmr ? 'i-lucide-layers' : 'i-lucide-circle'

    result.push({
      label: country.jurisdiction,
      value: iso3c,
      hasAsmr,
      ageGroups: !props.isAsmrType
        ? Array.from(countryAgs).filter(x => x !== 'all')
        : undefined,
      disabled: isDisabled,
      icon: iconName
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
    >
      <UInputMenu
        v-model="selectedCountries"
        :items="options"
        :icon="selectedCountries.length === 1 ? selectedCountries[0]?.icon : undefined"
        multiple
        searchable
        size="sm"
        class="flex-1"
        delete-icon="i-lucide-x"
        :disabled="props.isUpdating"
        option-icon="icon"
        @update:model-value="handleCountryChange"
      />
      <template #help>
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <UIcon
              name="i-lucide-layers"
              class="w-4 h-4"
            />
            <span>Age-stratified data available</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <UIcon
              name="i-lucide-circle"
              class="w-4 h-4"
            />
            <span>All-ages data only</span>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            Age-stratified data is required for ASMR and Life Expectancy metrics
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
