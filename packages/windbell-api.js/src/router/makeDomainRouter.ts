import type * as S from "@windbell/semiosis.js"
import { Hono } from "hono"
import { stream } from "hono/streaming"
import { makeDustbinSessionController } from "../controllers/DustbinSessionController.ts"
import { makeDustbinWorkspaceController } from "../controllers/DustbinWorkspaceController.ts"
import { makeProviderController } from "../controllers/ProviderController.ts"
import { makeSessionController } from "../controllers/SessionController.ts"
import { makeSettingsController } from "../controllers/SettingsController.ts"
import { makeWorkspaceController } from "../controllers/WorkspaceController.ts"
import { readJsonBody, readRecord, readString } from "./readJson.ts"

export type DomainRouterOptions = {
  database: S.Database
  sessions: S.SessionService
  workspaces: S.WorkspaceService
  dustbinSessions: S.DustbinSessionService
  dustbinWorkspaces: S.DustbinWorkspaceService
  providers: S.ProviderService
  settings: S.SettingsService
}

export function makeDomainRouter(options: DomainRouterOptions): Hono {
  const app = new Hono()
  const {
    sessions: sessionsService,
    workspaces: workspacesService,
    dustbinSessions: dustbinSessionService,
    dustbinWorkspaces: dustbinWorkspaceService,
    providers: providersService,
    settings: settingsService,
  } = options

  const workspaceController = makeWorkspaceController({
    workspaces: workspacesService,
  })

  const sessions = makeSessionController({
    sessions: sessionsService,
  })

  const dustbinSessions = makeDustbinSessionController({
    dustbinSessions: dustbinSessionService,
  })

  const dustbinWorkspaces = makeDustbinWorkspaceController({
    dustbinWorkspaces: dustbinWorkspaceService,
  })

  const providers = makeProviderController({
    providers: providersService,
  })

  const settings = makeSettingsController({
    settings: settingsService,
  })

  app.get("/workspaces", () => workspaceController.list({}))

  app.post("/workspaces/ensure", async (c) => {
    const body = readRecord(await readJsonBody(c))
    return workspaceController.ensure({
      name: readString(body, "name"),
      root: readString(body, "root"),
    })
  })

  app.get("/workspaces/:workspaceId", (c) =>
    workspaceController.get({ workspaceId: c.req.param("workspaceId") }),
  )

  app.put("/workspaces/:workspaceId", async (c) => {
    const workspace = (await readJsonBody(c)) as S.Workspace
    return workspaceController.put({
      workspaceId: c.req.param("workspaceId"),
      workspace,
    })
  })

  app.delete("/workspaces/:workspaceId", (c) =>
    workspaceController.remove({ workspaceId: c.req.param("workspaceId") }),
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
            retryable: false,
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
