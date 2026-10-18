import { windbell } from "../../app/windbell"
import type * as S from "@windbell/semiosis.js/core"
import { reactive } from "vue"
import { cancelPendingStateLoad } from "../../utils/state/loadableState.ts"

export type WorkspaceDustbinState = {
  workspaces: Array<S.DustbinWorkspace>
  sessionsByWorkspaceId: Record<S.WorkspaceId, Array<S.DustbinSessionIndex>>
  hasLoaded: boolean
  isLoading: boolean
  isPending: boolean
  requestId: number
  error: string | undefined
}

export function makeWorkspaceDustbinState(): WorkspaceDustbinState {
  return reactive<WorkspaceDustbinState>({
    workspaces: [],
    sessionsByWorkspaceId: {},
    hasLoaded: false,
    isLoading: true,
    isPending: false,
    requestId: 0,
    error: undefined,
  })
}

const workspaceDustbinState = makeWorkspaceDustbinState()

export function getWorkspaceDustbinState(): WorkspaceDustbinState {
  return workspaceDustbinState
}

function groupSessionsByWorkspace(
  sessions: Array<S.DustbinSessionIndex>,
): Record<S.WorkspaceId, Array<S.DustbinSessionIndex>> {
  const grouped: Record<S.WorkspaceId, Array<S.DustbinSessionIndex>> = {}

  for (const session of sessions) {
    const workspaceSessions = grouped[session.workspaceId] ?? []
    workspaceSessions.push(session)
    grouped[session.workspaceId] = workspaceSessions
  }

  return grouped
}

export async function loadWorkspaceDustbin(
  state: WorkspaceDustbinState,
): Promise<void> {
  const requestId = ++state.requestId

  if (state.hasLoaded) {
    state.isPending = true
  } else {
    state.isLoading = true
  }

  state.error = undefined

  try {
    const data = await windbell.pages.loadWorkspaceDustbinData()

    if (requestId !== state.requestId) return

    state.workspaces = data.workspaces
    state.sessionsByWorkspaceId = data.sessionsByWorkspaceId
    state.hasLoaded = true
  } catch (error) {
    if (requestId !== state.requestId) return

    state.error = error instanceof Error ? error.message : String(error)
  } finally {
    if (requestId === state.requestId) {
      state.isLoading = false
      state.isPending = false
    }
  }
}

export async function restoreWorkspace(
  state: WorkspaceDustbinState,
  workspaceId: S.WorkspaceId,
): Promise<void> {
  await windbell.dustbin.workspaces.restore(workspaceId)
  cancelPendingStateLoad(state)
  state.workspaces = state.workspaces.filter(
    (workspace) => workspace.id !== workspaceId,
  )
  delete state.sessionsByWorkspaceId[workspaceId]
}

export async function removeWorkspace(
  state: WorkspaceDustbinState,
  workspaceId: S.WorkspaceId,
): Promise<void> {
  await windbell.dustbin.workspaces.remove(workspaceId)
  cancelPendingStateLoad(state)
  state.workspaces = state.workspaces.filter(
    (workspace) => workspace.id !== workspaceId,
  )
  delete state.sessionsByWorkspaceId[workspaceId]
}
