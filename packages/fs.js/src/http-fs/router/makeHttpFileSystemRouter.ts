import { Hono, type Context } from "hono"
import { HTTPException } from "hono/http-exception"
import { streamSSE } from "hono/streaming"
import type { FileSystem } from "../../fs/index.ts"
import type { FileSystemError } from "../../fs/index.ts"
import { ok, type Result } from "@windbell/std.js/result"
import { makeLocalFileSystem } from "../../local-fs/index.ts"
import { decodeBase64, encodeBase64 } from "@windbell/std.js/base64"

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
    return c.json({ ok: true, service: "http-fs" })
  })

  app.post("/read-bytes", async (c) => {
    const body = await readJsonBody(c)
    const path = readPath(body)
    const result = await fs.readBytes(path)

    if (result.kind === "ErrorResult") {
      return sendJson(statusCodeFromFileSystemError(result.error), {
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
      for await (const event of fs.watch(path, {
        signal: c.req.raw.signal,
      })) {
        await stream.writeSSE({
          event: event.type,
          data: JSON.stringify(event),
        })
      }
    })
  })

  const handlers: Record<string, Handler> = {
    home: async () => fs.home(),
    exists: async (body) => fs.exists(readPath(body)),
    "is-file": async (body) => fs.isFile(readPath(body)),
    "is-directory": async (body) => fs.isDirectory(readPath(body)),

    read: async (body) => fs.read(readPath(body)),
    "batch-read": async (body) => fs.batchRead(readPaths(body)),
    "batch-read-bytes": async (body) =>
      encodeBytesRecord(await fs.batchReadBytes(readPaths(body))),

    write: async (body) => fs.write(readPath(body), readText(body)),
    "batch-write": async (body) => fs.batchWrite(readFilesText(body)),
    "batch-write-bytes": async (body) =>
      fs.batchWriteBytes(readFilesBytes(body)),

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

function readPaths(body: unknown): Array<string> {
  const value = readRecord(body).paths

  if (
    !Array.isArray(value) ||
    !value.every((path) => typeof path === "string")
  ) {
    throw new HTTPException(400, {
      message: "field `paths` must be an array of strings",
    })
  }

  return value
}

function readFilesText(body: unknown): Record<string, string> {
  const record = readStringRecord(readRecord(body).files)
  const files: Record<string, string> = {}

  for (const [path, value] of Object.entries(record)) {
    if (typeof value !== "string") {
      throw new HTTPException(400, {
        message: `field \`files.${path}\` must be a string`,
      })
    }

    files[path] = value
  }

  return files
}

function readFilesBytes(body: unknown): Record<string, Uint8Array> {
  const record = readStringRecord(readRecord(body).files)
  const files: Record<string, Uint8Array> = {}

  for (const [path, value] of Object.entries(record)) {
    if (typeof value !== "string") {
      throw new HTTPException(400, {
        message: `field \`files.${path}\` must be a base64 string`,
      })
    }

    try {
      files[path] = decodeBase64(value)
    } catch {
      throw new HTTPException(400, {
        message: `field \`files.${path}\` must be a base64 string`,
      })
    }
  }

  return files
}

function readStringRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new HTTPException(400, {
      message: "field `files` must be a JSON object",
    })
  }

  return value as Record<string, unknown>
}

function encodeBytesResult(
  result: Result<Uint8Array, FileSystemError>,
): Result<string, FileSystemError> {
  return result.kind === "OkResult" ? ok(encodeBase64(result.value)) : result
}

function encodeBytesRecord(
  record: Record<string, Result<Uint8Array, FileSystemError>>,
): Record<string, Result<string, FileSystemError>> {
  const result: Record<string, Result<string, FileSystemError>> = {}

  for (const [path, item] of Object.entries(record)) {
    result[path] = encodeBytesResult(item)
  }

  return result
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
  { kind: "OkResult"; value: unknown } | { kind: "ErrorResult"; error: unknown }

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
