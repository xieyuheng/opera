import { defineBasicLoader } from "vue-router/experimental"
import { getSessionState, loadSessionState } from "./SessionState.ts"

export const useSessionState = defineBasicLoader(async (to) => {
  const sessionId = String(to.params.sessionId ?? "")
  const state = getSessionState(sessionId)

  if (state.hasLoaded) {
    return state
  }

  await loadSessionState(state, sessionId)
  return state
})
