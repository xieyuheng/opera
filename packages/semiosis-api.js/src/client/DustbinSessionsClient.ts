import type * as S from "@windbell/semiosis.js/node"
import { makeJsonEndpoint, withNotFoundAsUndefined } from "@windbell/http.js"
import type { SemiosisClientConfig } from "./SemiosisClient.ts"
import {
  DustbinSessionIndexListSchema,
  SessionSchema,
  VoidSchema,
} from "./schemas.ts"

export type ListDustbinSessionsOptions = {
  workspaceId: S.WorkspaceId | undefined
}

export type DustbinSessionsClient = {
  list(
    options: ListDustbinSessionsOptions,
  ): Promise<Array<S.DustbinSessionIndex>>
  get(sessionId: S.SessionId): Promise<S.Session | undefined>
  trash(sessionId: S.SessionId): Promise<void>
  restore(sessionId: S.SessionId): Promise<void>
  remove(sessionId: S.SessionId): Promise<void>
}

export function makeDustbinSessionsClient(
  config: SemiosisClientConfig,
): DustbinSessionsClient {
  return {
    list: makeJsonEndpoint(config, {
      method: "GET",
      path: "/dustbin/sessions",
      query: (options: ListDustbinSessionsOptions) => {
        const query = new URLSearchParams()
        if (options.workspaceId !== undefined) {
          query.set("workspaceId", options.workspaceId)
        }
        return query
      },
      output: DustbinSessionIndexListSchema,
    }),

    get: withNotFoundAsUndefined(
      makeJsonEndpoint(config, {
        method: "GET",
        path: (sessionId: S.SessionId) =>
          `/dustbin/sessions/${encodeURIComponent(sessionId)}`,
        output: SessionSchema,
      }),
    ),

    trash: makeJsonEndpoint(config, {
      method: "POST",
      path: "/dustbin/sessions",
      body: (sessionId: S.SessionId) => ({ sessionId }),
      output: VoidSchema,
    }),

    restore: makeJsonEndpoint(config, {
      method: "POST",
      path: (sessionId: S.SessionId) =>
        `/dustbin/sessions/${encodeURIComponent(sessionId)}/restore`,
      output: VoidSchema,
    }),

    remove: makeJsonEndpoint(config, {
      method: "DELETE",
      path: (sessionId: S.SessionId) =>
        `/dustbin/sessions/${encodeURIComponent(sessionId)}`,
      output: VoidSchema,
    }),
  }
}
