import { err, isError, ok, type Result } from "@xieyuheng/std.ts/result"

import type { Database } from "../database/Database.ts"
import type { DustbinWorkspace, WorkspaceId } from "../workspace/Workspace.ts"
import {
  makeServiceErrorFromDatabaseError,
  type ServiceError,
} from "./ServiceError.ts"

export type DustbinWorkspaceService = {
  list(): Promise<Result<Array<DustbinWorkspace>, ServiceError>>
  get(
    id: WorkspaceId,
  ): Promise<Result<DustbinWorkspace | undefined, ServiceError>>
  trash(id: WorkspaceId): Promise<Result<void, ServiceError>>
  restore(id: WorkspaceId): Promise<Result<void, ServiceError>>
  remove(id: WorkspaceId): Promise<Result<void, ServiceError>>
}

export type DustbinWorkspaceServiceOptions = {
  database: Database
}

export function makeDustbinWorkspaceService(
  options: DustbinWorkspaceServiceOptions,
): DustbinWorkspaceService {
  const database = options.database

  return {
    async list() {
      const result = await database.dustbin.workspaces.list()
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(result.value)
    },

    async get(id) {
      const result = await database.dustbin.workspaces.get(id)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(result.value)
    },

    async trash(id) {
      const result = await database.dustbin.workspaces.trash(id)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(undefined)
    },

    async restore(id) {
      const result = await database.dustbin.workspaces.restore(id)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(undefined)
    },

    async remove(id) {
      const result = await database.dustbin.workspaces.remove(id)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(undefined)
    },
  }
}
