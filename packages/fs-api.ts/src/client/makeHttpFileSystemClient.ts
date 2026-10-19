import type {
  FileSystem,
  FileSystemEntry,
  FileSystemPlatform,
  FileSystemStat,
  FileSystemWatchEvent,
  FileType,
} from "@windbell/fs.ts/fs"
import type { FileSystemError } from "@windbell/fs.ts/fs"
import {
  HttpRequestError,
  makeJsonEndpoint,
  mergeHeaders,
  requestServerSentEvents,
  resolveHeaders,
  sendRequest,
  type HeaderSource,
  type ServerSentEvent,
} from "@windbell/http.ts"
import type { JsonObject } from "@windbell/std.ts/json"
import { err, ok, type Result } from "@windbell/std.ts/result"

import {
  BooleanSchema,
  ErrorResultSchema,
  FileSystemErrorSchema,
  FileSystemEntryListSchema,
  FileSystemPlatformSchema,
  FileSystemStatSchema,
  FileTypeSchema,
  ResultSchema,
  StringListSchema,
  StringSchema,
  VoidSchema,
} from "./schemas.ts"

export type HttpFileSystemClientConfig = {
  baseUrl: string
  headers?: HeaderSource
}

type PathInput = {
  path: string
}

type WriteInput = {
  path: string
  text: string
}

type RenameInput = {
  path: string
  newPath: string
}

export function makeHttpFileSystemClient(
  config: HttpFileSystemClientConfig,
): FileSystem {
  function requestHeaders(...sources: Array<HeadersInit | undefined>): Headers {
    return mergeHeaders(resolveHeaders(config.headers), ...sources)
  }

  const platformEndpoint = makeJsonEndpoint<
    void,
    Result<FileSystemPlatform, FileSystemError>
  >(config, {
    method: "POST",
    path: "/platform",
    body: () => ({}),
    output: ResultSchema(FileSystemPlatformSchema),
  })

  const homeEndpoint = makeJsonEndpoint<void, Result<string, FileSystemError>>(
    config,
    {
      method: "POST",
      path: "/home",
      body: () => ({}),
      output: ResultSchema(StringSchema),
    },
  )

  const existsEndpoint = makeJsonEndpoint<
    PathInput,
    Result<boolean, FileSystemError>
  >(config, {
    method: "POST",
    path: "/exists",
    body: (input) => input,
    output: ResultSchema(BooleanSchema),
  })

  const isFileEndpoint = makeJsonEndpoint<
    PathInput,
    Result<boolean, FileSystemError>
  >(config, {
    method: "POST",
    path: "/is-file",
    body: (input) => input,
    output: ResultSchema(BooleanSchema),
  })

  const isDirectoryEndpoint = makeJsonEndpoint<
    PathInput,
    Result<boolean, FileSystemError>
  >(config, {
    method: "POST",
    path: "/is-directory",
    body: (input) => input,
    output: ResultSchema(BooleanSchema),
  })

  const readEndpoint = makeJsonEndpoint<
    PathInput,
    Result<string, FileSystemError>
  >(config, {
    method: "POST",
    path: "/read",
    body: (input) => input,
    output: ResultSchema(StringSchema),
  })

  const statEndpoint = makeJsonEndpoint<
    PathInput,
    Result<FileSystemStat, FileSystemError>
  >(config, {
    method: "POST",
    path: "/stat",
    body: (input) => input,
    output: ResultSchema(FileSystemStatSchema),
  })

  const createFileExclusiveEndpoint = makeJsonEndpoint<
    WriteInput,
    Result<void, FileSystemError>
  >(config, {
    method: "POST",
    path: "/create-file-exclusive",
    body: (input) => input,
    output: ResultSchema(VoidSchema),
  })

  const writeEndpoint = makeJsonEndpoint<
    WriteInput,
    Result<void, FileSystemError>
  >(config, {
    method: "POST",
    path: "/write",
    body: (input) => input,
    output: ResultSchema(VoidSchema),
  })

  const listEndpoint = makeJsonEndpoint<
    PathInput,
    Result<Array<string>, FileSystemError>
  >(config, {
    method: "POST",
    path: "/list",
    body: (input) => input,
    output: ResultSchema(StringListSchema),
  })

  const listEntriesEndpoint = makeJsonEndpoint<
    PathInput,
    Result<Array<FileSystemEntry>, FileSystemError>
  >(config, {
    method: "POST",
    path: "/list-entries",
    body: (input) => input,
    output: ResultSchema(FileSystemEntryListSchema),
  })

  const listRecursiveEndpoint = makeJsonEndpoint<
    PathInput,
    Result<Array<string>, FileSystemError>
  >(config, {
    method: "POST",
    path: "/list-recursive",
    body: (input) => input,
    output: ResultSchema(StringListSchema),
  })

  const classifyFileEndpoint = makeJsonEndpoint<
    PathInput,
    Result<FileType, FileSystemError>
  >(config, {
    method: "POST",
    path: "/classify-file",
    body: (input) => input,
    output: ResultSchema(FileTypeSchema),
  })

  const ensureFileEndpoint = makeJsonEndpoint<
    PathInput,
    Result<void, FileSystemError>
  >(config, {
    method: "POST",
    path: "/ensure-file",
    body: (input) => input,
    output: ResultSchema(VoidSchema),
  })

  const ensureDirectoryEndpoint = makeJsonEndpoint<
    PathInput,
    Result<void, FileSystemError>
  >(config, {
    method: "POST",
    path: "/ensure-directory",
    body: (input) => input,
    output: ResultSchema(VoidSchema),
  })

  const deleteFileEndpoint = makeJsonEndpoint<
    PathInput,
    Result<void, FileSystemError>
  >(config, {
    method: "POST",
    path: "/delete-file",
    body: (input) => input,
    output: ResultSchema(VoidSchema),
  })

  const deleteDirectoryEndpoint = makeJsonEndpoint<
    PathInput,
    Result<void, FileSystemError>
  >(config, {
    method: "POST",
    path: "/delete-directory",
    body: (input) => input,
    output: ResultSchema(VoidSchema),
  })

  const deleteEndpoint = makeJsonEndpoint<
    PathInput,
    Result<void, FileSystemError>
  >(config, {
    method: "POST",
    path: "/delete",
    body: (input) => input,
    output: ResultSchema(VoidSchema),
  })

  const renameEndpoint = makeJsonEndpoint<
    RenameInput,
    Result<void, FileSystemError>
  >(config, {
    method: "POST",
    path: "/rename",
    body: (input) => input,
    output: ResultSchema(VoidSchema),
  })

  async function callResult<Input, Output>(
    who: string,
    endpoint: (input: Input) => Promise<Result<Output, FileSystemError>>,
    input: Input,
    info: JsonObject,
  ): Promise<Result<Output, FileSystemError>> {
    try {
      return await endpoint(input)
    } catch (error) {
      return err(toClientError(who, error, info))
    }
  }

  async function readBytes(
    path: string,
  ): Promise<Result<Uint8Array, FileSystemError>> {
    try {
      const response = await sendRequest({
        baseUrl: config.baseUrl,
        method: "POST",
        path: "/read-bytes",
        headers: requestHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ path }),
      })

      if (!response.ok) {
        return err(await readErrorResponse("read-bytes", response, { path }))
      }

      return ok(new Uint8Array(await response.arrayBuffer()))
    } catch (error) {
      return err(toClientError("read-bytes", error, { path }))
    }
  }

  async function writeBytes(
    path: string,
    bytes: Uint8Array,
  ): Promise<Result<void, FileSystemError>> {
    try {
      const response = await sendRequest({
        baseUrl: config.baseUrl,
        method: "POST",
        path: "/write-bytes",
        query: new URLSearchParams({ path }),
        headers: requestHeaders(),
        body: bytes as BodyInit,
      })

      if (!response.ok) {
        return err(await readErrorResponse("write-bytes", response, { path }))
      }

      const value: unknown = await response.json()
      const parsed = ResultSchema(VoidSchema).safeParse(value)

      if (!parsed.success) {
        return err({
          type: "invalid-response",
          who: "write-bytes",
          message: parsed.error.message,
          info: { path },
        })
      }

      return parsed.data
    } catch (error) {
      return err(toClientError("write-bytes", error, { path }))
    }
  }

  async function* watch(
    path: string,
    options: { signal?: AbortSignal },
  ): AsyncIterable<FileSystemWatchEvent> {
    let reconnectDelay = 500
    let attempt = 0

    while (!options.signal?.aborted) {
      let connected = false

      try {
        for await (const event of requestServerSentEvents({
          baseUrl: config.baseUrl,
          method: "POST",
          path: "/watch",
          body: { path },
          headers: requestHeaders(),
          signal: options.signal,
        })) {
          const watchEvent = parseFileSystemWatchEvent(event, path)
          if (watchEvent === undefined) continue

          if (!connected) {
            connected = true
            attempt = 0
            reconnectDelay = 500
          }

          yield watchEvent

          if (watchEvent.type === "close") return
        }
      } catch (error) {
        if (options.signal?.aborted || isAbortError(error)) {
          yield { type: "close" }
          return
        }
      }

      if (options.signal?.aborted) {
        yield { type: "close" }
        return
      }

      attempt += 1

      yield {
        type: "reconnecting",
        path,
        attempt,
        delayMs: reconnectDelay,
      }

      await sleep(reconnectDelay, options.signal)
      reconnectDelay = Math.min(reconnectDelay * 2, 5_000)
    }

    yield { type: "close" }
  }

  let platformCache:
    | Promise<Result<FileSystemPlatform, FileSystemError>>
    | undefined

  function platform(): Promise<Result<FileSystemPlatform, FileSystemError>> {
    platformCache ??= callResult("platform", platformEndpoint, undefined, {})

    return platformCache
  }

  return {
    platform,
    home: () => callResult("home", homeEndpoint, undefined, {}),
    exists: (path) => callResult("exists", existsEndpoint, { path }, { path }),
    isFile: (path) => callResult("is-file", isFileEndpoint, { path }, { path }),
    isDirectory: (path) =>
      callResult("is-directory", isDirectoryEndpoint, { path }, { path }),

    read: (path) => callResult("read", readEndpoint, { path }, { path }),
    readBytes,

    stat: (path) => callResult("stat", statEndpoint, { path }, { path }),
    createFileExclusive: (path, text) =>
      callResult(
        "create-file-exclusive",
        createFileExclusiveEndpoint,
        { path, text },
        { path },
      ),
    write: (path, text) =>
      callResult("write", writeEndpoint, { path, text }, { path }),
    writeBytes,

    list: (path) => callResult("list", listEndpoint, { path }, { path }),
    listEntries: (path) =>
      callResult("list-entries", listEntriesEndpoint, { path }, { path }),
    listRecursive: (path) =>
      callResult("list-recursive", listRecursiveEndpoint, { path }, { path }),
    classifyFile: (path) =>
      callResult("classify-file", classifyFileEndpoint, { path }, { path }),

    ensureFile: (path) =>
      callResult("ensure-file", ensureFileEndpoint, { path }, { path }),
    ensureDirectory: (path) =>
      callResult(
        "ensure-directory",
        ensureDirectoryEndpoint,
        { path },
        { path },
      ),

    deleteFile: (path) =>
      callResult("delete-file", deleteFileEndpoint, { path }, { path }),
    deleteDirectory: (path) =>
      callResult(
        "delete-directory",
        deleteDirectoryEndpoint,
        { path },
        { path },
      ),
    delete: (path) => callResult("delete", deleteEndpoint, { path }, { path }),
    rename: (path, newPath) =>
      callResult(
        "rename",
        renameEndpoint,
        { path, newPath },
        { path, newPath },
      ),

    watch,
  }
}

async function readErrorResponse(
  who: string,
  response: Response,
  info: JsonObject,
): Promise<FileSystemError> {
  const text = await response.text()

  try {
    const value: unknown = JSON.parse(text)
    const parsed = ErrorResultSchema.safeParse(value)

    if (parsed.success) {
      return parsed.data.error
    }
  } catch {
    // Fall through to a generic HTTP error.
  }

  return {
    type: "http-error",
    who,
    message: text === "" ? response.statusText : text,
    info: {
      ...info,
      status: response.status,
    },
  }
}

function toClientError(
  who: string,
  error: unknown,
  info: JsonObject = {},
): FileSystemError {
  if (error instanceof HttpRequestError) {
    const errorInfo: JsonObject = { ...info }

    if (error.status !== undefined) {
      errorInfo.status = error.status
    }

    return { type: "http-error", who, message: error.message, info: errorInfo }
  }

  if (isAbortError(error)) {
    return { type: "aborted", who, message: errorMessage(error), info }
  }

  return { type: "unknown", who, message: errorMessage(error), info }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function parseFileSystemWatchEvent(
  event: ServerSentEvent,
  path: string,
): FileSystemWatchEvent | undefined {
  let value: unknown

  try {
    value = JSON.parse(event.data)
  } catch {
    return undefined
  }

  if (!isRecord(value) || typeof value.type !== "string") {
    return undefined
  }

  switch (value.type) {
    case "ready":
      return typeof value.path === "string"
        ? { type: "ready", path: value.path }
        : undefined

    case "change": {
      const path = value.path
      const changeType = value.changeType
      const filename = value.filename

      if (typeof path !== "string") return undefined
      if (changeType !== "rename" && changeType !== "change") return undefined
      if (filename !== null && typeof filename !== "string") return undefined

      return {
        type: "change",
        path,
        changeType,
        filename,
      }
    }

    case "error": {
      const parsed = FileSystemErrorSchema.safeParse(value.error)

      if (parsed.success) {
        return { type: "error", error: parsed.data }
      }

      return {
        type: "error",
        error: {
          type: "invalid-response",
          who: "watch",
          message: parsed.error.message,
          info: { path },
        },
      }
    }

    case "reconnecting":
      return typeof value.path === "string" &&
        typeof value.attempt === "number" &&
        typeof value.delayMs === "number"
        ? {
            type: "reconnecting",
            path: value.path,
            attempt: value.attempt,
            delayMs: value.delayMs,
          }
        : undefined

    case "ping":
      return { type: "ping" }

    case "close":
      return { type: "close" }

    default:
      return undefined
  }
}

async function sleep(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return

  await new Promise<void>((resolve) => {
    const onAbort = (): void => {
      clearTimeout(timer)
      resolve()
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolve()
    }, delayMs)

    signal?.addEventListener("abort", onAbort, { once: true })
  })
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError"
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
