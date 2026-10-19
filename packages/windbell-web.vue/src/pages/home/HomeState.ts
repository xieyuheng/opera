import type * as S from "@windbell/semiosis.ts/core"
import { reactive } from "vue"

import { windbell } from "../../app/windbell"
import { cancelPendingStateLoad } from "../../utils/state/loadableState.ts"

export type HomeState = {
  workspaces: Array<S.Workspace>
  sessionsByWorkspaceId: Record<S.WorkspaceId, Array<S.SessionIndex>>
  hasLoaded: boolean
  isLoading: boolean
  isPending: boolean
  requestId: number
  error: string | undefined
}

export function makeHomeState(): HomeState {
  return reactive<HomeState>({
    workspaces: [],
    sessionsByWorkspaceId: {},
    hasLoaded: false,
    isLoading: true,
    isPending: false,
    requestId: 0,
    error: undefined,
  })
}

const homeState = makeHomeState()

export function getHomeState(): HomeState {
  return homeState
}

function sortWorkspacesByUpdatedAt(workspaces: Array<S.Workspace>): void {
  workspaces.sort(
    (a, b) => b.updatedAt - a.updatedAt || b.createdAt - a.createdAt,
  )
}

function groupSessionsByWorkspace(
  sessions: Array<S.SessionIndex>,
): Record<S.WorkspaceId, Array<S.SessionIndex>> {
  const grouped: Record<S.WorkspaceId, Array<S.SessionIndex>> = {}

  for (const session of sessions) {
    const workspaceSessions = grouped[session.workspaceId] ?? []
    workspaceSessions.push(session)
    grouped[session.workspaceId] = workspaceSessions
  }

  return grouped
}

export async function loadHomeState(state: HomeState): Promise<void> {
  const requestId = ++state.requestId

  if (state.hasLoaded) {
    state.isPending = true
  } else {
    state.isLoading = true
  }

  state.error = undefined

  try {
    const data = await windbell.pages.loadHomeData()

    if (requestId !== state.requestId) return

    sortWorkspacesByUpdatedAt(data.workspaces)
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

export async function ensureWorkspace(
  state: HomeState,
  options: {
    name: string
    root: string
  },
): Promise<S.Workspace> {
  const workspace = await windbell.workspaces.ensure(options)
  cancelPendingStateLoad(state)
  const index = state.workspaces.findIndex((item) => item.id === workspace.id)

  if (index === -1) {
    state.workspaces.push(workspace)
  } else {
    state.workspaces[index] = workspace
  }

  state.sessionsByWorkspaceId[workspace.id] ??= []
  sortWorkspacesByUpdatedAt(state.workspaces)

  return workspace
}

export async function trashWorkspace(
  state: HomeState,
  workspaceId: S.WorkspaceId,
): Promise<void> {
  await windbell.dustbin.workspaces.trash(workspaceId)
  cancelPendingStateLoad(state)
  state.workspaces = state.workspaces.filter(
    (workspace) => workspace.id !== workspaceId,
  )
  delete state.sessionsByWorkspaceId[workspaceId]
}

export async function updateWorkspaceTitle(
  state: HomeState,
  workspaceId: S.WorkspaceId,
  name: string,
): Promise<void> {
  const index = state.workspaces.findIndex(
    (workspace) => workspace.id === workspaceId,
  )
  const current = state.workspaces[index]

  if (current === undefined) return

  const workspace: S.Workspace = {
    ...current,
    name,
    updatedAt: Date.now(),
  }

  await windbell.workspaces.put(workspace)
  cancelPendingStateLoad(state)
  state.workspaces[index] = workspace
  sortWorkspacesByUpdatedAt(state.workspaces)
}
