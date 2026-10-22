import type { Result } from "@xieyuheng/std.ts/result"

import type { LockError } from "./LockError.ts"

export type Lock = {
  renew(): Promise<void>
  release(): Promise<void>
}

export type LockOptions = {
  ttlMs?: number
}

export type LockService = {
  tryLock(
    key: string,
    options?: LockOptions,
  ): Promise<Result<Lock | undefined, LockError>>
}
