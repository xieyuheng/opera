import type { Result } from "@windbell/std.js/result"
import type { FileSystemError } from "./FileSystemError.ts"

export type FileSystem = {
  home(): Promise<Result<string, FileSystemError>>
  exists(path: string): Promise<Result<boolean, FileSystemError>>
  isFile(path: string): Promise<Result<boolean, FileSystemError>>
  isDirectory(path: string): Promise<Result<boolean, FileSystemError>>

  read(path: string): Promise<Result<string, FileSystemError>>
  readBytes(path: string): Promise<Result<Uint8Array, FileSystemError>>
  batchRead(
    paths: Array<string>,
  ): Promise<Record<string, Result<string, FileSystemError>>>
  batchReadBytes(
    paths: Array<string>,
  ): Promise<Record<string, Result<Uint8Array, FileSystemError>>>

  write(path: string, text: string): Promise<Result<void, FileSystemError>>
  writeBytes(
    path: string,
    bytes: Uint8Array,
  ): Promise<Result<void, FileSystemError>>
  batchWrite(
    files: Record<string, string>,
  ): Promise<Record<string, Result<void, FileSystemError>>>
  batchWriteBytes(
    files: Record<string, Uint8Array>,
  ): Promise<Record<string, Result<void, FileSystemError>>>

  list(path: string): Promise<Result<Array<string>, FileSystemError>>
  listEntries(
    path: string,
  ): Promise<Result<Array<FileSystemEntry>, FileSystemError>>
  listRecursive(path: string): Promise<Result<Array<string>, FileSystemError>>
  classifyFile(path: string): Promise<Result<FileType, FileSystemError>>

  ensureFile(path: string): Promise<Result<void, FileSystemError>>
  ensureDirectory(path: string): Promise<Result<void, FileSystemError>>

  deleteFile(path: string): Promise<Result<void, FileSystemError>>
  deleteDirectory(path: string): Promise<Result<void, FileSystemError>>
  delete(path: string): Promise<Result<void, FileSystemError>>
  rename(path: string, newPath: string): Promise<Result<void, FileSystemError>>

  watch(
    path: string,
    options: { signal?: AbortSignal },
  ): AsyncIterable<FileSystemWatchEvent>
}

export type FileSystemEntry = {
  name: string
  path: string
  kind: "File" | "Directory"
}

export type FileType =
  "text" | "image" | "pdf" | "archive" | "binary" | "unknown"

export type FileSystemWatchEvent =
  | { type: "ready"; path: string }
  | {
      type: "change"
      path: string
      changeType: "rename" | "change"
      filename: string | null
    }
  | { type: "error"; error: FileSystemError }
  | { type: "close" }
