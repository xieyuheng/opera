import { err, isError, ok, type Result } from "@windbell/std.ts/result"

import type { Database } from "../database/Database.ts"
import type {
  DustbinSessionIndex,
  Session,
  SessionId,
} from "../session/Session.ts"
import type { WorkspaceId } from "../workspace/Workspace.ts"
import {
  makeServiceErrorFromDatabaseError,
  type ServiceError,
} from "./ServiceError.ts"

export type DustbinSessionService = {
  list(options: {
    workspaceId: WorkspaceId | undefined
  }): Promise<Result<Array<DustbinSessionIndex>, ServiceError>>
  get(sessionId: SessionId): Promise<Result<Session | undefined, ServiceError>>
  trash(sessionId: SessionId): Promise<Result<void, ServiceError>>
  restore(sessionId: SessionId): Promise<Result<void, ServiceError>>
  remove(sessionId: SessionId): Promise<Result<void, ServiceError>>
}

export type DustbinSessionServiceOptions = {
  database: Database
}

export function makeDustbinSessionService(
  options: DustbinSessionServiceOptions,
): DustbinSessionService {
  const database = options.database

  return {
    async list(listOptions) {
      const result = await database.dustbin.sessions.list(listOptions)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(result.value)
    },

    async get(sessionId) {
      const result = await database.dustbin.sessions.get(sessionId)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(result.value)
    },

    async trash(sessionId) {
      const result = await database.dustbin.sessions.trash(sessionId)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(undefined)
    },

    async restore(sessionId) {
      const result = await database.dustbin.sessions.restore(sessionId)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(undefined)
    },

    async remove(sessionId) {
      const result = await database.dustbin.sessions.remove(sessionId)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(undefined)
    },
  }
}
