import { defineBasicLoader } from "vue-router/experimental"

import {
  getSessionDustbinState,
  loadSessionDustbin,
} from "./SessionDustbinState.ts"

export const useSessionDustbinState = defineBasicLoader(async (to) => {
  const workspaceId = String(to.params.workspaceId ?? "")
  const state = getSessionDustbinState(workspaceId)

  if (state.hasLoaded) {
    void loadSessionDustbin(state)
    return state
  }

  await loadSessionDustbin(state)
  return state
})
