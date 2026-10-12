import { makeSemiosisClient } from "@windbell/semiosis-api.js/client"
import type * as S from "@windbell/semiosis.js/node"
import { reactive } from "vue"

export type WorkspaceDustbinState = {
  workspaces: Array<S.DustbinWorkspace>
  sessionsByWorkspaceId: Record<S.WorkspaceId, Array<S.DustbinSessionIndex>>
  hasLoaded: boolean
  isLoading: boolean
  isPending: boolean
  requestId: number
  error: string | undefined
}

const semiosis = makeSemiosisClient({
  baseUrl: "/api/semiosis",
})

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
    const [workspaces, sessions] = await Promise.all([
      semiosis.dustbin.workspaces.list(),
      semiosis.dustbin.sessions.list({ workspaceId: undefined }),
    ])

    if (requestId !== state.requestId) return

    state.workspaces = workspaces
    state.sessionsByWorkspaceId = groupSessionsByWorkspace(sessions)
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
  await semiosis.dustbin.workspaces.restore(workspaceId)
  state.workspaces = state.workspaces.filter(
    (workspace) => workspace.id !== workspaceId,
  )
  delete state.sessionsByWorkspaceId[workspaceId]
}

export async function removeWorkspace(
  state: WorkspaceDustbinState,
  workspaceId: S.WorkspaceId,
): Promise<void> {
  await semiosis.dustbin.workspaces.remove(workspaceId)
  state.workspaces = state.workspaces.filter(
    (workspace) => workspace.id !== workspaceId,
  )
  delete state.sessionsByWorkspaceId[workspaceId]
}
