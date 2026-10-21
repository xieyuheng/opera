import type * as S from "@windbell/semiosis.ts/core"
import type { DustbinSessionPreview } from "@windbell/windbell-api.ts/client"
import { reactive } from "vue"

import { windbell } from "../../app/windbell"
import { cancelPendingStateLoad } from "../../utils/state/loadableState.ts"

const sessionPreviewLimit = 5

export type SessionDustbinState = {
  workspaceId: S.WorkspaceId
  sessions: Array<DustbinSessionPreview>
  hasLoaded: boolean
  isLoading: boolean
  isPending: boolean
  requestId: number
  error: string | undefined
}

export function makeSessionDustbinState(
  workspaceId: S.WorkspaceId,
): SessionDustbinState {
  return reactive<SessionDustbinState>({
    workspaceId,
    sessions: [],
    hasLoaded: false,
    isLoading: true,
    isPending: false,
    requestId: 0,
    error: undefined,
  })
}

const sessionDustbinStates = new Map<S.WorkspaceId, SessionDustbinState>()

export function getSessionDustbinState(
  workspaceId: S.WorkspaceId,
): SessionDustbinState {
  let state = sessionDustbinStates.get(workspaceId)

  if (state === undefined) {
    state = makeSessionDustbinState(workspaceId)
    sessionDustbinStates.set(workspaceId, state)
  }

  return state
}

export async function loadSessionDustbin(
  state: SessionDustbinState,
): Promise<void> {
  const requestId = ++state.requestId

  if (state.hasLoaded) {
    state.isPending = true
  } else {
    state.isLoading = true
  }

  state.error = undefined

  try {
    const data = await windbell.pages.loadSessionDustbinData({
      workspaceId: state.workspaceId,
      previewLimit: sessionPreviewLimit,
    })

    if (requestId !== state.requestId) return

    state.sessions = data.sessionPreviews
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

export async function restoreSession(
  state: SessionDustbinState,
  sessionId: S.SessionId,
): Promise<void> {
  await windbell.dustbin.sessions.restore(sessionId)
  cancelPendingStateLoad(state)
  state.sessions = state.sessions.filter((session) => session.id !== sessionId)
}

export async function removeSession(
  state: SessionDustbinState,
  sessionId: S.SessionId,
): Promise<void> {
  await windbell.dustbin.sessions.remove(sessionId)
  cancelPendingStateLoad(state)
  state.sessions = state.sessions.filter((session) => session.id !== sessionId)
}
