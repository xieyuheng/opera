import { defineBasicLoader } from "vue-router/experimental"
import {
  getProviderListState,
  loadProviderListState,
} from "./ProviderListState.ts"

export const useProviderListState = defineBasicLoader(async () => {
  const state = getProviderListState()

  if (state.hasLoaded) {
    void loadProviderListState(state)
    return state
  }

  await loadProviderListState(state)
  return state
})
