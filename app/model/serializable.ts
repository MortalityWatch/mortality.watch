import type { LocationQuery } from 'vue-router'

export interface Serializable {
  initFromSavedState(locationQuery: LocationQuery): Promise<void>
}

export { decodeBool, decodeString } from '../lib/state'
