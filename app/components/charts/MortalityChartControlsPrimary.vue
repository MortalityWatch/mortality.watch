<script setup lang="ts">
import type { Country } from '@/model'
import { computed, toRaw } from 'vue'
import { showToast } from '../../toast'

// Feature access for LE single age groups (Pro feature)
const { can } = useFeatureAccess()
const canAdvancedLE = can('ADVANCED_LE')

const props = defineProps<{
  allCountries: Record<string, Country>
  allAgeGroups: string[]
  countries: string[]
  ageGroups: string[]
  isAsmrType: boolean
  isLifeExpectancyType: boolean
  isAsdType: boolean
  isUpdating: boolean
  maxCountriesAllowed: number | undefined
}>()

const emit = defineEmits(['countriesChanged', 'ageGroupsChanged'])

type ChipColor = 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'
type ChipSize = '2xl' | 'md' | '3xs' | '2xs' | 'xs' | 'sm' | 'lg' | 'xl' | '3xl'

type CountryOption = {
  label: string
  value: string
  hasAsmr: boolean
  ageGroups?: string[]
  disabled?: boolean
  icon?: string
  chip?: {
    text: string
    color?: ChipColor
    size?: ChipSize
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

const removeCountry = (value: string) => {
  const filtered = props.countries.filter(c => c !== value)
  emit('countriesChanged', filtered)
}

const removeAgeGroup = (value: string) => {
  const filtered = props.ageGroups.filter(ag => ag !== value)
  emit('ageGroupsChanged', filtered)
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
      <USelectMenu
        v-model="selectedCountries"
        :items="options"
        multiple
        size="sm"
        class="flex-1"
        clear
        :disabled="props.isUpdating"
        :ui="{ base: 'h-auto min-h-8 py-1' }"
        @update:model-value="handleCountryChange"
      >
        <template #default="{ modelValue }">
          <div
            v-if="modelValue?.length"
            class="flex flex-wrap gap-0.5"
          >
            <UBadge
              v-for="item in modelValue"
              :key="typeof item === 'string' ? item : item.value"
              size="xs"
              variant="subtle"
              color="neutral"
            >
              {{ typeof item === 'string' ? item : item.label }}
              <UIcon
                name="i-lucide-x"
                class="ml-0.5 size-3 cursor-pointer opacity-60 hover:opacity-100"
                @click.stop="removeCountry(typeof item === 'string' ? item : item.value)"
              />
            </UBadge>
          </div>
          <span
            v-else
            class="text-dimmed"
          >Select jurisdictions</span>
        </template>
        <template #item-leading="{ item }">
          <UBadge
            v-if="item && typeof item === 'object' && 'chip' in item && item.chip"
            :color="(item.chip as { color?: ChipColor }).color"
            size="xs"
            variant="subtle"
          >
            {{ (item.chip as { text: string }).text }}
          </UBadge>
        </template>
      </USelectMenu>
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
      v-if="!props.isAsmrType && !props.isAsdType && (!props.isLifeExpectancyType || canAdvancedLE)"
      label="Age Groups"
    >
      <USelectMenu
        v-model="selectedAgeGroups"
        :items="ageGroupOptions"
        placeholder="Select age groups"
        multiple
        size="sm"
        class="flex-1"
        clear
        :disabled="props.isUpdating"
        :ui="{ base: 'h-auto min-h-8 py-1' }"
        @update:model-value="handleAgeGroupChange"
      >
        <template #default="{ modelValue }">
          <div
            v-if="modelValue?.length"
            class="flex flex-wrap gap-0.5"
          >
            <UBadge
              v-for="item in modelValue"
              :key="typeof item === 'string' ? item : item.value"
              size="xs"
              variant="subtle"
              color="neutral"
            >
              {{ typeof item === 'string' ? item : item.label }}
              <UIcon
                name="i-lucide-x"
                class="ml-0.5 size-3 cursor-pointer opacity-60 hover:opacity-100"
                @click.stop="removeAgeGroup(typeof item === 'string' ? item : item.value)"
              />
            </UBadge>
          </div>
          <span
            v-else
            class="text-dimmed"
          >Select age groups</span>
        </template>
      </USelectMenu>
    </UiControlRow>
  </div>
</template>
