import type * as S from "@windbell/semiosis.js"
import { Hono } from "hono"
import { stream } from "hono/streaming"
import * as SessionsServices from "../services/Sessions.ts"
import * as WorkspacesServices from "../services/Workspaces.ts"
import * as DustbinSessionsServices from "../services/DustbinSessions.ts"
import * as DustbinWorkspacesServices from "../services/DustbinWorkspaces.ts"
import * as ProvidersServices from "../services/Providers.ts"
import * as SettingsServices from "../services/Settings.ts"
import { makeDustbinSessionsController } from "../controllers/DustbinSessionsController.ts"
import { makeDustbinWorkspacesController } from "../controllers/DustbinWorkspacesController.ts"
import { makeProvidersController } from "../controllers/ProvidersController.ts"
import { makeSessionsController } from "../controllers/SessionsController.ts"
import { makeSettingsController } from "../controllers/SettingsController.ts"
import { makeWorkspacesController } from "../controllers/WorkspacesController.ts"
import { readJsonBody, readRecord, readString } from "./readJson.ts"

export type DomainRouterOptions = {
  database: S.Database
  sessions: S.SessionsService
  workspaces: S.WorkspacesService
  dustbinSessions: S.DustbinSessionsService
  dustbinWorkspaces: S.DustbinWorkspacesService
  providers: S.ProvidersService
  settings: S.SettingsService
}

export function makeDomainRouter(options: DomainRouterOptions): Hono {
  const app = new Hono()
  const {
    sessions: sessionsService,
    workspaces: workspacesService,
    dustbinSessions: dustbinSessionsService,
    dustbinWorkspaces: dustbinWorkspacesService,
    providers: providersService,
    settings: settingsService,
  } = options

  const workspaces = makeWorkspacesController({
    listWorkspaces: WorkspacesServices.ListWorkspaces({
      workspaces: workspacesService,
    }),
    ensureWorkspace: WorkspacesServices.EnsureWorkspace({
      workspaces: workspacesService,
    }),
    getWorkspace: WorkspacesServices.GetWorkspace({
      workspaces: workspacesService,
    }),
    putWorkspace: WorkspacesServices.PutWorkspace({
      workspaces: workspacesService,
    }),
    removeWorkspace: WorkspacesServices.RemoveWorkspace({
      workspaces: workspacesService,
    }),
  })

  const sessions = makeSessionsController({
    listSessions: SessionsServices.ListSessions({ sessions: sessionsService }),
    makeSession: SessionsServices.MakeSession({ sessions: sessionsService }),
    getSession: SessionsServices.GetSession({ sessions: sessionsService }),
    putSession: SessionsServices.PutSession({ sessions: sessionsService }),
    removeSession: SessionsServices.RemoveSession({
      sessions: sessionsService,
    }),
    generateSessionTitle: SessionsServices.GenerateSessionTitle({
      sessions: sessionsService,
    }),
  })

  const dustbinSessions = makeDustbinSessionsController({
    listDustbinSessions: DustbinSessionsServices.ListDustbinSessions({
      dustbinSessions: dustbinSessionsService,
    }),
    getDustbinSession: DustbinSessionsServices.GetDustbinSession({
      dustbinSessions: dustbinSessionsService,
    }),
    trashDustbinSession: DustbinSessionsServices.TrashDustbinSession({
      dustbinSessions: dustbinSessionsService,
    }),
    restoreDustbinSession: DustbinSessionsServices.RestoreDustbinSession({
      dustbinSessions: dustbinSessionsService,
    }),
    removeDustbinSession: DustbinSessionsServices.RemoveDustbinSession({
      dustbinSessions: dustbinSessionsService,
    }),
  })

  const dustbinWorkspaces = makeDustbinWorkspacesController({
    listDustbinWorkspaces: DustbinWorkspacesServices.ListDustbinWorkspaces({
      dustbinWorkspaces: dustbinWorkspacesService,
    }),
    getDustbinWorkspace: DustbinWorkspacesServices.GetDustbinWorkspace({
      dustbinWorkspaces: dustbinWorkspacesService,
    }),
    trashDustbinWorkspace: DustbinWorkspacesServices.TrashDustbinWorkspace({
      dustbinWorkspaces: dustbinWorkspacesService,
    }),
    restoreDustbinWorkspace: DustbinWorkspacesServices.RestoreDustbinWorkspace({
      dustbinWorkspaces: dustbinWorkspacesService,
    }),
    removeDustbinWorkspace: DustbinWorkspacesServices.RemoveDustbinWorkspace({
      dustbinWorkspaces: dustbinWorkspacesService,
    }),
  })

  const providers = makeProvidersController({
    listProviders: ProvidersServices.ListProviders({
      providers: providersService,
    }),
    getProvider: ProvidersServices.GetProvider({ providers: providersService }),
    getProviderApiKeyStatus: ProvidersServices.GetProviderApiKeyStatus({
      providers: providersService,
    }),
    putProviderApiKey: ProvidersServices.PutProviderApiKey({
      providers: providersService,
    }),
    deleteProviderApiKey: ProvidersServices.DeleteProviderApiKey({
      providers: providersService,
    }),
    listProviderModels: ProvidersServices.ListProviderModels({
      providers: providersService,
    }),
    pinProviderModel: ProvidersServices.PinProviderModel({
      providers: providersService,
    }),
    unpinProviderModel: ProvidersServices.UnpinProviderModel({
      providers: providersService,
    }),
    setProviderDefaultModel: ProvidersServices.SetProviderDefaultModel({
      providers: providersService,
    }),
  })

  const settings = makeSettingsController({
    getSettings: SettingsServices.GetSettings({ settings: settingsService }),
    putSettings: SettingsServices.PutSettings({ settings: settingsService }),
  })

  app.get("/workspaces", () => workspaces.list({}))

  app.post("/workspaces/ensure", async (c) => {
    const body = readRecord(await readJsonBody(c))
    return workspaces.ensure({
      name: readString(body, "name"),
      root: readString(body, "root"),
    })
  })

  app.get("/workspaces/:workspaceId", (c) =>
    workspaces.get({ workspaceId: c.req.param("workspaceId") }),
  )

  app.put("/workspaces/:workspaceId", async (c) => {
    const workspace = (await readJsonBody(c)) as S.Workspace
    return workspaces.put({
      workspaceId: c.req.param("workspaceId"),
      workspace,
    })
  })

  app.delete("/workspaces/:workspaceId", (c) =>
    workspaces.remove({ workspaceId: c.req.param("workspaceId") }),
  )

  app.get("/sessions", (c) =>
    sessions.list({ workspaceId: c.req.query("workspaceId") || undefined }),
  )

  app.post("/sessions", async (c) => {
    const body = readRecord(await readJsonBody(c))
    return sessions.make({
      workspaceId: readString(body, "workspaceId"),
      title: readString(body, "title"),
    })
  })

  app.get("/sessions/:sessionId", (c) =>
    sessions.get({ sessionId: c.req.param("sessionId") }),
  )

  app.put("/sessions/:sessionId", async (c) => {
    const session = (await readJsonBody(c)) as S.Session
    return sessions.put({
      sessionId: c.req.param("sessionId"),
      session,
    })
  })

  app.delete("/sessions/:sessionId", (c) =>
    sessions.remove({ sessionId: c.req.param("sessionId") }),
  )

  app.post("/sessions/:sessionId/title", async (c) => {
    const body = readRecord(await readJsonBody(c))
    const model = body.model as { providerName: string; name: string }
    return sessions.generateTitle({
      sessionId: c.req.param("sessionId"),
      model,
    })
  })

  app.post("/sessions/:sessionId/interpret", async (c) => {
    const sessionId = c.req.param("sessionId")
    const body = readRecord(await readJsonBody(c))
    const model = body.model as { providerName: string; name: string }
    const turnId = readString(body, "turnId")
    const input = body.input as Array<S.Sign>

    c.header("Content-Type", "application/x-ndjson; charset=utf-8")
    c.header("Cache-Control", "no-store")
    c.header("X-Accel-Buffering", "no")

    return stream(c, async (stream) => {
      try {
        for await (const event of sessionsService.interpret({
          sessionId,
          model,
          turnId,
          input,
          signal: c.req.raw.signal,
        })) {
          await stream.writeln(JSON.stringify(event))
        }
      } catch (error) {
        if (stream.aborted) return
        await stream.writeln(
          JSON.stringify({
            type: "error",
            message: error instanceof Error ? error.message : String(error),
            retryable: isRetryableError(error),
            inputPersisted: false,
          }),
        )
      }
    })
  })

  app.get("/dustbin/sessions", (c) =>
    dustbinSessions.list({
      workspaceId: c.req.query("workspaceId") || undefined,
    }),
  )

  app.get("/dustbin/sessions/:sessionId", (c) =>
    dustbinSessions.get({ sessionId: c.req.param("sessionId") }),
  )

  app.post("/dustbin/sessions", async (c) => {
    const body = readRecord(await readJsonBody(c))
    return dustbinSessions.trash({
      sessionId: readString(body, "sessionId"),
    })
  })

  app.post("/dustbin/sessions/:sessionId/restore", (c) =>
    dustbinSessions.restore({ sessionId: c.req.param("sessionId") }),
  )

  app.delete("/dustbin/sessions/:sessionId", (c) =>
    dustbinSessions.remove({ sessionId: c.req.param("sessionId") }),
  )

  app.get("/dustbin/workspaces", () => dustbinWorkspaces.list({}))

  app.get("/dustbin/workspaces/:workspaceId", (c) =>
    dustbinWorkspaces.get({ workspaceId: c.req.param("workspaceId") }),
  )

  app.post("/dustbin/workspaces", async (c) => {
    const body = readRecord(await readJsonBody(c))
    return dustbinWorkspaces.trash({
      workspaceId: readString(body, "workspaceId"),
    })
  })

  app.post("/dustbin/workspaces/:workspaceId/restore", (c) =>
    dustbinWorkspaces.restore({ workspaceId: c.req.param("workspaceId") }),
  )

  app.delete("/dustbin/workspaces/:workspaceId", (c) =>
    dustbinWorkspaces.remove({ workspaceId: c.req.param("workspaceId") }),
  )

  app.get("/providers", () => providers.list({}))

  app.get("/providers/:providerName", (c) =>
    providers.get({ providerName: c.req.param("providerName") }),
  )

  app.get("/providers/:providerName/api-key", (c) =>
    providers.getApiKeyStatus({
      providerName: c.req.param("providerName"),
    }),
  )

  app.put("/providers/:providerName/api-key", async (c) => {
    const body = readRecord(await readJsonBody(c))
    return providers.putApiKey({
      providerName: c.req.param("providerName"),
      key: readString(body, "key"),
    })
  })

  app.delete("/providers/:providerName/api-key", (c) =>
    providers.deleteApiKey({
      providerName: c.req.param("providerName"),
    }),
  )

  app.get("/providers/:providerName/models", (c) =>
    providers.listModels({
      providerName: c.req.param("providerName"),
      all: c.req.query("all") === "true",
    }),
  )

  app.post("/providers/:providerName/models/pin", async (c) => {
    const body = readRecord(await readJsonBody(c))
    return providers.pinModel({
      providerName: c.req.param("providerName"),
      modelName: readString(body, "modelName"),
    })
  })

  app.post("/providers/:providerName/models/unpin", async (c) => {
    const body = readRecord(await readJsonBody(c))
    return providers.unpinModel({
      providerName: c.req.param("providerName"),
      modelName: readString(body, "modelName"),
    })
  })

  app.put("/providers/:providerName/default-model", async (c) => {
    const body = readRecord(await readJsonBody(c))
    return providers.setDefaultModel({
      providerName: c.req.param("providerName"),
      modelName: readString(body, "modelName"),
    })
  })

  app.get("/settings", () => settings.get({}))

  app.put("/settings", async (c) => {
    const value = (await readJsonBody(c)) as S.Settings
    return settings.put({ settings: value })
  })

  app.onError((error) => sendError(error))

  return app
}

function sendError(error: unknown): Response {
  const status = getHttpStatus(error)
  const message = error instanceof Error ? error.message : String(error)
  return Response.json({ error: { message } }, { status })
}

function getHttpStatus(error: unknown): number {
  if (error !== null && typeof error === "object") {
    const status = (error as { status?: unknown }).status
    if (typeof status === "number") return status
  }

  return 500
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError) return true

  if (error !== null && typeof error === "object") {
    const status = (error as { status?: unknown }).status
    if (typeof status === "number") {
      return status === 408 || status === 429 || status >= 500
    }
  }

  return false
}
