import type * as W from "@xieyuheng/windbell.ts/core"
import { reactive } from "vue"

import { windbell } from "../../app/windbell"
import { cancelPendingStateLoad } from "../../utils/state/loadableState.ts"

export type WorkspaceDustbinState = {
  workspaces: Array<W.DustbinWorkspace>
  sessionsByWorkspaceId: Record<W.WorkspaceId, Array<W.DustbinSessionIndex>>
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
  sessions: Array<W.DustbinSessionIndex>,
): Record<W.WorkspaceId, Array<W.DustbinSessionIndex>> {
  const grouped: Record<W.WorkspaceId, Array<W.DustbinSessionIndex>> = {}

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
  workspaceId: W.WorkspaceId,
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
  workspaceId: W.WorkspaceId,
): Promise<void> {
  await windbell.dustbin.workspaces.remove(workspaceId)
  cancelPendingStateLoad(state)
  state.workspaces = state.workspaces.filter(
    (workspace) => workspace.id !== workspaceId,
  )
  delete state.sessionsByWorkspaceId[workspaceId]
}
