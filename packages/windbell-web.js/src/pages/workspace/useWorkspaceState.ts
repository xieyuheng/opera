import { defineBasicLoader } from "vue-router/experimental"
import { getWorkspaceState, loadWorkspaceState } from "./WorkspaceState.ts"

export const useWorkspaceState = defineBasicLoader(async (to) => {
  const workspaceId = String(to.params.workspaceId ?? "")
  const state = getWorkspaceState(workspaceId)

  if (state.hasLoaded) {
    void loadWorkspaceState(state)
    return state
  }

  await loadWorkspaceState(state)
  return state
})
