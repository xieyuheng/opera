import {
  makeJsonEndpoint,
  mergeHeaders,
  requestNdjson,
  resolveHeaders,
  withNotFoundAsUndefined,
  type HeaderSource,
} from "@xieyuheng/http.ts"
import type * as W from "@xieyuheng/windbell.ts"
import { z } from "zod"

import type {
  HomeData,
  ProviderData,
  ProviderListData,
  SessionData,
  SessionDustbinPageData,
  WorkspaceDustbinData,
  WorkspacePageData,
} from "../api/types.ts"
import type { WindbellHealth } from "../services/Health.ts"
import type { Theme, ThemeInput } from "../theme/Theme.ts"
import { JsonDataSchema, VoidSchema } from "./schemas.ts"

export type { Theme, ThemeInput } from "../theme/Theme.ts"

export type WindbellClientConfig = {
  baseUrl: string
  headers?: HeaderSource
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
  themes: ThemesClient
}

export type PagesClient = {
  loadHomeData(): Promise<HomeData>
  loadWorkspaceData(options: {
    workspaceId: W.WorkspaceId
    previewLimit: number
    limit?: number
    cursor?: string
  }): Promise<WorkspacePageData>
  loadSessionData(options: { sessionId: W.SessionId }): Promise<SessionData>
  loadSessionDustbinData(options: {
    workspaceId: W.WorkspaceId
    previewLimit: number
  }): Promise<SessionDustbinPageData>
  loadWorkspaceDustbinData(): Promise<WorkspaceDustbinData>
  loadProviderListData(): Promise<ProviderListData>
  loadProviderData(options: { providerName: string }): Promise<ProviderData>
}

export type WorkspacesClient = {
  list(): Promise<Array<W.Workspace>>
  ensure(options: { name: string; root: string }): Promise<W.Workspace>
  get(id: W.WorkspaceId): Promise<W.Workspace | undefined>
  put(workspace: W.Workspace): Promise<void>
  remove(id: W.WorkspaceId): Promise<void>
}

export type SessionsClient = {
  list(options: {
    workspaceId: W.WorkspaceId | undefined
  }): Promise<Array<W.SessionIndex>>
  make(options: {
    workspaceId: W.WorkspaceId
    title: string
  }): Promise<W.Session>
  get(id: W.SessionId): Promise<W.Session | undefined>
  put(session: W.Session): Promise<void>
  patch(options: { sessionId: W.SessionId; title: string }): Promise<void>
  generateTitle(options: {
    sessionId: W.SessionId
    model: W.ModelRef
  }): Promise<string>
  getUsage(options: { sessionId: W.SessionId }): Promise<W.SessionUsage>
  listTurns(options: {
    sessionId: W.SessionId
    details?: false
  }): Promise<Array<W.Turn>>
  listTurns(options: {
    sessionId: W.SessionId
    details: true
  }): Promise<Array<W.TurnDetails>>
  interpret(options: {
    sessionId: W.SessionId
    model: W.ModelRef
    turnId: string
    input: Array<W.Sign>
    signal?: AbortSignal
  }): AsyncGenerator<W.TurnEvent>
  remove(id: W.SessionId): Promise<void>
}

export type DustbinSessionsClient = {
  list(options: {
    workspaceId: W.WorkspaceId | undefined
  }): Promise<Array<W.DustbinSessionIndex>>
  get(id: W.SessionId): Promise<W.Session | undefined>
  trash(id: W.SessionId): Promise<void>
  restore(id: W.SessionId): Promise<void>
  remove(id: W.SessionId): Promise<void>
}

export type DustbinWorkspacesClient = {
  list(): Promise<Array<W.DustbinWorkspace>>
  get(id: W.WorkspaceId): Promise<W.DustbinWorkspace | undefined>
  trash(id: W.WorkspaceId): Promise<void>
  restore(id: W.WorkspaceId): Promise<void>
  remove(id: W.WorkspaceId): Promise<void>
}

export type ProvidersClient = {
  list(): Promise<Array<W.ProviderConfig>>
  get(name: string): Promise<W.ProviderConfig>
  getApiKeyStatus(name: string): Promise<boolean>
  listModels(options: {
    providerName: string
    all?: boolean
  }): Promise<Array<W.ModelEntry>>
  getModel(options: {
    providerName: string
    modelName: string
  }): Promise<W.ModelEntry>
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
  get(): Promise<W.Settings>
  put(settings: W.Settings): Promise<void>
}

export type ThemesClient = {
  list(): Promise<Array<Theme>>
  get(themeId: string): Promise<Theme | undefined>
  create(input: ThemeInput): Promise<Theme>
  put(options: { themeId: string; theme: ThemeInput }): Promise<Theme>
  remove(themeId: string): Promise<void>
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
      query: (options) => {
        const query = new URLSearchParams()
        query.set("previewLimit", String(options.previewLimit))
        if (options.limit !== undefined) {
          query.set("limit", String(options.limit))
        }
        if (options.cursor !== undefined) {
          query.set("cursor", options.cursor)
        }
        return query
      },
      output: JsonDataSchema<WorkspacePageData>(),
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
        query.set("previewLimit", String(options.previewLimit))
        return query
      },
      output: JsonDataSchema<SessionDustbinPageData>(),
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
      output: JsonDataSchema<Array<W.Workspace>>(),
    }),
    ensure: makeJsonEndpoint(config, {
      method: "POST",
      path: "/workspaces/ensure",
      body: (options) => options,
      output: JsonDataSchema<W.Workspace>(),
    }),
    get: withNotFoundAsUndefined(
      makeJsonEndpoint(config, {
        method: "GET",
        path: (id: W.WorkspaceId) => `/workspaces/${encodeURIComponent(id)}`,
        output: JsonDataSchema<W.Workspace>(),
      }),
    ),
    put: makeJsonEndpoint(config, {
      method: "PUT",
      path: (workspace: W.Workspace) =>
        `/workspaces/${encodeURIComponent(workspace.id)}`,
      body: (workspace) => workspace,
      output: VoidSchema,
    }),
    remove: makeJsonEndpoint(config, {
      method: "DELETE",
      path: (id: W.WorkspaceId) => `/workspaces/${encodeURIComponent(id)}`,
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
      output: JsonDataSchema<Array<W.SessionIndex>>(),
    }),
    make: makeJsonEndpoint(config, {
      method: "POST",
      path: "/sessions",
      body: (options) => options,
      output: JsonDataSchema<W.Session>(),
    }),
    get: withNotFoundAsUndefined(
      makeJsonEndpoint(config, {
        method: "GET",
        path: (id: W.SessionId) => `/sessions/${encodeURIComponent(id)}`,
        output: JsonDataSchema<W.Session>(),
      }),
    ),
    put: makeJsonEndpoint(config, {
      method: "PUT",
      path: (session: W.Session) =>
        `/sessions/${encodeURIComponent(session.id)}`,
      body: (session) => session,
      output: VoidSchema,
    }),
    patch: makeJsonEndpoint(config, {
      method: "PATCH",
      path: (options: { sessionId: W.SessionId; title: string }) =>
        `/sessions/${encodeURIComponent(options.sessionId)}`,
      body: (options) => ({ title: options.title }),
      output: VoidSchema,
    }),
    async generateTitle(options) {
      const result = await makeJsonEndpoint(config, {
        method: "POST",
        path: (input: { sessionId: W.SessionId; model: W.ModelRef }) =>
          `/sessions/${encodeURIComponent(input.sessionId)}/title`,
        body: (input) => input,
        output: z.object({ title: z.string() }),
      })(options)

      return result.title
    },
    getUsage: makeJsonEndpoint(config, {
      method: "GET",
      path: (options) =>
        `/sessions/${encodeURIComponent(options.sessionId)}/usage`,
      output: JsonDataSchema<W.SessionUsage>(),
    }),
    listTurns: makeJsonEndpoint(config, {
      method: "GET",
      path: (options) =>
        `/sessions/${encodeURIComponent(options.sessionId)}/turns`,
      query: (options) => {
        const query = new URLSearchParams()
        if (options.details === true) {
          query.set("details", "true")
        }
        return query
      },
      output: JsonDataSchema<Array<W.Turn | W.TurnDetails>>(),
    }) as SessionsClient["listTurns"],
    async *interpret(options) {
      for await (const event of requestNdjson<W.TurnEvent>({
        baseUrl: config.baseUrl,
        method: "POST",
        path: `/sessions/${encodeURIComponent(options.sessionId)}/interpret`,
        body: {
          model: options.model,
          turnId: options.turnId,
          input: options.input,
        },
        headers: mergeHeaders(resolveHeaders(config.headers)),
        signal: options.signal,
      })) {
        yield event
      }
    },
    remove: makeJsonEndpoint(config, {
      method: "DELETE",
      path: (id: W.SessionId) => `/sessions/${encodeURIComponent(id)}`,
      output: VoidSchema,
    }),
  }

  const dustbin = {
    sessions: {
      list: makeJsonEndpoint(config, {
        method: "GET",
        path: "/dustbin/sessions",
        query: (options: { workspaceId: W.WorkspaceId | undefined }) => {
          const query = new URLSearchParams()
          if (options.workspaceId !== undefined) {
            query.set("workspaceId", options.workspaceId)
          }
          return query
        },
        output: JsonDataSchema<Array<W.DustbinSessionIndex>>(),
      }),
      get: withNotFoundAsUndefined(
        makeJsonEndpoint(config, {
          method: "GET",
          path: (id: W.SessionId) =>
            `/dustbin/sessions/${encodeURIComponent(id)}`,
          output: JsonDataSchema<W.Session>(),
        }),
      ),
      trash: makeJsonEndpoint(config, {
        method: "POST",
        path: "/dustbin/sessions",
        body: (id: W.SessionId) => ({ sessionId: id }),
        output: VoidSchema,
      }),
      restore: makeJsonEndpoint(config, {
        method: "POST",
        path: (id: W.SessionId) =>
          `/dustbin/sessions/${encodeURIComponent(id)}/restore`,
        output: VoidSchema,
      }),
      remove: makeJsonEndpoint(config, {
        method: "DELETE",
        path: (id: W.SessionId) =>
          `/dustbin/sessions/${encodeURIComponent(id)}`,
        output: VoidSchema,
      }),
    },
    workspaces: {
      list: makeJsonEndpoint(config, {
        method: "GET",
        path: "/dustbin/workspaces",
        output: JsonDataSchema<Array<W.DustbinWorkspace>>(),
      }),
      get: withNotFoundAsUndefined(
        makeJsonEndpoint(config, {
          method: "GET",
          path: (id: W.WorkspaceId) =>
            `/dustbin/workspaces/${encodeURIComponent(id)}`,
          output: JsonDataSchema<W.DustbinWorkspace>(),
        }),
      ),
      trash: makeJsonEndpoint(config, {
        method: "POST",
        path: "/dustbin/workspaces",
        body: (id: W.WorkspaceId) => ({ workspaceId: id }),
        output: VoidSchema,
      }),
      restore: makeJsonEndpoint(config, {
        method: "POST",
        path: (id: W.WorkspaceId) =>
          `/dustbin/workspaces/${encodeURIComponent(id)}/restore`,
        output: VoidSchema,
      }),
      remove: makeJsonEndpoint(config, {
        method: "DELETE",
        path: (id: W.WorkspaceId) =>
          `/dustbin/workspaces/${encodeURIComponent(id)}`,
        output: VoidSchema,
      }),
    },
  }

  const providers: ProvidersClient = {
    list: makeJsonEndpoint(config, {
      method: "GET",
      path: "/providers",
      output: JsonDataSchema<Array<W.ProviderConfig>>(),
    }),
    get: makeJsonEndpoint(config, {
      method: "GET",
      path: (name: string) => `/providers/${encodeURIComponent(name)}`,
      output: JsonDataSchema<W.ProviderConfig>(),
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
      output: JsonDataSchema<Array<W.ModelEntry>>(),
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
      output: JsonDataSchema<W.ModelEntry>(),
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
      output: JsonDataSchema<W.Settings>(),
    }),
    put: makeJsonEndpoint(config, {
      method: "PUT",
      path: "/settings",
      body: (value) => value,
      output: VoidSchema,
    }),
  }

  const themes: ThemesClient = {
    list: makeJsonEndpoint(config, {
      method: "GET",
      path: "/themes",
      output: JsonDataSchema<Array<Theme>>(),
    }),
    get: withNotFoundAsUndefined(
      makeJsonEndpoint(config, {
        method: "GET",
        path: (themeId: string) => `/themes/${encodeURIComponent(themeId)}`,
        output: JsonDataSchema<Theme>(),
      }),
    ),
    create: makeJsonEndpoint(config, {
      method: "POST",
      path: "/themes",
      body: (input: ThemeInput) => input,
      output: JsonDataSchema<Theme>(),
    }),
    put: makeJsonEndpoint(config, {
      method: "PUT",
      path: (options: { themeId: string; theme: ThemeInput }) =>
        `/themes/${encodeURIComponent(options.themeId)}`,
      body: (options) => options.theme,
      output: JsonDataSchema<Theme>(),
    }),
    remove: makeJsonEndpoint(config, {
      method: "DELETE",
      path: (themeId: string) => `/themes/${encodeURIComponent(themeId)}`,
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
    themes,
  }
}
