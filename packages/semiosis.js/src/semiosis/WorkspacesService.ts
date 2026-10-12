import type { Database } from "../database/Database.ts"
import type { Workspace, WorkspaceId } from "../workspace/Workspace.ts"

export type WorkspacesService = {
  list(): Promise<Array<Workspace>>
  ensure(options: { name: string; root: string }): Promise<Workspace>
  get(id: WorkspaceId): Promise<Workspace | undefined>
  put(workspace: Workspace): Promise<void>
  remove(id: WorkspaceId): Promise<void>
}

export type WorkspacesServiceOptions = {
  database: Database
}

export function makeWorkspacesService(
  options: WorkspacesServiceOptions,
): WorkspacesService {
  const database = options.database

  return {
    list: () => database.workspaces.list(),
    ensure: (workspaceOptions) => database.workspaces.ensure(workspaceOptions),
    get: (id) => database.workspaces.get(id),
    put: (workspace) => database.workspaces.put(workspace),
    remove: (id) => database.workspaces.remove(id),
  }
}
