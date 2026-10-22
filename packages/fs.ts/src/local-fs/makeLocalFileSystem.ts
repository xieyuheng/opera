import { randomUUID } from "node:crypto"
import { watch as watchDirectory, type WatchEventType } from "node:fs"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"

import type { JsonObject } from "@xieyuheng/std.ts/json"
import { err, isError, ok, type Result } from "@xieyuheng/std.ts/result"

import type {
  FileSystem,
  FileSystemEntry,
  FileSystemPlatform,
  FileSystemStat,
  FileSystemWatchEvent,
  FileType,
} from "../fs/index.ts"
import type { FileSystemError, FileSystemErrorType } from "../fs/index.ts"

const errorTypeByCode: Record<string, FileSystemErrorType> = {
  ENOENT: "not-found",
  EACCES: "permission-denied",
  EPERM: "permission-denied",
  EEXIST: "already-exists",
  ENOTDIR: "not-a-directory",
  EISDIR: "is-a-directory",
  ENOTEMPTY: "directory-not-empty",
  EINVAL: "invalid-path",
  ENAMETOOLONG: "invalid-path",
  ENOSPC: "no-space",
  EROFS: "read-only",
  EMFILE: "too-many-open-files",
  ENFILE: "too-many-open-files",
  EXDEV: "cross-device",
  EBUSY: "busy",
  ELOOP: "too-many-symbolic-links",
}

export function makeLocalFileSystem(): FileSystem {
  return {
    platform,
    home,
    exists,
    isFile,
    isDirectory,
    read: readText,
    readBytes,
    write: writeText,
    writeBytes,
    stat,
    createFileExclusive,
    list,
    listEntries,
    listRecursive,
    classifyFile,
    ensureFile,
    ensureDirectory,
    deleteFile,
    deleteDirectory,
    delete: deletePath,
    rename,
    watch,
  }
}

async function run<T>(
  who: string,
  action: () => Promise<T>,
  info: JsonObject = {},
): Promise<Result<T, FileSystemError>> {
  try {
    return ok(await action())
  } catch (error) {
    return err(toFileSystemError(who, error, info))
  }
}

async function platform(): Promise<
  Result<FileSystemPlatform, FileSystemError>
> {
  return run("platform", async () => ({
    name: Os.platform(),
    pathStyle: Os.platform() === "win32" ? "win32" : "posix",
  }))
}

async function home(): Promise<Result<string, FileSystemError>> {
  return run("home", async () => Os.homedir())
}

async function exists(path: string): Promise<Result<boolean, FileSystemError>> {
  return run(
    "exists",
    async () => {
      try {
        await fs.access(path)
        return true
      } catch (error) {
        if (isNotFoundError(error)) return false
        throw error
      }
    },
    { path },
  )
}

async function isFile(path: string): Promise<Result<boolean, FileSystemError>> {
  return run(
    "is-file",
    async () => {
      try {
        const stat = await fs.stat(path)
        return stat.isFile()
      } catch (error) {
        if (isNotFoundError(error)) return false
        throw error
      }
    },
    { path },
  )
}

async function isDirectory(
  path: string,
): Promise<Result<boolean, FileSystemError>> {
  return run(
    "is-directory",
    async () => {
      try {
        const stat = await fs.stat(path)
        return stat.isDirectory()
      } catch (error) {
        if (isNotFoundError(error)) return false
        throw error
      }
    },
    { path },
  )
}

async function readText(
  path: string,
): Promise<Result<string, FileSystemError>> {
  return run("read", () => fs.readFile(path, "utf8"), { path })
}

async function readBytes(
  path: string,
): Promise<Result<Uint8Array, FileSystemError>> {
  return run(
    "read-bytes",
    async () => {
      const buffer = await fs.readFile(path)
      const bytes = new Uint8Array(buffer.byteLength)
      bytes.set(buffer)
      return bytes
    },
    { path },
  )
}

async function stat(
  path: string,
): Promise<Result<FileSystemStat, FileSystemError>> {
  return run(
    "stat",
    async () => {
      const value = await fs.stat(path)
      return {
        kind: value.isDirectory() ? "Directory" : "File",
        size: value.size,
        mtimeMs: value.mtimeMs,
      }
    },
    { path },
  )
}

async function createFileExclusive(
  path: string,
  text: string,
): Promise<Result<void, FileSystemError>> {
  return run(
    "create-file-exclusive",
    async () => {
      const file = await fs.open(path, "wx")

      try {
        await file.writeFile(text, "utf8")
      } finally {
        await file.close()
      }
    },
    { path },
  )
}

async function writeText(
  path: string,
  text: string,
): Promise<Result<void, FileSystemError>> {
  return run(
    "write",
    async () => {
      await writeFileAtomic(path, text)
    },
    { path },
  )
}

async function writeBytes(
  path: string,
  bytes: Uint8Array,
): Promise<Result<void, FileSystemError>> {
  return run(
    "write-bytes",
    async () => {
      await writeFileAtomic(path, bytes)
    },
    { path },
  )
}

async function list(
  path: string,
): Promise<Result<Array<string>, FileSystemError>> {
  return run(
    "list",
    async () => {
      const names = await fs.readdir(path)
      return names.sort().map((name) => Path.join(path, name))
    },
    { path },
  )
}

async function listEntries(
  path: string,
): Promise<Result<Array<FileSystemEntry>, FileSystemError>> {
  return run(
    "list-entries",
    async () => {
      const entries = await fs.readdir(path, { withFileTypes: true })
      const result: Array<FileSystemEntry> = []

      entries.sort((left, right) => left.name.localeCompare(right.name))

      for (const entry of entries) {
        const entryPath = Path.join(path, entry.name)

        if (entry.isSymbolicLink()) {
          try {
            const stat = await fs.stat(entryPath)

            result.push({
              name: entry.name,
              path: entryPath,
              kind: stat.isDirectory() ? "Directory" : "File",
            })
          } catch {
            result.push({
              name: entry.name,
              path: entryPath,
              kind: "File",
            })
          }

          continue
        }

        result.push({
          name: entry.name,
          path: entryPath,
          kind: entry.isDirectory() ? "Directory" : "File",
        })
      }

      return result
    },
    { path },
  )
}

async function listRecursive(
  path: string,
): Promise<Result<Array<string>, FileSystemError>> {
  return run(
    "list-recursive",
    async () => {
      const output: Array<string> = []
      await visit(path)
      return output

      async function visit(currentPath: string): Promise<void> {
        const entries = await fs.readdir(currentPath, { withFileTypes: true })
        entries.sort((left, right) => left.name.localeCompare(right.name))

        for (const entry of entries) {
          const childPath = Path.join(currentPath, entry.name)
          output.push(childPath)

          if (entry.isDirectory()) {
            await visit(childPath)
          }
        }
      }
    },
    { path },
  )
}

async function classifyFile(
  path: string,
): Promise<Result<FileType, FileSystemError>> {
  try {
    const stat = await fs.stat(path)

    if (!stat.isFile()) {
      return err({
        type: "not-a-file",
        who: "classify-file",
        message: `not a file: ${path}`,
        info: { path },
      })
    }

    const sample = await readSample(path, 4096)
    return ok(detectFileType(sample))
  } catch (error) {
    return err(toFileSystemError("classify-file", error, { path }))
  }
}

async function ensureFile(
  path: string,
): Promise<Result<void, FileSystemError>> {
  return run(
    "ensure-file",
    async () => {
      await fs.mkdir(Path.dirname(path), { recursive: true })
      const file = await fs.open(path, "a")
      await file.close()
    },
    { path },
  )
}

async function ensureDirectory(
  path: string,
): Promise<Result<void, FileSystemError>> {
  return run(
    "ensure-directory",
    async () => {
      await fs.mkdir(path, { recursive: true })
    },
    { path },
  )
}

async function deleteFile(
  path: string,
): Promise<Result<void, FileSystemError>> {
  return run(
    "delete-file",
    async () => {
      await fs.unlink(path)
    },
    { path },
  )
}

async function deleteDirectory(
  path: string,
): Promise<Result<void, FileSystemError>> {
  return run(
    "delete-directory",
    async () => {
      await fs.rmdir(path)
    },
    { path },
  )
}

async function deletePath(
  path: string,
): Promise<Result<void, FileSystemError>> {
  return run(
    "delete",
    async () => {
      await fs.rm(path, { recursive: true })
    },
    { path },
  )
}

async function rename(
  path: string,
  newPath: string,
): Promise<Result<void, FileSystemError>> {
  return run(
    "rename",
    async () => {
      await fs.rename(path, newPath)
    },
    { path, newPath },
  )
}

async function* watch(
  path: string,
  options: { signal?: AbortSignal },
): AsyncIterable<FileSystemWatchEvent> {
  const statResult = await run("watch", () => fs.stat(path), { path })

  if (isError(statResult)) {
    yield { type: "error", error: statResult.error }
    yield { type: "close" }
    return
  }

  if (!statResult.value.isDirectory()) {
    yield {
      type: "error",
      error: {
        type: "not-a-directory",
        who: "watch",
        message: `not a directory: ${path}`,
        info: { path },
      },
    }
    yield { type: "close" }
    return
  }

  if (options.signal?.aborted) {
    yield { type: "close" }
    return
  }

  let watcher: ReturnType<typeof watchDirectory>

  try {
    watcher = watchDirectory(path, { recursive: true })
  } catch (error) {
    yield { type: "error", error: toFileSystemError("watch", error, { path }) }
    yield { type: "close" }
    return
  }

  const events: Array<FileSystemWatchEvent> = []
  let wake: (() => void) | undefined
  let stopped = false

  function push(event: FileSystemWatchEvent): void {
    if (stopped) return

    events.push(event)
    wake?.()
    wake = undefined
  }

  function stop(): void {
    if (stopped) return

    stopped = true

    try {
      watcher.close()
    } catch {
      // Ignore errors while closing an already broken watcher.
    }

    options.signal?.removeEventListener("abort", onAbort)
  }

  function onAbort(): void {
    push({ type: "close" })
    stop()
  }

  watcher.on("change", (changeType, filename) => {
    const name = filename === null ? null : filename.toString()

    push({
      type: "change",
      path: name === null ? path : Path.join(path, name),
      changeType: changeType as WatchEventType,
      filename: name,
    })
  })

  watcher.on("error", (error) => {
    push({ type: "error", error: toFileSystemError("watch", error, { path }) })
    push({ type: "close" })
    stop()
  })

  watcher.on("close", () => {
    if (stopped) return

    push({ type: "close" })
    stop()
  })

  options.signal?.addEventListener("abort", onAbort, { once: true })
  push({ type: "ready", path })

  try {
    while (true) {
      const event = events.shift()

      if (event !== undefined) {
        yield event

        if (event.type === "close") return
        continue
      }

      if (stopped) return

      await new Promise<void>((resolve) => {
        wake = resolve
      })
    }
  } finally {
    stop()
  }
}

async function writeFileAtomic(
  path: string,
  data: string | Uint8Array,
): Promise<void> {
  const tempPath = makeTempPath(path)

  try {
    await fs.writeFile(tempPath, data)
    await fs.rename(tempPath, path)
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => undefined)
    throw error
  }
}

function makeTempPath(path: string): string {
  const directory = Path.dirname(path)
  const name = Path.basename(path)
  return Path.join(directory, `.${name}.${randomUUID()}.tmp`)
}

async function readSample(path: string, size: number): Promise<Buffer> {
  const handle = await fs.open(path, "r")

  try {
    const buffer = Buffer.alloc(size)
    const { bytesRead } = await handle.read(buffer, 0, size, 0)
    return buffer.subarray(0, bytesRead)
  } finally {
    await handle.close()
  }
}

function detectFileType(sample: Buffer): FileType {
  if (sample.length === 0) return "text"

  if (startsWith(sample, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image"
  }

  if (startsWith(sample, [0xff, 0xd8, 0xff])) {
    return "image"
  }

  if (startsWith(sample, [0x47, 0x49, 0x46, 0x38])) {
    return "image"
  }

  if (
    startsWith(sample, [0x52, 0x49, 0x46, 0x46]) &&
    sample.length >= 12 &&
    startsWith(sample.subarray(8), [0x57, 0x45, 0x42, 0x50])
  ) {
    return "image"
  }

  if (startsWith(sample, [0x25, 0x50, 0x44, 0x46])) {
    return "pdf"
  }

  if (startsWith(sample, [0x50, 0x4b, 0x03, 0x04])) {
    return "archive"
  }

  if (startsWith(sample, [0x1f, 0x8b])) {
    return "archive"
  }

  if (isTextSample(sample)) {
    return "text"
  }

  return "binary"
}

function isTextSample(sample: Buffer): boolean {
  let controlCount = 0

  for (const byte of sample) {
    if (byte === 0x00) return false

    if (byte < 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d) {
      controlCount += 1
    }
  }

  if (controlCount / sample.length > 0.3) return false

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(sample)
    return true
  } catch {
    return false
  }
}

function startsWith(sample: Buffer, prefix: Array<number>): boolean {
  if (sample.length < prefix.length) return false

  return prefix.every((byte, index) => sample[index] === byte)
}

function toFileSystemError(
  who: string,
  error: unknown,
  info: JsonObject = {},
): FileSystemError {
  const code = readErrorCode(error)
  const fileSystemError: FileSystemError = {
    type: errorTypeFromError(error),
    who,
    message: errorMessage(error),
  }

  if (Object.keys(info).length > 0 || code !== undefined) {
    fileSystemError.info = { ...info }
  }

  if (code !== undefined && fileSystemError.info !== undefined) {
    fileSystemError.info.code = code
  }

  return fileSystemError
}

function errorTypeFromError(error: unknown): FileSystemErrorType {
  if (error instanceof Error && error.name === "AbortError") {
    return "aborted"
  }

  const code = readErrorCode(error)
  if (code === undefined) return "unknown"

  return errorTypeByCode[code] ?? "unknown"
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function readErrorCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined

  const code = (error as NodeJS.ErrnoException).code
  return typeof code === "string" ? code : undefined
}

function isNotFoundError(error: unknown): boolean {
  return readErrorCode(error) === "ENOENT"
}
