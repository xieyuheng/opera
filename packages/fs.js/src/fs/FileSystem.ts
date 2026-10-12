import type { Result } from "../result/index.ts"
import type { FileSystemError } from "./FileSystemError.ts"

export type FileSystemResult<V> = Result<V, FileSystemError>

/**
 * A batch result keeps one result per input item in the original order.
 */
export type FileSystemManyResult<V> = Array<FileSystemResult<V>>

export type FileSystemEntry = {
  name: string
  path: string
  kind: "File" | "Directory"
}

export type FileTypeKind =
  "Text" | "Image" | "Pdf" | "Archive" | "Binary" | "Unknown"

export type FileSystemInspectResult = {
  kind: FileTypeKind
  mimeType?: string
  size: number
}

export type FileSystemWriteOptions = {
  path: string
  text: string
}

export type FileSystemWriteBytesOptions = {
  path: string
  bytes: Uint8Array
}

export type FileSystemRenameOptions = {
  path: string
  newPath: string
}

export type FileSystemWatchEvent =
  | { kind: "Ready"; path: string }
  | {
      kind: "Change"
      path: string
      eventType: "rename" | "change"
      filename: string | null
    }

export type FileSystemWatch = {
  events: AsyncIterable<FileSystemResult<FileSystemWatchEvent>>
  close(): void
}

/**
 * Implementations must not throw. Filesystem, transport, validation and
 * unknown errors must all be returned as `ErrorResult`.
 */
export type FileSystem = {
  exists(path: string): Promise<FileSystemResult<boolean>>
  isFile(path: string): Promise<FileSystemResult<boolean>>
  isDirectory(path: string): Promise<FileSystemResult<boolean>>

  read(path: string): Promise<FileSystemResult<string>>
  /**
   * Reads many paths in one batch.
   *
   * The outer `Result` is for request-level failures. The inner `Result` is
   * per path, so one missing file does not fail the whole batch.
   */
  readMany(
    paths: Array<string>,
  ): Promise<FileSystemResult<FileSystemManyResult<string>>>
  readBytes(path: string): Promise<FileSystemResult<Uint8Array>>

  write(options: FileSystemWriteOptions): Promise<FileSystemResult<void>>
  /**
   * Writes many files in one batch.
   *
   * The outer `Result` is for request-level failures. The inner `Result` is
   * per file, so one failed write does not hide the others.
   */
  writeMany(
    files: Array<FileSystemWriteOptions>,
  ): Promise<FileSystemResult<FileSystemManyResult<void>>>
  writeBytes(
    options: FileSystemWriteBytesOptions,
  ): Promise<FileSystemResult<void>>

  list(path: string): Promise<FileSystemResult<Array<string>>>
  listEntries(path: string): Promise<FileSystemResult<Array<FileSystemEntry>>>
  listRecursive(path: string): Promise<FileSystemResult<Array<string>>>
  inspectFile(path: string): Promise<FileSystemResult<FileSystemInspectResult>>

  ensureFile(path: string): Promise<FileSystemResult<void>>
  ensureDirectory(path: string): Promise<FileSystemResult<void>>

  deleteFile(path: string): Promise<FileSystemResult<void>>
  deleteDirectory(path: string): Promise<FileSystemResult<void>>
  delete(path: string): Promise<FileSystemResult<void>>
  rename(options: FileSystemRenameOptions): Promise<FileSystemResult<void>>

  /**
   * Starts a watcher. Setup failures are returned by the outer `Result`;
   * later watch failures are yielded as `ErrorResult` events.
   */
  watch(path: string): Promise<FileSystemResult<FileSystemWatch>>
}
