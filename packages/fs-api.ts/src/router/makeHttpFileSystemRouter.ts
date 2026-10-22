import type { FileSystem } from "@xieyuheng/fs.ts/fs"
import type { FileSystemError } from "@xieyuheng/fs.ts/fs"
import { makeLocalFileSystem } from "@xieyuheng/fs.ts/local-fs"
import { Hono, type Context } from "hono"
import { HTTPException } from "hono/http-exception"
import { streamSSE } from "hono/streaming"

export type HttpFileSystemRouterOptions = {
  fs?: FileSystem
}

type Handler = (body: unknown) => Promise<unknown>

export function makeHttpFileSystemRouter(
  options: HttpFileSystemRouterOptions = {},
): Hono {
  const app = new Hono()
  const fs = options.fs ?? makeLocalFileSystem()

  app.get("/health", (c) => {
    return c.json({ ok: true, service: "fs-api" })
  })

  app.post("/read-bytes", async (c) => {
    const body = await readJsonBody(c)
    const path = readPath(body)
    const result = await fs.readBytes(path)

    if (result.kind === "ErrorResult") {
      return sendJson(statusCodeFromFileSystemError(result.error), {
        kind: "ErrorResult",
        error: result.error,
      })
    }

    return new Response(result.value as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    })
  })

  app.post("/write-bytes", async (c) => {
    const path = c.req.query("path")

    if (typeof path !== "string" || path === "") {
      throw new HTTPException(400, {
        message: "query `path` must be a non-empty string",
      })
    }

    const bytes = new Uint8Array(await c.req.arrayBuffer())
    const result = await fs.writeBytes(path, bytes)

    return c.json(normalizeForJson(result))
  })

  app.post("/watch", async (c) => {
    const body = await readJsonBody(c)
    const path = readPath(body)

    return streamSSE(c, async (stream) => {
      const heartbeat = setInterval(() => {
        if (stream.aborted) return

        void stream
          .writeSSE({
            event: "ping",
            data: JSON.stringify({ type: "ping" }),
          })
          .catch(() => undefined)
      }, 15_000)

      try {
        for await (const event of fs.watch(path, {
          signal: c.req.raw.signal,
        })) {
          await stream.writeSSE({
            event: event.type,
            data: JSON.stringify(event),
          })
        }
      } finally {
        clearInterval(heartbeat)
      }
    })
  })

  const handlers: Record<string, Handler> = {
    platform: async () => fs.platform(),
    home: async () => fs.home(),
    exists: async (body) => fs.exists(readPath(body)),
    "is-file": async (body) => fs.isFile(readPath(body)),
    "is-directory": async (body) => fs.isDirectory(readPath(body)),

    read: async (body) => fs.read(readPath(body)),

    stat: async (body) => fs.stat(readPath(body)),
    "create-file-exclusive": async (body) =>
      fs.createFileExclusive(readPath(body), readText(body)),
    write: async (body) => fs.write(readPath(body), readText(body)),

    list: async (body) => fs.list(readPath(body)),
    "list-entries": async (body) => fs.listEntries(readPath(body)),
    "list-recursive": async (body) => fs.listRecursive(readPath(body)),
    "classify-file": async (body) => fs.classifyFile(readPath(body)),

    "ensure-file": async (body) => fs.ensureFile(readPath(body)),
    "ensure-directory": async (body) => fs.ensureDirectory(readPath(body)),

    "delete-file": async (body) => fs.deleteFile(readPath(body)),
    "delete-directory": async (body) => fs.deleteDirectory(readPath(body)),
    delete: async (body) => fs.delete(readPath(body)),
    rename: async (body) => fs.rename(readPath(body), readNewPath(body)),
  }

  app.post("/:method", async (c) => {
    const method = c.req.param("method")
    const handler = handlers[method]

    if (handler === undefined) {
      throw new HTTPException(404, {
        message: `unknown method: ${method}`,
      })
    }

    const body = await readJsonBody(c)
    const result = await handler(body)

    return c.json(normalizeForJson(result))
  })

  app.onError((error) => sendError(error))

  return app
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

function readPath(body: unknown): string {
  return readString(readRecord(body), "path")
}

function readNewPath(body: unknown): string {
  return readString(readRecord(body), "newPath")
}

function readText(body: unknown): string {
  return readString(readRecord(body), "text")
}

function readString(record: Record<string, unknown>, name: string): string {
  const value = record[name]

  if (typeof value !== "string") {
    throw new HTTPException(400, {
      message: `field \`${name}\` must be a string`,
    })
  }

  return value
}

function normalizeForJson(value: unknown): unknown {
  if (isResultLike(value)) {
    if (value.kind === "OkResult" && value.value === undefined) {
      return { kind: "OkResult", value: null }
    }

    return value
  }

  if (isResultRecord(value)) {
    const result: Record<string, unknown> = {}

    for (const [key, item] of Object.entries(value)) {
      result[key] = normalizeForJson(item)
    }

    return result
  }

  return value
}

function isResultLike(value: unknown): value is ResultLike {
  return (
    isRecord(value) &&
    (value.kind === "OkResult" || value.kind === "ErrorResult")
  )
}

function isResultRecord(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && Object.values(value).every(isResultLike)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

type ResultLike =
  | { kind: "OkResult"; value: unknown }
  | { kind: "ErrorResult"; error: unknown }

function statusCodeFromFileSystemError(error: FileSystemError): number {
  switch (error.type) {
    case "not-found":
      return 404

    case "permission-denied":
    case "read-only":
      return 403

    case "already-exists":
    case "directory-not-empty":
    case "busy":
      return 409

    case "not-a-directory":
    case "is-a-directory":
    case "invalid-path":
      return 400

    case "no-space":
      return 507

    default:
      return 500
  }
}

function sendJson(statusCode: number, value: unknown): Response {
  return new Response(JSON.stringify(value ?? null), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  })
}

function sendError(error: unknown): Response {
  const statusCode = error instanceof HTTPException ? error.status : 500
  const message = error instanceof Error ? error.message : String(error)

  return sendJson(statusCode, {
    error: {
      message,
    },
  })
}
