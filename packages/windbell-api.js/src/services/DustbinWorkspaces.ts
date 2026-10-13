import type * as S from "@windbell/semiosis.js"
import { err, ok, type Result } from "@windbell/std.js/result"
import type { ServiceError } from "../errors/ServiceError.ts"

export type DustbinWorkspacesServiceOptions = {
  dustbinWorkspaces: S.DustbinWorkspacesService
}

export function ListDustbinWorkspaces(
  options: DustbinWorkspacesServiceOptions,
) {
  return async (): Promise<Result<Array<S.DustbinWorkspace>, ServiceError>> => {
    return ok(await options.dustbinWorkspaces.list())
  }
}

export function GetDustbinWorkspace(options: DustbinWorkspacesServiceOptions) {
  return async (input: {
    workspaceId: S.WorkspaceId
  }): Promise<Result<S.DustbinWorkspace, ServiceError>> => {
    const workspace = await options.dustbinWorkspaces.get(input.workspaceId)

    if (workspace === undefined) {
      return err({
        type: "dustbin-workspace-not-found",
        status: 404,
        message: "workspace not found",
        info: { workspaceId: input.workspaceId },
      })
    }

    return ok(workspace)
  }
}

export function TrashDustbinWorkspace(
  options: DustbinWorkspacesServiceOptions,
) {
  return async (input: {
    workspaceId: S.WorkspaceId
  }): Promise<Result<null, ServiceError>> => {
    await options.dustbinWorkspaces.trash(input.workspaceId)
    return ok(null)
  }
}

export function RestoreDustbinWorkspace(
  options: DustbinWorkspacesServiceOptions,
) {
  return async (input: {
    workspaceId: S.WorkspaceId
  }): Promise<Result<null, ServiceError>> => {
    await options.dustbinWorkspaces.restore(input.workspaceId)
    return ok(null)
  }
}

export function RemoveDustbinWorkspace(
  options: DustbinWorkspacesServiceOptions,
) {
  return async (input: {
    workspaceId: S.WorkspaceId
  }): Promise<Result<null, ServiceError>> => {
    await options.dustbinWorkspaces.remove(input.workspaceId)
    return ok(null)
  }
}
