import type * as S from "@windbell/semiosis.js/node"
import { makeJsonEndpoint, withNotFoundAsUndefined } from "@windbell/http.js"
import type { SemiosisClientConfig } from "./SemiosisClient.ts"
import {
  DustbinWorkspaceListSchema,
  DustbinWorkspaceSchema,
  VoidSchema,
} from "./schemas.ts"

export type DustbinWorkspacesClient = {
  list(): Promise<Array<S.DustbinWorkspace>>
  get(id: S.WorkspaceId): Promise<S.DustbinWorkspace | undefined>
  trash(id: S.WorkspaceId): Promise<void>
  restore(id: S.WorkspaceId): Promise<void>
  remove(id: S.WorkspaceId): Promise<void>
}

export function makeDustbinWorkspacesClient(
  config: SemiosisClientConfig,
): DustbinWorkspacesClient {
  return {
    list: makeJsonEndpoint(config, {
      method: "GET",
      path: "/dustbin/workspaces",
      output: DustbinWorkspaceListSchema,
    }),

    get: withNotFoundAsUndefined(
      makeJsonEndpoint(config, {
        method: "GET",
        path: (id: S.WorkspaceId) =>
          `/dustbin/workspaces/${encodeURIComponent(id)}`,
        output: DustbinWorkspaceSchema,
      }),
    ),

    trash: makeJsonEndpoint(config, {
      method: "POST",
      path: "/dustbin/workspaces",
      body: (id: S.WorkspaceId) => ({ workspaceId: id }),
      output: VoidSchema,
    }),

    restore: makeJsonEndpoint(config, {
      method: "POST",
      path: (id: S.WorkspaceId) =>
        `/dustbin/workspaces/${encodeURIComponent(id)}/restore`,
      output: VoidSchema,
    }),

    remove: makeJsonEndpoint(config, {
      method: "DELETE",
      path: (id: S.WorkspaceId) =>
        `/dustbin/workspaces/${encodeURIComponent(id)}`,
      output: VoidSchema,
    }),
  }
}
