import { makeFileLockService } from "@windbell/lock.js/file-lock"
import type { Database } from "../database/Database.ts"
import { defaultLockRoot } from "./defaultPaths.ts"
import type { SessionId } from "../session/Session.ts"

const lockTtlMs = 60_000
const lockRenewIntervalMs = 20_000

export type SessionLease = {
  release(): Promise<void>
}

export type SessionLockOptions = {
  database: Database
  sessionId: SessionId
  lockRoot?: string
}

export async function acquireSessionLease(
  options: SessionLockOptions,
): Promise<SessionLease> {
  const lockService = makeFileLockService({
    fs: options.database.fs,
    path: options.database.path,
    root: options.lockRoot ?? defaultLockRoot(),
  })

  const result = await lockService.tryLock(`session:${options.sessionId}`, {
    ttlMs: lockTtlMs,
  })

  if (result.kind === "ErrorResult") {
    throw new Error(`failed to lock session: ${result.error.message}`)
  }

  const lock = result.value
  if (lock === undefined) {
    throw new Error(`session is already running: ${options.sessionId}`)
  }

  const renewTimer = setInterval(() => {
    void lock.renew().catch(() => undefined)
  }, lockRenewIntervalMs)

  return {
    async release() {
      clearInterval(renewTimer)
      await lock.release().catch(() => undefined)
    },
  }
}

export async function withSessionLock<T>(
  options: SessionLockOptions & {
    action: () => Promise<T>
  },
): Promise<T> {
  const lease = await acquireSessionLease(options)

  try {
    return await options.action()
  } finally {
    await lease.release()
  }
}
