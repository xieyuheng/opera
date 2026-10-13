import type * as S from "@windbell/semiosis.js"
import { err, ok, type Result } from "@windbell/std.js/result"
import type { ServiceError } from "../errors/ServiceError.ts"

export type SessionsServiceOptions = {
  sessions: S.SessionsService
}

export function ListSessions(options: SessionsServiceOptions) {
  return async (input: {
    workspaceId: S.WorkspaceId | undefined
  }): Promise<Result<Array<S.SessionIndex>, ServiceError>> => {
    return ok(await options.sessions.list(input))
  }
}

export function MakeSession(options: SessionsServiceOptions) {
  return async (input: {
    workspaceId: S.WorkspaceId
    title: string
  }): Promise<Result<S.Session, ServiceError>> => {
    try {
      return ok(await options.sessions.make(input))
    } catch (error) {
      return err({
        type: "session-make-failed",
        status: 400,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }
}

export function GetSession(options: SessionsServiceOptions) {
  return async (input: {
    sessionId: S.SessionId
  }): Promise<Result<S.Session, ServiceError>> => {
    const session = await options.sessions.get(input.sessionId)

    if (session === undefined) {
      return err({
        type: "session-not-found",
        status: 404,
        message: "session not found",
        info: { sessionId: input.sessionId },
      })
    }

    return ok(session)
  }
}

export function PutSession(options: SessionsServiceOptions) {
  return async (input: {
    sessionId: S.SessionId
    session: S.Session
  }): Promise<Result<null, ServiceError>> => {
    if (input.session.id !== input.sessionId) {
      return err({
        type: "session-id-mismatch",
        status: 400,
        message: "session id mismatch",
      })
    }

    await options.sessions.put(input.session)
    return ok(null)
  }
}

export function RemoveSession(options: SessionsServiceOptions) {
  return async (input: {
    sessionId: S.SessionId
  }): Promise<Result<null, ServiceError>> => {
    await options.sessions.remove(input.sessionId)
    return ok(null)
  }
}

export function GenerateSessionTitle(options: SessionsServiceOptions) {
  return async (input: {
    sessionId: S.SessionId
    model: S.ModelRef
  }): Promise<Result<{ title: string }, ServiceError>> => {
    const title = await options.sessions.generateTitle(input)
    return ok({ title })
  }
}
