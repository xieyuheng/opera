import {
  makeJsonEndpoint,
  requestNdjson,
  withNotFoundAsUndefined,
} from "@windbell/http.js"
import type * as S from "@windbell/semiosis.js"
import { z } from "zod"
import type {
  HomeData,
  ProviderData,
  ProviderListData,
  SessionData,
  SessionDustbinData,
  WorkspaceData,
  WorkspaceDustbinData,
} from "../api/types.ts"
import type { WindbellHealth } from "../services/Health.ts"
import { JsonDataSchema, VoidSchema } from "./schemas.ts"

export type WindbellClientConfig = {
  baseUrl: string
}

export type WindbellClient = {
  health(): Promise<WindbellHealth>
  pages: PagesClient
  workspaces: WorkspacesClient
  sessions: SessionsClient
  dustbin: {
    sessions: DustbinSessionsClient
    workspaces: DustbinWorkspacesClient
  }
  providers: ProvidersClient
  settings: SettingsClient
}

export type PagesClient = {
  loadHomeData(): Promise<HomeData>
  loadWorkspaceData(options: {
    workspaceId: S.WorkspaceId
  }): Promise<WorkspaceData>
  loadSessionData(options: { sessionId: S.SessionId }): Promise<SessionData>
  loadSessionDustbinData(options: {
    workspaceId: S.WorkspaceId
  }): Promise<SessionDustbinData>
  loadWorkspaceDustbinData(): Promise<WorkspaceDustbinData>
  loadProviderListData(): Promise<ProviderListData>
  loadProviderData(options: { providerName: string }): Promise<ProviderData>
}

export type WorkspacesClient = {
  list(): Promise<Array<S.Workspace>>
  ensure(options: { name: string; root: string }): Promise<S.Workspace>
  get(id: S.WorkspaceId): Promise<S.Workspace | undefined>
  put(workspace: S.Workspace): Promise<void>
  remove(id: S.WorkspaceId): Promise<void>
}

export type SessionsClient = {
  list(options: {
    workspaceId: S.WorkspaceId | undefined
  }): Promise<Array<S.SessionIndex>>
  make(options: {
    workspaceId: S.WorkspaceId
    title: string
  }): Promise<S.Session>
  get(id: S.SessionId): Promise<S.Session | undefined>
  put(session: S.Session): Promise<void>
  generateTitle(options: {
    sessionId: S.SessionId
    model: S.ModelRef
  }): Promise<string>
  getTotalUsage(options: { sessionId: S.SessionId }): Promise<S.ModelTotalUsage>
  interpret(options: {
    sessionId: S.SessionId
    model: S.ModelRef
    turnId: string
    input: Array<S.Sign>
    signal?: AbortSignal
  }): AsyncGenerator<S.TurnEvent>
  remove(id: S.SessionId): Promise<void>
}

export type DustbinSessionsClient = {
  list(options: {
    workspaceId: S.WorkspaceId | undefined
  }): Promise<Array<S.DustbinSessionIndex>>
  get(id: S.SessionId): Promise<S.Session | undefined>
  trash(id: S.SessionId): Promise<void>
  restore(id: S.SessionId): Promise<void>
  remove(id: S.SessionId): Promise<void>
}

export type DustbinWorkspacesClient = {
  list(): Promise<Array<S.DustbinWorkspace>>
  get(id: S.WorkspaceId): Promise<S.DustbinWorkspace | undefined>
  trash(id: S.WorkspaceId): Promise<void>
  restore(id: S.WorkspaceId): Promise<void>
  remove(id: S.WorkspaceId): Promise<void>
}

export type ProvidersClient = {
  list(): Promise<Array<S.ProviderConfig>>
  get(name: string): Promise<S.ProviderConfig>
  getApiKeyStatus(name: string): Promise<boolean>
  listModels(options: {
    providerName: string
    all?: boolean
  }): Promise<Array<S.ModelEntry>>
  getModel(options: {
    providerName: string
    modelName: string
  }): Promise<S.ModelEntry>
  pinModel(options: { providerName: string; modelName: string }): Promise<void>
  unpinModel(options: {
    providerName: string
    modelName: string
  }): Promise<void>
  setDefaultModel(options: {
    providerName: string
    modelName: string
  }): Promise<void>
  putApiKey(options: { providerName: string; key: string }): Promise<void>
  deleteApiKey(providerName: string): Promise<void>
}

export type SettingsClient = {
  get(): Promise<S.Settings>
  put(settings: S.Settings): Promise<void>
}

export function makeWindbellClient(
  config: WindbellClientConfig,
): WindbellClient {
  const healthEndpoint = makeJsonEndpoint<void, WindbellHealth>(config, {
    method: "GET",
    path: "/health",
    output: JsonDataSchema<WindbellHealth>(),
  })

  const pages: PagesClient = {
    loadHomeData: makeJsonEndpoint(config, {
      method: "GET",
      path: "/pages/home",
      output: JsonDataSchema<HomeData>(),
    }),
    loadWorkspaceData: makeJsonEndpoint(config, {
      method: "GET",
      path: (options) =>
        `/pages/workspaces/${encodeURIComponent(options.workspaceId)}`,
      output: JsonDataSchema<WorkspaceData>(),
    }),
    loadSessionData: makeJsonEndpoint(config, {
      method: "GET",
      path: (options) =>
        `/pages/sessions/${encodeURIComponent(options.sessionId)}`,
      output: JsonDataSchema<SessionData>(),
    }),
    loadSessionDustbinData: makeJsonEndpoint(config, {
      method: "GET",
      path: "/pages/session-dustbin",
      query: (options) => {
        const query = new URLSearchParams()
        query.set("workspaceId", options.workspaceId)
        return query
      },
      output: JsonDataSchema<SessionDustbinData>(),
    }),
    loadWorkspaceDustbinData: makeJsonEndpoint(config, {
      method: "GET",
      path: "/pages/workspace-dustbin",
      output: JsonDataSchema<WorkspaceDustbinData>(),
    }),
    loadProviderListData: makeJsonEndpoint(config, {
      method: "GET",
      path: "/pages/provider-list",
      output: JsonDataSchema<ProviderListData>(),
    }),
    loadProviderData: makeJsonEndpoint(config, {
      method: "GET",
      path: (options) =>
        `/pages/providers/${encodeURIComponent(options.providerName)}`,
      output: JsonDataSchema<ProviderData>(),
    }),
  }

  const workspaces: WorkspacesClient = {
    list: makeJsonEndpoint(config, {
      method: "GET",
      path: "/workspaces",
      output: JsonDataSchema<Array<S.Workspace>>(),
    }),
    ensure: makeJsonEndpoint(config, {
      method: "POST",
      path: "/workspaces/ensure",
      body: (options) => options,
      output: JsonDataSchema<S.Workspace>(),
    }),
    get: withNotFoundAsUndefined(
      makeJsonEndpoint(config, {
        method: "GET",
        path: (id: S.WorkspaceId) => `/workspaces/${encodeURIComponent(id)}`,
        output: JsonDataSchema<S.Workspace>(),
      }),
    ),
    put: makeJsonEndpoint(config, {
      method: "PUT",
      path: (workspace: S.Workspace) =>
        `/workspaces/${encodeURIComponent(workspace.id)}`,
      body: (workspace) => workspace,
      output: VoidSchema,
    }),
    remove: makeJsonEndpoint(config, {
      method: "DELETE",
      path: (id: S.WorkspaceId) => `/workspaces/${encodeURIComponent(id)}`,
      output: VoidSchema,
    }),
  }

  const sessions: SessionsClient = {
    list: makeJsonEndpoint(config, {
      method: "GET",
      path: "/sessions",
      query: (options) => {
        const query = new URLSearchParams()
        if (options.workspaceId !== undefined) {
          query.set("workspaceId", options.workspaceId)
        }
        return query
      },
      output: JsonDataSchema<Array<S.SessionIndex>>(),
    }),
    make: makeJsonEndpoint(config, {
      method: "POST",
      path: "/sessions",
      body: (options) => options,
      output: JsonDataSchema<S.Session>(),
    }),
    get: withNotFoundAsUndefined(
      makeJsonEndpoint(config, {
        method: "GET",
        path: (id: S.SessionId) => `/sessions/${encodeURIComponent(id)}`,
        output: JsonDataSchema<S.Session>(),
      }),
    ),
    put: makeJsonEndpoint(config, {
      method: "PUT",
      path: (session: S.Session) =>
        `/sessions/${encodeURIComponent(session.id)}`,
      body: (session) => session,
      output: VoidSchema,
    }),
    async generateTitle(options) {
      const result = await makeJsonEndpoint(config, {
        method: "POST",
        path: (input: { sessionId: S.SessionId; model: S.ModelRef }) =>
          `/sessions/${encodeURIComponent(input.sessionId)}/title`,
        body: (input) => input,
        output: z.object({ title: z.string() }),
      })(options)

      return result.title
    },
    getTotalUsage: makeJsonEndpoint(config, {
      method: "GET",
      path: (options) =>
        `/sessions/${encodeURIComponent(options.sessionId)}/total-usage`,
      output: JsonDataSchema<S.ModelTotalUsage>(),
    }),
    async *interpret(options) {
      for await (const event of requestNdjson<S.TurnEvent>({
        baseUrl: config.baseUrl,
        method: "POST",
        path: `/sessions/${encodeURIComponent(options.sessionId)}/interpret`,
        body: {
          model: options.model,
          turnId: options.turnId,
          input: options.input,
        },
        signal: options.signal,
      })) {
        yield event
      }
    },
    remove: makeJsonEndpoint(config, {
      method: "DELETE",
      path: (id: S.SessionId) => `/sessions/${encodeURIComponent(id)}`,
      output: VoidSchema,
    }),
  }

  const dustbin = {
    sessions: {
      list: makeJsonEndpoint(config, {
        method: "GET",
        path: "/dustbin/sessions",
        query: (options: { workspaceId: S.WorkspaceId | undefined }) => {
          const query = new URLSearchParams()
          if (options.workspaceId !== undefined) {
            query.set("workspaceId", options.workspaceId)
          }
          return query
        },
        output: JsonDataSchema<Array<S.DustbinSessionIndex>>(),
      }),
      get: withNotFoundAsUndefined(
        makeJsonEndpoint(config, {
          method: "GET",
          path: (id: S.SessionId) =>
            `/dustbin/sessions/${encodeURIComponent(id)}`,
          output: JsonDataSchema<S.Session>(),
        }),
      ),
      trash: makeJsonEndpoint(config, {
        method: "POST",
        path: "/dustbin/sessions",
        body: (id: S.SessionId) => ({ sessionId: id }),
        output: VoidSchema,
      }),
      restore: makeJsonEndpoint(config, {
        method: "POST",
        path: (id: S.SessionId) =>
          `/dustbin/sessions/${encodeURIComponent(id)}/restore`,
        output: VoidSchema,
      }),
      remove: makeJsonEndpoint(config, {
        method: "DELETE",
        path: (id: S.SessionId) =>
          `/dustbin/sessions/${encodeURIComponent(id)}`,
        output: VoidSchema,
      }),
    },
    workspaces: {
      list: makeJsonEndpoint(config, {
        method: "GET",
        path: "/dustbin/workspaces",
        output: JsonDataSchema<Array<S.DustbinWorkspace>>(),
      }),
      get: withNotFoundAsUndefined(
        makeJsonEndpoint(config, {
          method: "GET",
          path: (id: S.WorkspaceId) =>
            `/dustbin/workspaces/${encodeURIComponent(id)}`,
          output: JsonDataSchema<S.DustbinWorkspace>(),
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
    },
  }

  const providers: ProvidersClient = {
    list: makeJsonEndpoint(config, {
      method: "GET",
      path: "/providers",
      output: JsonDataSchema<Array<S.ProviderConfig>>(),
    }),
    get: makeJsonEndpoint(config, {
      method: "GET",
      path: (name: string) => `/providers/${encodeURIComponent(name)}`,
      output: JsonDataSchema<S.ProviderConfig>(),
    }),
    getApiKeyStatus: async (name) => {
      const result = await makeJsonEndpoint(config, {
        method: "GET",
        path: (input: string) =>
          `/providers/${encodeURIComponent(input)}/api-key`,
        output: z.object({ configured: z.boolean() }),
      })(name)

      return result.configured
    },
    listModels: makeJsonEndpoint(config, {
      method: "GET",
      path: (options) =>
        `/providers/${encodeURIComponent(options.providerName)}/models`,
      query: (options) => {
        const query = new URLSearchParams()
        if (options.all === true) query.set("all", "true")
        return query
      },
      output: JsonDataSchema<Array<S.ModelEntry>>(),
    }),
    getModel: makeJsonEndpoint(config, {
      method: "GET",
      path: (options) =>
        `/providers/${encodeURIComponent(options.providerName)}/model`,
      query: (options) => {
        const query = new URLSearchParams()
        query.set("modelName", options.modelName)
        return query
      },
      output: JsonDataSchema<S.ModelEntry>(),
    }),
    pinModel: makeJsonEndpoint(config, {
      method: "POST",
      path: (options) =>
        `/providers/${encodeURIComponent(options.providerName)}/models/pin`,
      body: (options) => options,
      output: VoidSchema,
    }),
    unpinModel: makeJsonEndpoint(config, {
      method: "POST",
      path: (options) =>
        `/providers/${encodeURIComponent(options.providerName)}/models/unpin`,
      body: (options) => options,
      output: VoidSchema,
    }),
    setDefaultModel: makeJsonEndpoint(config, {
      method: "PUT",
      path: (options) =>
        `/providers/${encodeURIComponent(options.providerName)}/default-model`,
      body: (options) => options,
      output: VoidSchema,
    }),
    putApiKey: makeJsonEndpoint(config, {
      method: "PUT",
      path: (options) =>
        `/providers/${encodeURIComponent(options.providerName)}/api-key`,
      body: (options) => ({ key: options.key }),
      output: VoidSchema,
    }),
    deleteApiKey: makeJsonEndpoint(config, {
      method: "DELETE",
      path: (name: string) => `/providers/${encodeURIComponent(name)}/api-key`,
      output: VoidSchema,
    }),
  }

  const settings: SettingsClient = {
    get: makeJsonEndpoint(config, {
      method: "GET",
      path: "/settings",
      output: JsonDataSchema<S.Settings>(),
    }),
    put: makeJsonEndpoint(config, {
      method: "PUT",
      path: "/settings",
      body: (value) => value,
      output: VoidSchema,
    }),
  }

  return {
    health: () => healthEndpoint(),
    pages,
    workspaces,
    sessions,
    dustbin,
    providers,
    settings,
  }
}
