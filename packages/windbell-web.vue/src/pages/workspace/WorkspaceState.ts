import { windbell } from "../../app/windbell"
import type * as S from "@windbell/semiosis.ts/core"
import { reactive } from "vue"
import { cancelPendingStateLoad } from "../../utils/state/loadableState.ts"

export type WorkspaceState = {
  workspaceId: S.WorkspaceId
  workspace: S.Workspace | undefined
  sessions: Array<S.Session>
  hasLoaded: boolean
  isLoading: boolean
  isPending: boolean
  requestId: number
  error: string | undefined
}

function sortSessionsByUpdatedAt(sessions: Array<S.Session>): void {
  sessions.sort(
    (a, b) => b.updatedAt - a.updatedAt || b.createdAt - a.createdAt,
  )
}

export function makeWorkspaceState(workspaceId: S.WorkspaceId): WorkspaceState {
  return reactive<WorkspaceState>({
    workspaceId,
    workspace: undefined,
    sessions: [],
    hasLoaded: false,
    isLoading: true,
    isPending: false,
    requestId: 0,
    error: undefined,
  })
}

const workspaceStates = new Map<S.WorkspaceId, WorkspaceState>()

export function getWorkspaceState(workspaceId: S.WorkspaceId): WorkspaceState {
  let state = workspaceStates.get(workspaceId)

  if (state === undefined) {
    state = makeWorkspaceState(workspaceId)
    workspaceStates.set(workspaceId, state)
  }

  return state
}

export async function loadWorkspaceState(state: WorkspaceState): Promise<void> {
  const requestId = ++state.requestId

  if (state.hasLoaded) {
    state.isPending = true
  } else {
    state.isLoading = true
  }

  state.error = undefined

  try {
    const data = await windbell.pages.loadWorkspaceData({
      workspaceId: state.workspaceId,
    })

    if (requestId !== state.requestId) return

    sortSessionsByUpdatedAt(data.sessions)
    state.workspace = data.workspace
    state.sessions = data.sessions
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

export async function makeSession(
  state: WorkspaceState,
  title: string,
): Promise<S.Session> {
  const session = await windbell.sessions.make({
    workspaceId: state.workspaceId,
    title,
  })

  cancelPendingStateLoad(state)
  state.sessions.push(session)
  sortSessionsByUpdatedAt(state.sessions)
  return session
}

export async function trashSession(
  state: WorkspaceState,
  sessionId: S.SessionId,
): Promise<void> {
  await windbell.dustbin.sessions.trash(sessionId)
  cancelPendingStateLoad(state)
  state.sessions = state.sessions.filter((session) => session.id !== sessionId)
}

export async function updateSessionTitle(
  state: WorkspaceState,
  sessionId: S.SessionId,
  title: string,
): Promise<void> {
  const index = state.sessions.findIndex((session) => session.id === sessionId)
  const current = state.sessions[index]

  if (current === undefined) return

  const session: S.Session = {
    ...current,
    title,
    updatedAt: Date.now(),
  }

  await windbell.sessions.put(session)
  cancelPendingStateLoad(state)
  state.sessions[index] = session
  sortSessionsByUpdatedAt(state.sessions)
}

export async function updateWorkspaceTitle(
  state: WorkspaceState,
  title: string,
): Promise<void> {
  const current = state.workspace
  if (current === undefined) return

  const workspace: S.Workspace = {
    ...current,
    name: title,
    updatedAt: Date.now(),
  }

  await windbell.workspaces.put(workspace)
  cancelPendingStateLoad(state)
  state.workspace = workspace
}

export async function trashWorkspace(state: WorkspaceState): Promise<void> {
  await windbell.dustbin.workspaces.trash(state.workspaceId)
  cancelPendingStateLoad(state)
  state.workspace = undefined
  state.sessions = []
}
