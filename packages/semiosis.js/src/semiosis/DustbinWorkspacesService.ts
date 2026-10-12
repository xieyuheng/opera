import type { Database } from "../database/Database.ts"
import type { DustbinWorkspace, WorkspaceId } from "../workspace/Workspace.ts"

export type DustbinWorkspacesService = {
  list(): Promise<Array<DustbinWorkspace>>
  get(id: WorkspaceId): Promise<DustbinWorkspace | undefined>
  trash(id: WorkspaceId): Promise<void>
  restore(id: WorkspaceId): Promise<void>
  remove(id: WorkspaceId): Promise<void>
}

export type DustbinWorkspacesServiceOptions = {
  database: Database
}

export function makeDustbinWorkspacesService(
  options: DustbinWorkspacesServiceOptions,
): DustbinWorkspacesService {
  const database = options.database

  return {
    list: () => database.dustbin.workspaces.list(),
    get: (id) => database.dustbin.workspaces.get(id),
    trash: (id) => database.dustbin.workspaces.trash(id),
    restore: (id) => database.dustbin.workspaces.restore(id),
    remove: (id) => database.dustbin.workspaces.remove(id),
  }
}
