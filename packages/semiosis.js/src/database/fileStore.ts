import type { FileSystem, FileSystemError } from "@windbell/fs.js/fs"
import type { Path } from "@windbell/std.js/path"
import {
  ResultUnwrapError,
  isError,
  unwrap,
  type Result,
} from "@windbell/std.js/result"

export type FileStore = {
  ensureDir(path: string): Promise<void>
  listDirectories(path: string): Promise<Array<string>>
  listFiles(path: string): Promise<Array<string>>
  readTextFile(path: string): Promise<string | undefined>
  writeTextFile(path: string, text: string): Promise<void>
  readJsonFile(path: string): Promise<unknown | undefined>
  writeJsonFile(path: string, value: unknown): Promise<void>
  exists(path: string): Promise<boolean>
  remove(path: string): Promise<void>
  removeDirectory(path: string): Promise<void>
  rename(path: string, newPath: string): Promise<void>
}

export type FileStoreOptions = {
  fs: FileSystem
  path: Path
}

export function makeFileStore(options: FileStoreOptions): FileStore {
  const { fs, path } = options

  function expectOk<T>(result: Result<T, FileSystemError>): T {
    return unwrap(result)
  }

  async function isNotFound(path: string): Promise<boolean> {
    const result = await fs.exists(path)
    return result.kind === "OkResult" ? !result.value : false
  }

  return {
    async ensureDir(path) {
      expectOk(await fs.ensureDirectory(path))
    },

    async listDirectories(path) {
      const result = await fs.listEntries(path)
      if (isError(result)) {
        if (result.error.type === "not-found") return []
        throw new ResultUnwrapError(result.error)
      }

      return result.value
        .filter((entry) => entry.kind === "Directory")
        .map((entry) => entry.name)
    },

    async listFiles(path) {
      const result = await fs.listEntries(path)
      if (isError(result)) {
        if (result.error.type === "not-found") return []
        throw new ResultUnwrapError(result.error)
      }

      return result.value
        .filter((entry) => entry.kind === "File")
        .map((entry) => entry.name)
    },

    async readTextFile(path) {
      const result = await fs.read(path)
      if (isError(result)) {
        if (result.error.type === "not-found") return undefined
        throw new ResultUnwrapError(result.error)
      }

      return result.value
    },

    async writeTextFile(filePath, text) {
      await this.ensureDir(path.dirname(filePath))
      expectOk(await fs.write(filePath, text))
    },

    async readJsonFile(path) {
      const text = await this.readTextFile(path)
      if (text === undefined) return undefined

      return JSON.parse(text)
    },

    async writeJsonFile(path, value) {
      await this.writeTextFile(path, `${JSON.stringify(value, null, 2)}\n`)
    },

    async exists(path) {
      const result = await fs.exists(path)
      return expectOk(result)
    },

    async remove(path) {
      if (await isNotFound(path)) return

      const result = await fs.delete(path)
      if (isError(result) && result.error.type !== "not-found") {
        throw new ResultUnwrapError(result.error)
      }
    },

    async removeDirectory(path) {
      if (await isNotFound(path)) return

      const result = await fs.deleteDirectory(path)
      if (isError(result) && result.error.type !== "not-found") {
        throw new ResultUnwrapError(result.error)
      }
    },

    async rename(path, newPath) {
      expectOk(await fs.rename(path, newPath))
    },
  }
}
