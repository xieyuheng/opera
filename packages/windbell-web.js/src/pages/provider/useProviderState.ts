import { defineBasicLoader } from "vue-router/experimental"
import { getProviderState, loadProviderState } from "./ProviderState.ts"

export const useProviderState = defineBasicLoader(async (to) => {
  const providerName = String(to.params.providerName ?? "")
  const state = getProviderState(providerName)

  if (state.hasLoaded) {
    void loadProviderState(state)
    return state
  }

  await loadProviderState(state)
  return state
})
