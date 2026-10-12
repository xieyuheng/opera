import type * as S from "@windbell/semiosis.js/node"
import { makeJsonEndpoint, withNotFoundAsUndefined } from "@windbell/http.js"
import type { SemiosisClientConfig } from "./SemiosisClient.ts"
import { VoidSchema, WorkspaceListSchema, WorkspaceSchema } from "./schemas.ts"

export type EnsureWorkspaceOptions = {
  name: string
  root: string
}

export type WorkspacesClient = {
  list(): Promise<Array<S.Workspace>>
  ensure(options: EnsureWorkspaceOptions): Promise<S.Workspace>
  get(id: S.WorkspaceId): Promise<S.Workspace | undefined>
  put(workspace: S.Workspace): Promise<void>
  remove(id: S.WorkspaceId): Promise<void>
}

export function makeWorkspacesClient(
  config: SemiosisClientConfig,
): WorkspacesClient {
  return {
    list: makeJsonEndpoint(config, {
      method: "GET",
      path: "/workspaces",
      output: WorkspaceListSchema,
    }),

    ensure: makeJsonEndpoint(config, {
      method: "POST",
      path: "/workspaces/ensure",
      body: (options: EnsureWorkspaceOptions) => options,
      output: WorkspaceSchema,
    }),

    get: withNotFoundAsUndefined(
      makeJsonEndpoint(config, {
        method: "GET",
        path: (id: S.WorkspaceId) => `/workspaces/${encodeURIComponent(id)}`,
        output: WorkspaceSchema,
      }),
    ),

    put: makeJsonEndpoint(config, {
      method: "PUT",
      path: (workspace: S.Workspace) =>
        `/workspaces/${encodeURIComponent(workspace.id)}`,
      body: (workspace: S.Workspace) => workspace,
      output: VoidSchema,
    }),

    remove: makeJsonEndpoint(config, {
      method: "DELETE",
      path: (id: S.WorkspaceId) => `/workspaces/${encodeURIComponent(id)}`,
      output: VoidSchema,
    }),
  }
}
