import * as S from "@windbell/semiosis.js/node"
import { Hono, type Context } from "hono"
import { stream } from "hono/streaming"
import { HTTPException } from "hono/http-exception"
import type { SemiosisRouterOptions } from "./SemiosisRouterOptions.ts"

export function makeSemiosisRouter(options: SemiosisRouterOptions): Hono {
  const app = new Hono()
  const database = options.database
  const turnLock = new S.TurnLock()

  app.get("/health", async () => {
    return sendJson(200, {
      ok: true,
      service: "semiosis-api",
    })
  })

  app.get("/providers", async () => {
    const providers: Array<S.ProviderConfig> = []

    for (const providerName of S.providerNames) {
      providers.push(await S.readProviderConfig(options.database, providerName))
    }

    return sendJson(200, providers)
  })

  app.get("/providers/:providerName/api-key", async (c) => {
    const providerName = c.req.param("providerName")
    assertSupportedProvider(providerName)

    return sendJson(200, {
      configured: await S.hasApiKey(options.database, providerName),
    })
  })

  app.put("/providers/:providerName/api-key", async (c) => {
    const providerName = c.req.param("providerName")
    assertSupportedProvider(providerName)

    const body = readRecord(await readJsonBody(c))
    const key = readString(body, "key")
    if (key.trim() === "") {
      throw new HTTPException(400, { message: "api key is empty" })
    }

    await S.writeApiKey(options.database, providerName, key)
    return sendEmpty(204)
  })

  app.delete("/providers/:providerName/api-key", async (c) => {
    const providerName = c.req.param("providerName")
    assertSupportedProvider(providerName)

    await S.deleteApiKey(options.database, providerName)
    return sendEmpty(204)
  })

  app.get("/providers/:providerName/models", async (c) => {
    const providerName = c.req.param("providerName")
    assertSupportedProvider(providerName)

    const all = c.req.query("all") === "true"

    return sendJson(
      200,
      await S.listProviderModelEntries(options.database, providerName, {
        all,
      }),
    )
  })

  app.get("/providers/:providerName", async (c) => {
    const providerName = c.req.param("providerName")
    assertSupportedProvider(providerName)

    return sendJson(
      200,
      await S.readProviderConfig(options.database, providerName),
    )
  })

  app.post("/providers/:providerName/models/pin", async (c) => {
    const providerName = c.req.param("providerName")
    assertSupportedProvider(providerName)

    const body = readRecord(await readJsonBody(c))
    const modelName = readString(body, "modelName")

    await S.pinModel(options.database, providerName, modelName)
    return sendEmpty(204)
  })

  app.post("/providers/:providerName/models/unpin", async (c) => {
    const providerName = c.req.param("providerName")
    assertSupportedProvider(providerName)

    const body = readRecord(await readJsonBody(c))
    const modelName = readString(body, "modelName")

    await S.unpinModel(options.database, providerName, modelName)
    return sendEmpty(204)
  })

  app.put("/providers/:providerName/default-model", async (c) => {
    const providerName = c.req.param("providerName")
    assertSupportedProvider(providerName)

    const body = readRecord(await readJsonBody(c))
    const modelName = readString(body, "modelName")

    await S.setDefaultModel(options.database, providerName, modelName)
    return sendEmpty(204)
  })

  app.get("/settings", async () => {
    const settings = await options.database.settings.get()

    return sendJson(200, settings ?? { defaultProvider: null, themeId: null })
  })

  app.put("/settings", async (c) => {
    const body = readRecord(await readJsonBody(c))
    const settings = readSettings(body)

    await options.database.settings.put(settings)
    return sendEmpty(204)
  })

  app.get("/workspaces", async () => {
    return sendJson(200, await database.workspaces.list())
  })

  app.post("/workspaces/ensure", async (c) => {
    const body = readRecord(await readJsonBody(c))
    const name = readString(body, "name")
    const root = readString(body, "root")

    return sendJson(200, await database.workspaces.ensure({ name, root }))
  })

  app.get("/workspaces/:workspaceId", async (c) => {
    const workspace = await database.workspaces.get(c.req.param("workspaceId"))

    if (workspace === undefined) {
      throw new HTTPException(404, { message: "workspace not found" })
    }

    return sendJson(200, workspace)
  })

  app.put("/workspaces/:workspaceId", async (c) => {
    const workspace = readWorkspace(await readJsonBody(c))
    const workspaceId = c.req.param("workspaceId")

    if (workspace.id !== workspaceId) {
      throw new HTTPException(400, { message: "workspace id mismatch" })
    }

    await database.workspaces.put(workspace)
    return sendEmpty(204)
  })

  app.delete("/workspaces/:workspaceId", async (c) => {
    await database.workspaces.remove(c.req.param("workspaceId"))
    return sendEmpty(204)
  })

  app.get("/sessions", async (c) => {
    const workspaceId = c.req.query("workspaceId")

    return sendJson(200, await database.sessions.list({ workspaceId }))
  })

  app.post("/sessions", async (c) => {
    const body = readRecord(await readJsonBody(c))
    const workspaceId = readString(body, "workspaceId")
    const title = readString(body, "title")

    const workspace = await options.database.workspaces.get(workspaceId)
    if (workspace === undefined) {
      throw new HTTPException(404, {
        message: `workspace not found: ${workspaceId}`,
      })
    }

    const session = await database.sessions.make({ workspaceId, title })
    session.context = makeDefaultInitialSigns(workspace)
    await database.sessions.put(session)

    return sendJson(201, session)
  })

  app.get("/sessions/:sessionId", async (c) => {
    const session = await database.sessions.get(c.req.param("sessionId"))

    if (session === undefined) {
      throw new HTTPException(404, { message: "session not found" })
    }

    return sendJson(200, session)
  })

  app.put("/sessions/:sessionId", async (c) => {
    const session = readSession(await readJsonBody(c))
    const sessionId = c.req.param("sessionId")

    if (session.id !== sessionId) {
      throw new HTTPException(400, { message: "session id mismatch" })
    }

    await database.sessions.put(session)
    return sendEmpty(204)
  })

  app.post("/sessions/:sessionId/title", async (c) => {
    const sessionId = c.req.param("sessionId")
    const session = await database.sessions.get(sessionId)

    if (session === undefined) {
      throw new HTTPException(404, { message: "session not found" })
    }

    const body = readRecord(await readJsonBody(c))
    const modelRef = readModel(body, "model")
    const model = await S.makeModel(modelRef, {
      database: options.database,
    })

    const result = await S.generateTitle({
      model,
      context: session.context,
    })
    const title = result.kind === "ok" ? result.title : ""

    if (title !== "") {
      await database.sessions.updateTitle(sessionId, title)
    }

    return sendJson(200, { title })
  })

  app.delete("/sessions/:sessionId", async (c) => {
    await database.sessions.remove(c.req.param("sessionId"))
    return sendEmpty(204)
  })

  app.get("/dustbin/sessions", async (c) => {
    const workspaceId = c.req.query("workspaceId")

    return sendJson(200, await database.dustbin.sessions.list({ workspaceId }))
  })

  app.get("/dustbin/sessions/:sessionId", async (c) => {
    const session = await database.dustbin.sessions.get(
      c.req.param("sessionId"),
    )

    if (session === undefined) {
      throw new HTTPException(404, {
        message: "session not found in dustbin",
      })
    }

    return sendJson(200, session)
  })

  app.post("/dustbin/sessions", async (c) => {
    const body = readRecord(await readJsonBody(c))
    const sessionId = readString(body, "sessionId")

    await runDustbinAction(() => database.dustbin.sessions.trash(sessionId))

    return sendEmpty(204)
  })

  app.post("/dustbin/sessions/:sessionId/restore", async (c) => {
    const sessionId = c.req.param("sessionId")

    await runDustbinAction(() => database.dustbin.sessions.restore(sessionId))

    return sendEmpty(204)
  })

  app.delete("/dustbin/sessions/:sessionId", async (c) => {
    await database.dustbin.sessions.remove(c.req.param("sessionId"))
    return sendEmpty(204)
  })

  app.get("/dustbin/workspaces", async () => {
    return sendJson(200, await database.dustbin.workspaces.list())
  })

  app.get("/dustbin/workspaces/:workspaceId", async (c) => {
    const workspace = await database.dustbin.workspaces.get(
      c.req.param("workspaceId"),
    )

    if (workspace === undefined) {
      throw new HTTPException(404, {
        message: "workspace not found in dustbin",
      })
    }

    return sendJson(200, workspace)
  })

  app.post("/dustbin/workspaces", async (c) => {
    const body = readRecord(await readJsonBody(c))
    const workspaceId = readString(body, "workspaceId")

    await runDustbinAction(async () => {
      const sessions = await database.sessions.list({ workspaceId })

      for (const session of sessions) {
        await database.dustbin.sessions.trash(session.id, {
          trashedWithWorkspace: true,
        })
      }

      await database.dustbin.workspaces.trash(workspaceId)
    })

    return sendEmpty(204)
  })

  app.post("/dustbin/workspaces/:workspaceId/restore", async (c) => {
    const workspaceId = c.req.param("workspaceId")

    await runDustbinAction(async () => {
      await database.dustbin.workspaces.restore(workspaceId)

      const sessions = await database.dustbin.sessions.list({ workspaceId })

      for (const session of sessions) {
        if (session.trashedWithWorkspace === true) {
          await database.dustbin.sessions.restore(session.id)
        }
      }
    })

    return sendEmpty(204)
  })

  app.delete("/dustbin/workspaces/:workspaceId", async (c) => {
    const workspaceId = c.req.param("workspaceId")
    const activeSessions = await database.sessions.list({ workspaceId })

    for (const session of activeSessions) {
      await database.sessions.remove(session.id)
    }

    const dustbinSessions = await database.dustbin.sessions.list({
      workspaceId,
    })

    for (const session of dustbinSessions) {
      await database.dustbin.sessions.remove(session.id)
    }

    await database.dustbin.workspaces.remove(workspaceId)
    return sendEmpty(204)
  })

  app.post("/sessions/:sessionId/interpret", async (c) => {
    const sessionId = c.req.param("sessionId")
    const body = readRecord(await readJsonBody(c))
    const modelOptions = readModel(body, "model")
    const turnId = readTurnId(body)
    const input = readSigns(body, "input")

    const session = await database.sessions.get(sessionId)
    if (session === undefined) {
      throw new HTTPException(404, { message: "session not found" })
    }

    const workspace = await options.database.workspaces.get(session.workspaceId)
    if (workspace === undefined) {
      throw new HTTPException(404, {
        message: `workspace not found: ${session.workspaceId}`,
      })
    }

    c.header("Content-Type", "application/x-ndjson; charset=utf-8")
    c.header("Cache-Control", "no-store")
    c.header("X-Accel-Buffering", "no")

    const unlock = turnLock.tryLock(sessionId, turnId)

    if (unlock === undefined) {
      throw new HTTPException(409, {
        message: `turn is already running: ${turnId}`,
      })
    }

    try {
      const resolved = await S.resolveTurn({
        sessions: database.sessions,
        sessionId,
        turnId,
        model: modelOptions,
        input,
      })

      if (resolved.kind === "error") {
        throw new HTTPException(409, { message: resolved.message })
      }

      if (resolved.kind === "replay") {
        return stream(c, async (stream) => {
          try {
            for await (const sign of S.turnReplay({
              sessions: database.sessions,
              turn: resolved.turn,
            })) {
              await stream.writeln(JSON.stringify({ type: "sign", sign }))
            }

            await stream.writeln(JSON.stringify({ type: "done" }))
          } finally {
            unlock()
          }
        })
      }

      const model = await S.makeModel(resolved.turn.model, {
        database: options.database,
      })

      const toolRouter = S.makeDefaultToolRouter({
        cwd: workspace.root,
      })

      const agent = await S.makeAgentFromSession({
        database: options.database,
        sessionId: session.id,
        model,
        makeToolRouter: () => toolRouter,
      })

      return stream(c, async (stream) => {
        try {
          for await (const event of S.turnRun({
            sessions: database.sessions,
            agent,
            turn: resolved.turn,
            input,
            signal: c.req.raw.signal,
            isRetryable: isRetryableError,
          })) {
            if (event.type === "error") {
              await stream.writeln(
                JSON.stringify({
                  type: "error",
                  message: event.message,
                  retryable: event.retryable,
                  inputPersisted: event.inputPersisted,
                }),
              )
              return
            }

            if (event.type === "delta") {
              await stream.writeln(
                JSON.stringify({
                  type: "delta",
                  delta: event.delta,
                }),
              )
              continue
            }

            await stream.writeln(
              JSON.stringify({
                type: "sign",
                sign: event.sign,
              }),
            )
          }

          await stream.writeln(JSON.stringify({ type: "done" }))
        } catch (error) {
          if (stream.aborted) return

          await stream.writeln(
            JSON.stringify({
              type: "error",
              message: errorMessage(error),
              retryable: isRetryableError(error),
              inputPersisted: resolved.turn.inputPersisted,
            }),
          )
        } finally {
          unlock()
        }
      })
    } catch (error) {
      unlock()
      throw error
    }
  })

  app.onError((error) => sendError(error))

  return app
}

function assertSupportedProvider(providerName: string): void {
  if (!(S.providerNames as readonly string[]).includes(providerName)) {
    throw new HTTPException(404, { message: "provider not found" })
  }
}

function makeDefaultInitialSigns(workspace: S.Workspace): Array<S.Sign> {
  const toolRouter = S.makeDefaultToolRouter({
    cwd: workspace.root,
  })

  return [
    ...toolRouter.toolSigns,
    S.PersonaSign("You are a helpful software engineer assistant."),
  ]
}

async function runDustbinAction(action: () => Promise<void>): Promise<void> {
  try {
    await action()
  } catch (error) {
    if (
      error instanceof S.DustbinSessionError ||
      error instanceof S.DustbinWorkspaceError
    ) {
      const status = error.code === "not-found" ? 404 : 409
      throw new HTTPException(status, { message: error.message })
    }

    throw error
  }
}

function readTurnId(body: Record<string, unknown>): string {
  const value = readString(body, "turnId")
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw new HTTPException(400, {
      message: `field \`turnId\` is invalid: ${value}`,
    })
  }

  return value
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
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

async function readJsonBody(c: Context): Promise<unknown> {
  const text = await c.req.text()
  if (text.trim() === "") return {}

  try {
    return JSON.parse(text)
  } catch {
    throw new HTTPException(400, { message: "invalid JSON body" })
  }
}

function readRecord(body: unknown): Record<string, unknown> {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HTTPException(400, {
      message: "request body must be a JSON object",
    })
  }

  return body as Record<string, unknown>
}

function readString(body: Record<string, unknown>, name: string): string {
  const value = body[name]
  if (typeof value !== "string") {
    throw new HTTPException(400, {
      message: `field \`${name}\` must be a string`,
    })
  }

  return value
}

function readNumber(body: Record<string, unknown>, name: string): number {
  const value = body[name]
  if (typeof value !== "number") {
    throw new HTTPException(400, {
      message: `field \`${name}\` must be a number`,
    })
  }

  return value
}

function readWorkspace(body: unknown): S.Workspace {
  const record = readRecord(body)
  return {
    id: readString(record, "id"),
    name: readString(record, "name"),
    root: readString(record, "root"),
    createdAt: readNumber(record, "createdAt"),
    updatedAt: readNumber(record, "updatedAt"),
  }
}

function readSession(body: unknown): S.Session {
  const record = readRecord(body)
  const context = record.context
  if (!Array.isArray(context)) {
    throw new HTTPException(400, {
      message: "field `context` must be an array",
    })
  }

  return {
    id: readString(record, "id"),
    workspaceId: readString(record, "workspaceId"),
    title: readString(record, "title"),
    context: context as Array<S.Sign>,
    createdAt: readNumber(record, "createdAt"),
    updatedAt: readNumber(record, "updatedAt"),
  }
}

function readSettings(body: Record<string, unknown>): S.Settings {
  const defaultProvider = readSettingsDefaultProvider(body)
  const themeId = readSettingsThemeId(body)

  return {
    defaultProvider,
    themeId,
  }
}

function readSettingsDefaultProvider(
  body: Record<string, unknown>,
): string | null {
  const value = body["defaultProvider"]

  if (value === null) return null

  if (typeof value !== "string" || value === "") {
    throw new HTTPException(400, {
      message: "field `defaultProvider` must be a non-empty string or null",
    })
  }

  return value
}

function readSettingsThemeId(body: Record<string, unknown>): string | null {
  const value = body["themeId"]

  if (value === undefined || value === null) return null

  if (typeof value !== "string" || value === "") {
    throw new HTTPException(400, {
      message: "field `themeId` must be a non-empty string or null",
    })
  }

  return value
}

function readModel(body: Record<string, unknown>, name: string): S.ModelRef {
  const value = body[name]
  const record = readRecord(value)

  return {
    providerName: readString(record, "providerName"),
    name: readString(record, "name"),
  }
}

function readSigns(body: Record<string, unknown>, name: string): Array<S.Sign> {
  const value = body[name]
  if (!Array.isArray(value)) {
    throw new HTTPException(400, {
      message: `field \`${name}\` must be an array`,
    })
  }

  for (const sign of value) {
    if (sign === null || typeof sign !== "object" || Array.isArray(sign)) {
      throw new HTTPException(400, {
        message: `field \`${name}\` must contain signs`,
      })
    }
  }

  return value as Array<S.Sign>
}

function sendJson(statusCode: number, value: unknown): Response {
  return new Response(JSON.stringify(value ?? null), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  })
}

function sendEmpty(statusCode: number): Response {
  return new Response(null, { status: statusCode })
}

function sendError(error: unknown): Response {
  const statusCode =
    error instanceof HTTPException ? error.status : statusCodeFromError(error)
  const message = error instanceof Error ? error.message : String(error)

  return sendJson(statusCode, {
    error: {
      message,
    },
  })
}

function statusCodeFromError(error: unknown): number {
  const code = readErrorCode(error)

  switch (code) {
    case "ENOENT":
      return 404
    case "EACCES":
    case "EPERM":
      return 403
    case "EISDIR":
    case "ENOTDIR":
      return 400
    case "EEXIST":
    case "ENOTEMPTY":
      return 409
    case "ENOSPC":
      return 507
    default:
      return 500
  }
}

function readErrorCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined
  return (error as NodeJS.ErrnoException).code
}
