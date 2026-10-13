import type * as S from "@windbell/semiosis.js"
import { err, ok, type Result } from "@windbell/std.js/result"
import type { ServiceError } from "../errors/ServiceError.ts"

export type DustbinSessionsServiceOptions = {
  dustbinSessions: S.DustbinSessionsService
}

export function ListDustbinSessions(options: DustbinSessionsServiceOptions) {
  return async (input: {
    workspaceId: S.WorkspaceId | undefined
  }): Promise<Result<Array<S.DustbinSessionIndex>, ServiceError>> => {
    return ok(await options.dustbinSessions.list(input))
  }
}

export function GetDustbinSession(options: DustbinSessionsServiceOptions) {
  return async (input: {
    sessionId: S.SessionId
  }): Promise<Result<S.Session, ServiceError>> => {
    const session = await options.dustbinSessions.get(input.sessionId)

    if (session === undefined) {
      return err({
        type: "dustbin-session-not-found",
        status: 404,
        message: "session not found",
        info: { sessionId: input.sessionId },
      })
    }

    return ok(session)
  }
}

export function TrashDustbinSession(options: DustbinSessionsServiceOptions) {
  return async (input: {
    sessionId: S.SessionId
  }): Promise<Result<null, ServiceError>> => {
    await options.dustbinSessions.trash(input.sessionId)
    return ok(null)
  }
}

export function RestoreDustbinSession(options: DustbinSessionsServiceOptions) {
  return async (input: {
    sessionId: S.SessionId
  }): Promise<Result<null, ServiceError>> => {
    await options.dustbinSessions.restore(input.sessionId)
    return ok(null)
  }
}

export function RemoveDustbinSession(options: DustbinSessionsServiceOptions) {
  return async (input: {
    sessionId: S.SessionId
  }): Promise<Result<null, ServiceError>> => {
    await options.dustbinSessions.remove(input.sessionId)
    return ok(null)
  }
}
