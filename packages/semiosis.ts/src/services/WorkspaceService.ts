import { err, isError, ok, type Result } from "@windbell/std.ts/result"
import type { Database } from "../database/Database.ts"
import type { Workspace, WorkspaceId } from "../workspace/Workspace.ts"
import {
  makeServiceErrorFromDatabaseError,
  type ServiceError,
} from "./ServiceError.ts"

export type WorkspaceService = {
  list(): Promise<Result<Array<Workspace>, ServiceError>>
  ensure(options: {
    name: string
    root: string
  }): Promise<Result<Workspace, ServiceError>>
  get(id: WorkspaceId): Promise<Result<Workspace | undefined, ServiceError>>
  put(workspace: Workspace): Promise<Result<void, ServiceError>>
  remove(id: WorkspaceId): Promise<Result<void, ServiceError>>
}

export type WorkspaceServiceOptions = {
  database: Database
}

export function makeWorkspaceService(
  options: WorkspaceServiceOptions,
): WorkspaceService {
  const database = options.database

  return {
    async list() {
      const result = await database.workspaces.list()
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(result.value)
    },

    async ensure(workspaceOptions) {
      const result = await database.workspaces.ensure(workspaceOptions)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(result.value)
    },

    async get(id) {
      const result = await database.workspaces.get(id)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(result.value)
    },

    async put(workspace) {
      const result = await database.workspaces.put(workspace)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(undefined)
    },

    async remove(id) {
      const result = await database.workspaces.remove(id)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(undefined)
    },
  }
}
