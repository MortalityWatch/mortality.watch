<script setup lang="ts">
import { type ListType, Country } from '@/model'
import { getByValue } from '@/utils'
import { computed, toRaw } from 'vue'
import { showToast } from '../../toast'
import { IftaLabel, MultiSelect } from 'primevue'

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
  title: string
  hasAsmr: boolean
  ageGroups?: string[]
  $isDisabled?: boolean
}

const getCountryList = (
  allCountries: Record<string, Country>,
  ageGroups: string[]
): CountryOption[] => {
  const result: CountryOption[] = []
  for (const country of Object.values(allCountries)) {
    const countryAgs = country.age_groups()
    const allInSet = ageGroups.every((ag) => countryAgs.has(ag))
    result.push({
      title: country.jurisdiction,
      hasAsmr: country.age_groups().size > 1,
      ageGroups: !props.isAsmrType
        ? Array.from(countryAgs).filter((x) => x !== 'all')
        : undefined,
      $isDisabled: !allInSet
    })
  }
  return result
}

const selectedCountries = computed({
  get: () => {
    return options.value.filter((opt) =>
      Object.entries(props.allCountries).some(
        ([iso3c, country]) =>
          country.jurisdiction === opt.title && props.countries.includes(iso3c)
      )
    )
  },
  set: (val: CountryOption[]) => {
    const countries: string[] = []
    for (const option of val) {
      const kv: Record<string, string> = {}
      Object.entries(props.allCountries).forEach(
        ([k]) => (kv[k] = props.allCountries[k].jurisdiction)
      )
      const v = getByValue(kv, option.title)
      if (v) countries.push(v)
    }
    emit('countriesChanged', countries)
  }
})

const selectedAgeGroups = computed({
  get: () =>
    ageGroups.value
      .filter((v) => props.ageGroups.includes(v))
      .map((v) => ({ name: v, value: v })),
  set: (val: ListType[]) => {
    emit(
      'ageGroupsChanged',
      val.map((v) => v.value)
    )
  }
})

const countrySelected = (c: CountryOption) => {
  if (props.isAsmrType && !c.hasAsmr) {
    showToast(`No ASMR data for ${c.title} available, consider using CMR.`)
  }
}

const ageGroupSelected = (c: ListType) => {
  const countriesToRemove: string[] = []
  const selectedCountries = props.countries
  for (const country of selectedCountries) {
    const countryAgs = props.allCountries[country].age_groups()
    if (!countryAgs.has(c.value)) countriesToRemove.push(country)
  }
  if (countriesToRemove.length) {
    emit(
      'countriesChanged',
      selectedCountries.filter((x) => !countriesToRemove.includes(x))
    )
    showToast(
      `Due to missing data for selected age groups, ` +
        `some jurisdictions have been automatically unselected.`
    )
  }
}

const ageGroups = computed(() => props.allAgeGroups)

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
  <IftaLabel class="mb-0">
    <MultiSelect
      display="chip"
      filter
      v-model="selectedCountries"
      :options="options"
      optionLabel="title"
      placeholder="Select Jurisdictions"
      :maxSelectedLabels="props.maxCountriesAllowed"
      class="w-full pt-5"
      :disabled="props.isUpdating"
      @change="(e) => countrySelected(e.value?.[0])"
    >
      <template #dropdownicon="{ class: iconClass }">
        <i :class="['pi pi-chevron-down', iconClass]"></i>
      </template>

      <template v-slot:option="{ option }">
        <span>{{ option.title }}</span>
        <span
          class="ml-2 inline-block rounded bg-green-600 px-2 py-0.5 text-xs font-semibold text-white"
          v-if="option.hasAsmr"
          >ASMR</span
        >
        <span
          class="ml-1 inline-block rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white"
          v-if="option.hasAsmr"
          >LE</span
        >
      </template>
    </MultiSelect>
    <label for="ms_cities">Jurisdictions</label>
  </IftaLabel>

  <div
    id="age-group-select"
    class="column mt-4"
    v-show="!props.isAsmrType && !props.isLifeExpectancyType"
  >
    <IftaLabel class="mb-0">
      <MultiSelect
        id="ageGroup"
        class="w-full"
        placeholder="Select the age group"
        v-model="selectedAgeGroups"
        :options="ageGroups"
        optionLabel="name"
        :multiple="true"
        :allow-empty="false"
        display="chip"
        :disabled="props.isUpdating"
        @change="(e) => ageGroupSelected(e.value?.[0])"
      />
      <label for="ageGroup">Age Groups</label>
    </IftaLabel>
  </div>
</template>
