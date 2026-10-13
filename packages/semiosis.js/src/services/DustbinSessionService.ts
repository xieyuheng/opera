import type { Database } from "../database/Database.ts"
import type {
  DustbinSessionIndex,
  Session,
  SessionId,
} from "../session/Session.ts"
import type { WorkspaceId } from "../workspace/Workspace.ts"

export type DustbinSessionService = {
  list(options: {
    workspaceId: WorkspaceId | undefined
  }): Promise<Array<DustbinSessionIndex>>
  get(sessionId: SessionId): Promise<Session | undefined>
  trash(sessionId: SessionId): Promise<void>
  restore(sessionId: SessionId): Promise<void>
  remove(sessionId: SessionId): Promise<void>
}

export type DustbinSessionServiceOptions = {
  database: Database
}

export function makeDustbinSessionService(
  options: DustbinSessionServiceOptions,
): DustbinSessionService {
  const database = options.database

  return {
    list: (listOptions) => database.dustbin.sessions.list(listOptions),
    get: (sessionId) => database.dustbin.sessions.get(sessionId),
    trash: (sessionId) => database.dustbin.sessions.trash(sessionId),
    restore: (sessionId) => database.dustbin.sessions.restore(sessionId),
    remove: (sessionId) => database.dustbin.sessions.remove(sessionId),
  }
}
