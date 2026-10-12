import {
  HttpRequestError,
  makeJsonEndpoint,
  requestServerSentEvents,
  sendRequest,
  type ServerSentEvent,
} from "@windbell/http.js"
import type { JsonObject } from "@windbell/std.js/json"
import type {
  FileSystem,
  FileSystemEntry,
  FileSystemWatchEvent,
  FileType,
} from "../../fs/index.ts"
import type { FileSystemError } from "../../fs/index.ts"
import { err, ok, type Result } from "@windbell/std.js/result"
import { encodeBase64 } from "@windbell/std.js/base64"
import {
  Base64BytesSchema,
  BooleanSchema,
  ErrorResultSchema,
  FileSystemErrorSchema,
  FileSystemEntryListSchema,
  FileTypeSchema,
  ResultRecordSchema,
  ResultSchema,
  StringListSchema,
  StringSchema,
  VoidSchema,
} from "./schemas.ts"

export type HttpFileSystemClientConfig = {
  baseUrl: string
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

type BatchReadInput = {
  paths: Array<string>
}

type BatchWriteInput<T> = {
  files: Record<string, T>
}

export function makeHttpFileSystemClient(
  config: HttpFileSystemClientConfig,
): FileSystem {
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

  const writeEndpoint = makeJsonEndpoint<
    WriteInput,
    Result<void, FileSystemError>
  >(config, {
    method: "POST",
    path: "/write",
    body: (input) => input,
    output: ResultSchema(VoidSchema),
  })

  const batchReadEndpoint = makeJsonEndpoint<
    BatchReadInput,
    Record<string, Result<string, FileSystemError>>
  >(config, {
    method: "POST",
    path: "/batch-read",
    body: (input) => input,
    output: ResultRecordSchema(StringSchema),
  })

  const batchReadBytesEndpoint = makeJsonEndpoint<
    BatchReadInput,
    Record<string, Result<Uint8Array, FileSystemError>>
  >(config, {
    method: "POST",
    path: "/batch-read-bytes",
    body: (input) => input,
    output: ResultRecordSchema(Base64BytesSchema),
  })

  const batchWriteEndpoint = makeJsonEndpoint<
    BatchWriteInput<string>,
    Record<string, Result<void, FileSystemError>>
  >(config, {
    method: "POST",
    path: "/batch-write",
    body: (input) => input,
    output: ResultRecordSchema(VoidSchema),
  })

  const batchWriteBytesEndpoint = makeJsonEndpoint<
    BatchWriteInput<Uint8Array>,
    Record<string, Result<void, FileSystemError>>
  >(config, {
    method: "POST",
    path: "/batch-write-bytes",
    body: (input) => ({
      files: encodeByteRecord(input.files),
    }),
    output: ResultRecordSchema(VoidSchema),
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

  async function callBatch<Input, Output>(
    who: string,
    endpoint: (
      input: Input,
    ) => Promise<Record<string, Result<Output, FileSystemError>>>,
    input: Input,
    keys: Array<string>,
  ): Promise<Record<string, Result<Output, FileSystemError>>> {
    try {
      return await endpoint(input)
    } catch (error) {
      const fsError = toClientError(who, error)
      const results: Record<string, Result<Output, FileSystemError>> = {}

      for (const key of keys) {
        results[key] = err(fsError)
      }

      return results
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
        headers: new Headers({
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

  return {
    home: () => callResult("home", homeEndpoint, undefined, {}),
    exists: (path) => callResult("exists", existsEndpoint, { path }, { path }),
    isFile: (path) => callResult("is-file", isFileEndpoint, { path }, { path }),
    isDirectory: (path) =>
      callResult("is-directory", isDirectoryEndpoint, { path }, { path }),

    read: (path) => callResult("read", readEndpoint, { path }, { path }),
    readBytes,
    batchRead: (paths) =>
      callBatch("batch-read", batchReadEndpoint, { paths }, paths),
    batchReadBytes: (paths) =>
      callBatch("batch-read-bytes", batchReadBytesEndpoint, { paths }, paths),

    write: (path, text) =>
      callResult("write", writeEndpoint, { path, text }, { path }),
    writeBytes,
    batchWrite: (files) =>
      callBatch(
        "batch-write",
        batchWriteEndpoint,
        { files },
        Object.keys(files),
      ),
    batchWriteBytes: (files) =>
      callBatch(
        "batch-write-bytes",
        batchWriteBytesEndpoint,
        { files },
        Object.keys(files),
      ),

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

function encodeByteRecord(
  files: Record<string, Uint8Array>,
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [path, bytes] of Object.entries(files)) {
    result[path] = encodeBase64(bytes)
  }

  return result
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
