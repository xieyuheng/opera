import type { FileSystem, FileSystemError } from "@xieyuheng/fs.ts/fs"
import type { Path } from "@xieyuheng/std.ts/path"
import { err, isError, ok, type Result } from "@xieyuheng/std.ts/result"

import {
  makeDatabaseErrorFromFileSystemError,
  type DatabaseError,
} from "./DatabaseError.ts"

export type FileStore = {
  ensureDir(path: string): Promise<Result<void, DatabaseError>>
  listDirectories(path: string): Promise<Result<Array<string>, DatabaseError>>
  listFiles(path: string): Promise<Result<Array<string>, DatabaseError>>
  readTextFile(path: string): Promise<Result<string | undefined, DatabaseError>>
  writeTextFile(
    path: string,
    text: string,
  ): Promise<Result<void, DatabaseError>>
  readJsonFile(path: string): Promise<Result<unknown, DatabaseError>>
  writeJsonFile(
    path: string,
    value: unknown,
  ): Promise<Result<void, DatabaseError>>
  exists(path: string): Promise<Result<boolean, DatabaseError>>
  remove(path: string): Promise<Result<void, DatabaseError>>
  removeDirectory(path: string): Promise<Result<void, DatabaseError>>
  rename(path: string, newPath: string): Promise<Result<void, DatabaseError>>
}

export type FileStoreOptions = {
  fs: FileSystem
  path: Path
}

function fromFileSystemError(
  error: FileSystemError,
): Result<never, DatabaseError> {
  return err(makeDatabaseErrorFromFileSystemError(error))
}

export function makeFileStore(options: FileStoreOptions): FileStore {
  const { fs, path } = options

  return {
    async ensureDir(path) {
      const result = await fs.ensureDirectory(path)
      if (isError(result)) return fromFileSystemError(result.error)
      return ok(undefined)
    },

    async listDirectories(path) {
      const result = await fs.listEntries(path)
      if (isError(result)) {
        if (result.error.type === "not-found") return ok([])
        return fromFileSystemError(result.error)
      }

      return ok(
        result.value
          .filter((entry) => entry.kind === "Directory")
          .map((entry) => entry.name),
      )
    },

    async listFiles(path) {
      const result = await fs.listEntries(path)
      if (isError(result)) {
        if (result.error.type === "not-found") return ok([])
        return fromFileSystemError(result.error)
      }

      return ok(
        result.value
          .filter((entry) => entry.kind === "File")
          .map((entry) => entry.name),
      )
    },

    async readTextFile(path) {
      const result = await fs.read(path)
      if (isError(result)) {
        if (result.error.type === "not-found") return ok(undefined)
        return fromFileSystemError(result.error)
      }

      return ok(result.value)
    },

    async writeTextFile(filePath, text) {
      const ensureResult = await this.ensureDir(path.dirname(filePath))
      if (isError(ensureResult)) return ensureResult

      const writeResult = await fs.write(filePath, text)
      if (isError(writeResult)) return fromFileSystemError(writeResult.error)
      return ok(undefined)
    },

    async readJsonFile(path) {
      const textResult = await this.readTextFile(path)
      if (isError(textResult)) return textResult
      if (textResult.value === undefined) return ok(undefined)

      try {
        return ok(JSON.parse(textResult.value) as unknown)
      } catch (error) {
        return err({
          type: "invalid-json",
          message: error instanceof Error ? error.message : String(error),
        })
      }
    },

    async writeJsonFile(path, value) {
      return await this.writeTextFile(
        path,
        `${JSON.stringify(value, null, 2)}\n`,
      )
    },

    async exists(path) {
      const result = await fs.exists(path)
      if (isError(result)) return fromFileSystemError(result.error)
      return ok(result.value)
    },

    async remove(path) {
      const existsResult = await this.exists(path)
      if (isError(existsResult)) return existsResult
      if (!existsResult.value) return ok(undefined)

      const result = await fs.delete(path)
      if (isError(result) && result.error.type !== "not-found") {
        return fromFileSystemError(result.error)
      }

      return ok(undefined)
    },

    async removeDirectory(path) {
      const existsResult = await this.exists(path)
      if (isError(existsResult)) return existsResult
      if (!existsResult.value) return ok(undefined)

      const result = await fs.deleteDirectory(path)
      if (isError(result) && result.error.type !== "not-found") {
        return fromFileSystemError(result.error)
      }

      return ok(undefined)
    },

    async rename(path, newPath) {
      const result = await fs.rename(path, newPath)
      if (isError(result)) return fromFileSystemError(result.error)
      return ok(undefined)
    },
  }
}
