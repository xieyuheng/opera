import type { FileSystem } from "@xieyuheng/fs.ts/fs"
import type { Path } from "@xieyuheng/std.ts/path"
import { isError, ok, err, type Result } from "@xieyuheng/std.ts/result"

import type {
  Lock,
  LockError,
  LockOptions,
  LockService,
} from "../lock/index.ts"
import { toLockError } from "./toLockError.ts"

const defaultTtlMs = 60_000

export type FileLockServiceOptions = {
  fs: FileSystem
  path: Path
  root: string
}

export function makeFileLockService(
  options: FileLockServiceOptions,
): LockService {
  const { fs, path } = options
  const root = path.normalize(options.root)

  async function tryLock(
    key: string,
    lockOptions: LockOptions = {},
  ): Promise<Result<Lock | undefined, LockError>> {
    const ttlMs = lockOptions.ttlMs ?? defaultTtlMs
    const lockPath = path.join(root, lockKeyFileName(key))
    const token = randomToken()

    const ensured = await fs.ensureDirectory(root)

    if (isError(ensured)) {
      return err(toLockError("try-lock", ensured.error, { key }))
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const created = await fs.createFileExclusive(
        lockPath,
        JSON.stringify({ token }),
      )

      if (created.kind === "OkResult") {
        return ok(makeLock(lockPath, token))
      }

      if (created.error.type !== "already-exists") {
        return err(toLockError("try-lock", created.error, { key }))
      }

      const statResult = await fs.stat(lockPath)

      if (isError(statResult)) {
        if (statResult.error.type === "not-found") continue
        return err(toLockError("try-lock", statResult.error, { key }))
      }

      if (Date.now() - statResult.value.mtimeMs <= ttlMs) {
        return ok(undefined)
      }

      const stalePath = `${lockPath}.${token}.stale`
      const renamed = await fs.rename(lockPath, stalePath)

      if (isError(renamed)) {
        if (renamed.error.type === "not-found") continue
        return ok(undefined)
      }

      await fs.deleteFile(stalePath).catch(() => undefined)
    }

    return ok(undefined)
  }

  function makeLock(lockPath: string, token: string): Lock {
    return {
      async renew() {
        const current = await fs.read(lockPath)

        if (isError(current)) {
          throw new Error(`lock not found: ${lockPath}`)
        }

        const parsed = parseLockFile(current.value)
        if (parsed?.token !== token) {
          throw new Error("lock token mismatch")
        }

        const written = await fs.write(lockPath, JSON.stringify({ token }))

        if (isError(written)) {
          throw new Error(written.error.message)
        }
      },

      async release() {
        const current = await fs.read(lockPath)

        if (isError(current)) return

        const parsed = parseLockFile(current.value)
        if (parsed?.token !== token) return

        await fs.deleteFile(lockPath)
      },
    }
  }

  return { tryLock }
}

function parseLockFile(text: string): { token: string } | undefined {
  try {
    const value: unknown = JSON.parse(text)

    if (value === null || typeof value !== "object") return undefined

    const token = (value as { token?: unknown }).token
    return typeof token === "string" ? { token } : undefined
  } catch {
    return undefined
  }
}

function lockKeyFileName(key: string): string {
  return `${key.replace(/[^a-zA-Z0-9_-]/g, "_")}.lock`
}

function randomToken(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }

  const bytes = new Uint8Array(16)

  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  )
}
