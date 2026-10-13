import type * as S from "@windbell/semiosis.js"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import type {
  DustbinSessionDataItem,
  HomeData,
  ProviderData,
  ProviderListData,
  SessionData,
  SessionDustbinData,
  WorkspaceData,
  WorkspaceDustbinData,
} from "../api/types.ts"

export type PageRouterOptions = {
  database: S.Database
  providers: S.ProvidersService
  settings: S.SettingsService
}

export function makePageRouter(options: PageRouterOptions): Hono {
  const app = new Hono()
  const { database, providers, settings } = options

  app.get("/home", async () => {
    const [workspaces, sessions] = await Promise.all([
      database.workspaces.list(),
      database.sessions.list({ workspaceId: undefined }),
    ])

    const data: HomeData = {
      workspaces,
      sessionsByWorkspaceId: groupSessionsByWorkspace(sessions),
    }

    return Response.json(data)
  })

  app.get("/workspaces/:workspaceId", async (c) => {
    const workspaceId = c.req.param("workspaceId")
    const workspace = await database.workspaces.get(workspaceId)

    if (workspace === undefined) {
      throw new HTTPException(404, { message: "workspace not found" })
    }

    const indexes = await database.sessions.list({ workspaceId })
    const sessions: Array<S.Session> = []

    for (const index of indexes) {
      const session = await database.sessions.get(index.id)
      if (session !== undefined) sessions.push(session)
    }

    const data: WorkspaceData = { workspace, sessions }
    return Response.json(data)
  })

  app.get("/sessions/:sessionId", async (c) => {
    const sessionId = c.req.param("sessionId")
    const session = await database.sessions.get(sessionId)

    if (session === undefined) {
      throw new HTTPException(404, { message: "session not found" })
    }

    const workspace = await database.workspaces.get(session.workspaceId)
    if (workspace === undefined) {
      throw new HTTPException(404, { message: "workspace not found" })
    }

    const data: SessionData = { session, workspace }
    return Response.json(data)
  })

  app.get("/session-dustbin", async (c) => {
    const workspaceId = c.req.query("workspaceId")
    const indexes = await database.dustbin.sessions.list({
      workspaceId: workspaceId === "" ? undefined : workspaceId,
    })
    const sessions: Array<DustbinSessionDataItem> = []

    for (const index of indexes) {
      const session = await database.dustbin.sessions.get(index.id)
      sessions.push({
        ...index,
        context: session?.context ?? [],
      })
    }

    const data: SessionDustbinData = { sessions }
    return Response.json(data)
  })

  app.get("/workspace-dustbin", async () => {
    const [workspaces, sessions] = await Promise.all([
      database.dustbin.workspaces.list(),
      database.dustbin.sessions.list({ workspaceId: undefined }),
    ])

    const data: WorkspaceDustbinData = {
      workspaces,
      sessionsByWorkspaceId: groupSessionsByWorkspace(sessions),
    }

    return Response.json(data)
  })

  app.get("/provider-list", async () => {
    const [providerConfigs, currentSettings] = await Promise.all([
      providers.list(),
      settings.get(),
    ])
    const entries = []

    for (const providerConfig of providerConfigs) {
      const [apiKeyConfigured, models] = await Promise.all([
        providers.getApiKeyStatus(providerConfig.name),
        providers.listModels({ providerName: providerConfig.name }),
      ])

      entries.push({
        name: providerConfig.name,
        baseUrl: providerConfig.baseUrl,
        defaultModel: providerConfig.defaultModel,
        apiKeyConfigured,
        isDefaultProvider:
          currentSettings.defaultProvider === providerConfig.name,
        models: models.map((model) => ({
          name: model.name,
          pinned: model.pinned,
          isDefault: providerConfig.defaultModel === model.name,
        })),
      })
    }

    const data: ProviderListData = { providers: entries }
    return Response.json(data)
  })

  app.get("/providers/:providerName", async (c) => {
    const providerName = c.req.param("providerName")
    const [providerConfigs, currentSettings, apiKeyConfigured, localModels] =
      await Promise.all([
        providers.list(),
        settings.get(),
        providers.getApiKeyStatus(providerName),
        providers.listModels({ providerName }),
      ])
    const providerConfig = providerConfigs.find(
      (config) => config.name === providerName,
    )

    if (providerConfig === undefined) {
      throw new HTTPException(404, { message: "provider not found" })
    }

    let models = localModels
    let warning: string | undefined

    if (apiKeyConfigured) {
      try {
        models = await providers.listModels({
          providerName,
          all: true,
        })
      } catch (error) {
        warning = error instanceof Error ? error.message : String(error)
      }
    } else {
      warning = "api key is not configured; showing local models only"
    }

    const data: ProviderData = {
      providerConfig,
      apiKeyConfigured,
      isDefaultProvider: currentSettings.defaultProvider === providerName,
      warning,
      models,
    }

    return Response.json(data)
  })

  app.onError((error) => {
    const status = error instanceof HTTPException ? error.status : 500
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ error: { message } }, { status })
  })

  return app
}

function groupSessionsByWorkspace<T extends { workspaceId: S.WorkspaceId }>(
  sessions: Array<T>,
): Record<S.WorkspaceId, Array<T>> {
  const grouped: Record<S.WorkspaceId, Array<T>> = {}

  for (const session of sessions) {
    grouped[session.workspaceId] ??= []
    grouped[session.workspaceId].push(session)
  }

  return grouped
}
