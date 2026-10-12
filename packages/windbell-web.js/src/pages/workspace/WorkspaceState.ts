import { makeSemiosisClient } from "@windbell/semiosis-api.js/client"
import type * as S from "@windbell/semiosis.js/node"
import { reactive } from "vue"

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

const semiosis = makeSemiosisClient({
  baseUrl: "/api/semiosis",
})

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
    const [workspace, sessions] = await Promise.all([
      semiosis.workspaces.get(state.workspaceId),
      semiosis.sessions.list({
        workspaceId: state.workspaceId,
      }),
    ])

    if (requestId !== state.requestId) return

    const loadedSessions = (
      await Promise.all(
        sessions.map((session) => semiosis.sessions.get(session.id)),
      )
    ).filter((session): session is S.Session => session !== undefined)

    if (requestId !== state.requestId) return

    sortSessionsByUpdatedAt(loadedSessions)
    state.workspace = workspace
    state.sessions = loadedSessions
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
  const session = await semiosis.sessions.make({
    workspaceId: state.workspaceId,
    title,
  })

  state.sessions.push(session)
  sortSessionsByUpdatedAt(state.sessions)
  return session
}

export async function trashSession(
  state: WorkspaceState,
  sessionId: S.SessionId,
): Promise<void> {
  await semiosis.dustbin.sessions.trash(sessionId)
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

  await semiosis.sessions.put(session)
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

  await semiosis.workspaces.put(workspace)
  state.workspace = workspace
}

export async function trashWorkspace(state: WorkspaceState): Promise<void> {
  await semiosis.dustbin.workspaces.trash(state.workspaceId)
  state.workspace = undefined
  state.sessions = []
}
