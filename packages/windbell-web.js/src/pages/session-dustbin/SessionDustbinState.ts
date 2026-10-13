import { semiosis } from "../../app/semiosis"
import type * as S from "@windbell/semiosis.js"
import { reactive } from "vue"

export type SessionDustbinListItem = S.DustbinSessionIndex & {
  context: Array<S.Sign>
}

export type SessionDustbinState = {
  workspaceId: S.WorkspaceId
  sessions: Array<SessionDustbinListItem>
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
    const sessions = await semiosis.dustbin.sessions.list({
      workspaceId: state.workspaceId,
    })

    if (requestId !== state.requestId) return

    const loaded = await Promise.all(
      sessions.map(async (session) => {
        const detail = await semiosis.dustbin.sessions.get(session.id)
        return {
          ...session,
          context: detail?.context ?? [],
        }
      }),
    )

    if (requestId !== state.requestId) return

    state.sessions = loaded
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
  await semiosis.dustbin.sessions.restore(sessionId)
  state.sessions = state.sessions.filter((session) => session.id !== sessionId)
}

export async function removeSession(
  state: SessionDustbinState,
  sessionId: S.SessionId,
): Promise<void> {
  await semiosis.dustbin.sessions.remove(sessionId)
  state.sessions = state.sessions.filter((session) => session.id !== sessionId)
}
