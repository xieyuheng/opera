import { defineBasicLoader } from "vue-router/experimental"

import { getHomeState, loadHomeState } from "./HomeState.ts"

export const useHomeState = defineBasicLoader(async () => {
  const state = getHomeState()

  if (state.hasLoaded) {
    void loadHomeState(state)
    return state
  }

  await loadHomeState(state)
  return state
})
