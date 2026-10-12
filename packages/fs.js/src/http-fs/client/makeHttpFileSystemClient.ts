import {
  HttpRequestError,
  makeJsonEndpoint,
  requestServerSentEvents,
  sendRequest,
} from "@windbell/http.js"
import type { JsonObject } from "@windbell/std.js/json"
import type {
  FileSystem,
  FileSystemEntry,
  FileSystemWatchEvent,
  FileType,
} from "../../fs/index.ts"
import { makeFileSystemError, type FileSystemError } from "../../fs/index.ts"
import { err, ok, type Result } from "@windbell/std.js/result"
import { encodeBase64 } from "@windbell/std.js/base64"
import {
  Base64BytesSchema,
  BooleanSchema,
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
        return err(
          makeFileSystemError(
            "invalid-response",
            "write-bytes",
            parsed.error.message,
            { path },
          ),
        )
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
    try {
      for await (const event of requestServerSentEvents({
        baseUrl: config.baseUrl,
        method: "POST",
        path: "/watch",
        body: { path },
        signal: options.signal,
      })) {
        let watchEvent: FileSystemWatchEvent

        try {
          watchEvent = JSON.parse(event.data) as FileSystemWatchEvent
        } catch (error) {
          yield {
            type: "error",
            error: toClientError("watch", error, { path }),
          }
          yield { type: "close" }
          return
        }

        yield watchEvent

        if (watchEvent.type === "close") return
      }
    } catch (error) {
      if (isAbortError(error)) {
        yield { type: "close" }
        return
      }

      yield {
        type: "error",
        error: toClientError("watch", error, { path }),
      }
      yield { type: "close" }
    }
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

    if (isRecord(value) && isFileSystemError(value.error)) {
      return value.error
    }
  } catch {
    // Fall through to a generic HTTP error.
  }

  return makeFileSystemError(
    "http-error",
    who,
    text === "" ? response.statusText : text,
    {
      ...info,
      status: response.status,
    },
  )
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

    return makeFileSystemError("http-error", who, error.message, errorInfo)
  }

  if (isAbortError(error)) {
    return makeFileSystemError("aborted", who, errorMessage(error), info)
  }

  return makeFileSystemError("unknown", who, errorMessage(error), info)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function isFileSystemError(value: unknown): value is FileSystemError {
  if (!isRecord(value)) return false

  return (
    typeof value.type === "string" &&
    typeof value.who === "string" &&
    typeof value.message === "string" &&
    isRecord(value.info)
  )
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError"
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
