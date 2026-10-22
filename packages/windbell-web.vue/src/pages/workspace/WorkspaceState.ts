import { makeSignPreview } from "@xieyuheng/semiosis.ts/core"
import type * as S from "@xieyuheng/semiosis.ts/core"
import type { WorkspaceSessionPreview } from "@xieyuheng/windbell-api.ts/client"
import { reactive } from "vue"

import { windbell } from "../../app/windbell"
import { cancelPendingStateLoad } from "../../utils/state/loadableState.ts"

const sessionPreviewLimit = 5
const workspacePageSize = 10

export type WorkspaceState = {
  workspaceId: S.WorkspaceId
  workspace: S.Workspace | undefined
  sessions: Array<WorkspaceSessionPreview>
  nextCursor: string | null
  hasLoaded: boolean
  isLoading: boolean
  isLoadingMore: boolean
  isPending: boolean
  loadMoreError: string | undefined
  loadMoreRequestId: number
  requestId: number
  error: string | undefined
}

function sortSessionsByUpdatedAt(
  sessions: Array<WorkspaceSessionPreview>,
): void {
  sessions.sort((a, b) => {
    if (a.updatedAt !== b.updatedAt) return b.updatedAt - a.updatedAt
    if (a.id === b.id) return 0
    return a.id < b.id ? 1 : -1
  })
}

export function makeWorkspaceState(workspaceId: S.WorkspaceId): WorkspaceState {
  return reactive<WorkspaceState>({
    workspaceId,
    workspace: undefined,
    sessions: [],
    nextCursor: null,
    hasLoaded: false,
    isLoading: true,
    isLoadingMore: false,
    isPending: false,
    loadMoreError: undefined,
    loadMoreRequestId: 0,
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
  state.loadMoreRequestId += 1
  state.isLoadingMore = false
  state.loadMoreError = undefined

  if (state.hasLoaded) {
    state.isPending = true
  } else {
    state.isLoading = true
  }

  state.error = undefined

  try {
    const data = await windbell.pages.loadWorkspaceData({
      workspaceId: state.workspaceId,
      previewLimit: sessionPreviewLimit,
      limit: workspacePageSize,
    })

    if (requestId !== state.requestId) return

    sortSessionsByUpdatedAt(data.sessionPreviews)
    state.workspace = data.workspace
    state.sessions = data.sessionPreviews
    state.nextCursor = data.nextCursor
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

export async function loadMoreWorkspaceState(
  state: WorkspaceState,
): Promise<void> {
  if (
    !state.hasLoaded ||
    state.isLoading ||
    state.isPending ||
    state.isLoadingMore ||
    state.nextCursor === null
  ) {
    return
  }

  const requestId = ++state.loadMoreRequestId
  state.isLoadingMore = true
  state.loadMoreError = undefined

  try {
    const data = await windbell.pages.loadWorkspaceData({
      workspaceId: state.workspaceId,
      previewLimit: sessionPreviewLimit,
      limit: workspacePageSize,
      cursor: state.nextCursor,
    })

    if (requestId !== state.loadMoreRequestId) return

    const existingSessionIds = new Set(
      state.sessions.map((session) => session.id),
    )

    for (const session of data.sessionPreviews) {
      if (existingSessionIds.has(session.id)) continue
      existingSessionIds.add(session.id)
      state.sessions.push(session)
    }

    sortSessionsByUpdatedAt(state.sessions)
    state.nextCursor = data.nextCursor
  } catch (error) {
    if (requestId !== state.loadMoreRequestId) return

    state.loadMoreError = error instanceof Error ? error.message : String(error)
  } finally {
    if (requestId === state.loadMoreRequestId) {
      state.isLoadingMore = false
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
  state.sessions.push({
    id: session.id,
    workspaceId: session.workspaceId,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    signPreviews: session.context
      .slice(-sessionPreviewLimit)
      .map((sign) => makeSignPreview(sign)),
  })
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

  const session: WorkspaceSessionPreview = {
    ...current,
    title,
    updatedAt: Date.now(),
  }

  await windbell.sessions.patch({ sessionId, title })
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
