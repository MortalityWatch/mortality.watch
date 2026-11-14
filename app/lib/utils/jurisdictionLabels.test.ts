import { describe, expect, it } from 'vitest'
import {
  getJurisdictionNoun,
  getJurisdictionNounPlural,
  getJurisdictionTypeName
} from './jurisdictionLabels'

describe('jurisdictionLabels', () => {
  describe('getJurisdictionTypeName', () => {
    it('returns display names matching the select menu', () => {
      expect(getJurisdictionTypeName('countries')).toBe('Countries')
      expect(getJurisdictionTypeName('countries_states')).toBe('Countries & States')
      expect(getJurisdictionTypeName('usa')).toBe('U.S. States')
      expect(getJurisdictionTypeName('can')).toBe('Canadian Provinces')
      expect(getJurisdictionTypeName('deu')).toBe('German States')
    })

    it('falls back to a neutral label for unknown types', () => {
      expect(getJurisdictionTypeName('nope')).toBe('Jurisdictions')
    })
  })

  describe('getJurisdictionNoun', () => {
    it('uses country for country-level selections', () => {
      expect(getJurisdictionNoun('countries')).toBe('country')
      expect(getJurisdictionNoun('eu27')).toBe('country')
      expect(getJurisdictionNoun('na')).toBe('country')
    })

    it('uses state/province for sub-national selections', () => {
      expect(getJurisdictionNoun('usa')).toBe('state')
      expect(getJurisdictionNoun('deu')).toBe('state')
      expect(getJurisdictionNoun('can')).toBe('province')
    })

    it('is neutral for mixed selections and unknown types', () => {
      expect(getJurisdictionNoun('countries_states')).toBe('jurisdiction')
      expect(getJurisdictionNoun('mystery')).toBe('jurisdiction')
    })
  })

  describe('getJurisdictionNounPlural', () => {
    it('pluralizes regular nouns', () => {
      expect(getJurisdictionNounPlural('countries')).toBe('countries')
      expect(getJurisdictionNounPlural('usa')).toBe('states')
      expect(getJurisdictionNounPlural('can')).toBe('provinces')
      expect(getJurisdictionNounPlural('countries_states')).toBe('jurisdictions')
    })
  })
})
