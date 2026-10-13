import type * as S from "@windbell/semiosis.js"
import { Hono, type Context } from "hono"
import { HTTPException } from "hono/http-exception"
import { stream } from "hono/streaming"
import {
  readBoolean,
  readJsonBody,
  readRecord,
  readString,
} from "./readJson.ts"

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
    database,
    sessions,
    workspaces,
    dustbinSessions,
    dustbinWorkspaces,
    providers,
    settings,
  } = options

  app.get("/workspaces", async () => {
    return Response.json(await workspaces.list())
  })

  app.post("/workspaces/ensure", async (c) => {
    const body = readRecord(await readJsonBody(c))
    const name = readString(body, "name")
    const root = readString(body, "root")
    return Response.json(await workspaces.ensure({ name, root }))
  })

  app.get("/workspaces/:workspaceId", async (c) => {
    const workspace = await workspaces.get(c.req.param("workspaceId"))
    if (workspace === undefined) {
      throw new HTTPException(404, { message: "workspace not found" })
    }
    return Response.json(workspace)
  })

  app.put("/workspaces/:workspaceId", async (c) => {
    const workspace = (await readJsonBody(c)) as S.Workspace
    if (workspace.id !== c.req.param("workspaceId")) {
      throw new HTTPException(400, { message: "workspace id mismatch" })
    }
    await workspaces.put(workspace)
    return Response.json(null)
  })

  app.delete("/workspaces/:workspaceId", async (c) => {
    await workspaces.remove(c.req.param("workspaceId"))
    return Response.json(null)
  })

  app.get("/sessions", async (c) => {
    const workspaceId = c.req.query("workspaceId")
    return Response.json(
      await sessions.list({
        workspaceId: workspaceId === "" ? undefined : workspaceId,
      }),
    )
  })

  app.post("/sessions", async (c) => {
    const body = readRecord(await readJsonBody(c))
    return Response.json(
      await sessions.make({
        workspaceId: readString(body, "workspaceId"),
        title: readString(body, "title"),
      }),
      { status: 201 },
    )
  })

  app.get("/sessions/:sessionId", async (c) => {
    const session = await sessions.get(c.req.param("sessionId"))
    if (session === undefined) {
      throw new HTTPException(404, { message: "session not found" })
    }
    return Response.json(session)
  })

  app.put("/sessions/:sessionId", async (c) => {
    const session = (await readJsonBody(c)) as S.Session
    if (session.id !== c.req.param("sessionId")) {
      throw new HTTPException(400, { message: "session id mismatch" })
    }
    await sessions.put(session)
    return Response.json(null)
  })

  app.delete("/sessions/:sessionId", async (c) => {
    await sessions.remove(c.req.param("sessionId"))
    return Response.json(null)
  })

  app.post("/sessions/:sessionId/title", async (c) => {
    const sessionId = c.req.param("sessionId")
    const body = readRecord(await readJsonBody(c))
    const model = body.model as { providerName: string; name: string }
    const title = await sessions.generateTitle({ sessionId, model })
    return Response.json({ title })
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
        for await (const event of sessions.interpret({
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

  app.get("/dustbin/sessions", async (c) => {
    const workspaceId = c.req.query("workspaceId")
    return Response.json(
      await dustbinSessions.list({
        workspaceId: workspaceId === "" ? undefined : workspaceId,
      }),
    )
  })

  app.get("/dustbin/sessions/:sessionId", async (c) => {
    const session = await dustbinSessions.get(c.req.param("sessionId"))
    if (session === undefined) {
      throw new HTTPException(404, { message: "session not found" })
    }
    return Response.json(session)
  })

  app.post("/dustbin/sessions", async (c) => {
    const body = readRecord(await readJsonBody(c))
    await dustbinSessions.trash(readString(body, "sessionId"))
    return Response.json(null)
  })

  app.post("/dustbin/sessions/:sessionId/restore", async (c) => {
    await dustbinSessions.restore(c.req.param("sessionId"))
    return Response.json(null)
  })

  app.delete("/dustbin/sessions/:sessionId", async (c) => {
    await dustbinSessions.remove(c.req.param("sessionId"))
    return Response.json(null)
  })

  app.get("/dustbin/workspaces", async () => {
    return Response.json(await dustbinWorkspaces.list())
  })

  app.get("/dustbin/workspaces/:workspaceId", async (c) => {
    const workspace = await dustbinWorkspaces.get(c.req.param("workspaceId"))
    if (workspace === undefined) {
      throw new HTTPException(404, { message: "workspace not found" })
    }
    return Response.json(workspace)
  })

  app.post("/dustbin/workspaces", async (c) => {
    const body = readRecord(await readJsonBody(c))
    await dustbinWorkspaces.trash(readString(body, "workspaceId"))
    return Response.json(null)
  })

  app.post("/dustbin/workspaces/:workspaceId/restore", async (c) => {
    await dustbinWorkspaces.restore(c.req.param("workspaceId"))
    return Response.json(null)
  })

  app.delete("/dustbin/workspaces/:workspaceId", async (c) => {
    await dustbinWorkspaces.remove(c.req.param("workspaceId"))
    return Response.json(null)
  })

  app.get("/providers", async () => {
    return Response.json(await providers.list())
  })

  app.get("/providers/:providerName", async (c) => {
    return Response.json(await providers.get(c.req.param("providerName")))
  })

  app.get("/providers/:providerName/api-key", async (c) => {
    return Response.json({
      configured: await providers.getApiKeyStatus(c.req.param("providerName")),
    })
  })

  app.put("/providers/:providerName/api-key", async (c) => {
    const body = readRecord(await readJsonBody(c))
    await providers.putApiKey({
      providerName: c.req.param("providerName"),
      key: readString(body, "key"),
    })
    return Response.json(null)
  })

  app.delete("/providers/:providerName/api-key", async (c) => {
    await providers.deleteApiKey(c.req.param("providerName"))
    return Response.json(null)
  })

  app.get("/providers/:providerName/models", async (c) => {
    const all = c.req.query("all") === "true"
    return Response.json(
      await providers.listModels({
        providerName: c.req.param("providerName"),
        all,
      }),
    )
  })

  app.post("/providers/:providerName/models/pin", async (c) => {
    const body = readRecord(await readJsonBody(c))
    await providers.pinModel({
      providerName: c.req.param("providerName"),
      modelName: readString(body, "modelName"),
    })
    return Response.json(null)
  })

  app.post("/providers/:providerName/models/unpin", async (c) => {
    const body = readRecord(await readJsonBody(c))
    await providers.unpinModel({
      providerName: c.req.param("providerName"),
      modelName: readString(body, "modelName"),
    })
    return Response.json(null)
  })

  app.put("/providers/:providerName/default-model", async (c) => {
    const body = readRecord(await readJsonBody(c))
    await providers.setDefaultModel({
      providerName: c.req.param("providerName"),
      modelName: readString(body, "modelName"),
    })
    return Response.json(null)
  })

  app.get("/settings", async () => {
    return Response.json(await settings.get())
  })

  app.put("/settings", async (c) => {
    const body = (await readJsonBody(c)) as S.Settings
    await settings.put(body)
    return Response.json(null)
  })

  app.onError((error) => sendError(error))

  return app
}

function sendError(error: unknown): Response {
  const status = error instanceof HTTPException ? error.status : 500
  const message = error instanceof Error ? error.message : String(error)
  return Response.json({ error: { message } }, { status })
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
