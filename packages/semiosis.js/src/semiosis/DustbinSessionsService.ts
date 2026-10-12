import type { Database } from "../database/Database.ts"
import type {
  DustbinSessionIndex,
  Session,
  SessionId,
} from "../session/Session.ts"
import type { WorkspaceId } from "../workspace/Workspace.ts"

export type DustbinSessionsService = {
  list(options: {
    workspaceId: WorkspaceId | undefined
  }): Promise<Array<DustbinSessionIndex>>
  get(sessionId: SessionId): Promise<Session | undefined>
  trash(sessionId: SessionId): Promise<void>
  restore(sessionId: SessionId): Promise<void>
  remove(sessionId: SessionId): Promise<void>
}

export type DustbinSessionsServiceOptions = {
  database: Database
}

export function makeDustbinSessionsService(
  options: DustbinSessionsServiceOptions,
): DustbinSessionsService {
  const database = options.database

  return {
    list: (listOptions) => database.dustbin.sessions.list(listOptions),
    get: (sessionId) => database.dustbin.sessions.get(sessionId),
    trash: (sessionId) => database.dustbin.sessions.trash(sessionId),
    restore: (sessionId) => database.dustbin.sessions.restore(sessionId),
    remove: (sessionId) => database.dustbin.sessions.remove(sessionId),
  }
}
