import type { Database } from "../database/Database.ts"
import type { DustbinWorkspace, WorkspaceId } from "../workspace/Workspace.ts"

export type DustbinWorkspaceService = {
  list(): Promise<Array<DustbinWorkspace>>
  get(id: WorkspaceId): Promise<DustbinWorkspace | undefined>
  trash(id: WorkspaceId): Promise<void>
  restore(id: WorkspaceId): Promise<void>
  remove(id: WorkspaceId): Promise<void>
}

export type DustbinWorkspaceServiceOptions = {
  database: Database
}

export function makeDustbinWorkspaceService(
  options: DustbinWorkspaceServiceOptions,
): DustbinWorkspaceService {
  const database = options.database

  return {
    list: () => database.dustbin.workspaces.list(),
    get: (id) => database.dustbin.workspaces.get(id),
    trash: (id) => database.dustbin.workspaces.trash(id),
    restore: (id) => database.dustbin.workspaces.restore(id),
    remove: (id) => database.dustbin.workspaces.remove(id),
  }
}
