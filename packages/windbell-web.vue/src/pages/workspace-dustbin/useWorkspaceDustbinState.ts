import { defineBasicLoader } from "vue-router/experimental"

import {
  getWorkspaceDustbinState,
  loadWorkspaceDustbin,
} from "./WorkspaceDustbinState.ts"

export const useWorkspaceDustbinState = defineBasicLoader(async () => {
  const state = getWorkspaceDustbinState()

  if (state.hasLoaded) {
    void loadWorkspaceDustbin(state)
    return state
  }

  await loadWorkspaceDustbin(state)
  return state
})
