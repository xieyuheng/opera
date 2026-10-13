import type * as S from "@windbell/semiosis.js"
import { err, ok, type Result } from "@windbell/std.js/result"
import type { ServiceError } from "../errors/ServiceError.ts"

export type WorkspacesServiceOptions = {
  workspaces: S.WorkspacesService
}

export function ListWorkspaces(options: WorkspacesServiceOptions) {
  return async (): Promise<Result<Array<S.Workspace>, ServiceError>> => {
    return ok(await options.workspaces.list())
  }
}

export function EnsureWorkspace(options: WorkspacesServiceOptions) {
  return async (input: {
    name: string
    root: string
  }): Promise<Result<S.Workspace, ServiceError>> => {
    return ok(await options.workspaces.ensure(input))
  }
}

export function GetWorkspace(options: WorkspacesServiceOptions) {
  return async (input: {
    workspaceId: S.WorkspaceId
  }): Promise<Result<S.Workspace, ServiceError>> => {
    const workspace = await options.workspaces.get(input.workspaceId)

    if (workspace === undefined) {
      return err({
        type: "workspace-not-found",
        status: 404,
        message: "workspace not found",
        info: { workspaceId: input.workspaceId },
      })
    }

    return ok(workspace)
  }
}

export function PutWorkspace(options: WorkspacesServiceOptions) {
  return async (input: {
    workspace: S.Workspace
  }): Promise<Result<null, ServiceError>> => {
    await options.workspaces.put(input.workspace)
    return ok(null)
  }
}

export function RemoveWorkspace(options: WorkspacesServiceOptions) {
  return async (input: {
    workspaceId: S.WorkspaceId
  }): Promise<Result<null, ServiceError>> => {
    await options.workspaces.remove(input.workspaceId)
    return ok(null)
  }
}
