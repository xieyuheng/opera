import type { ModelRef, ModelUsage } from "../model/index.ts"
import type { Sign } from "../sign/index.ts"
import type { SessionId } from "../session/Session.ts"

export type TurnId = string

export type TurnStatus = "pending" | "completed" | "failed"

export type TurnUsage = Omit<ModelUsage, "raw"> & {
  raw: Array<unknown>
}

export type Turn = {
  id: TurnId
  sessionId: SessionId

  status: TurnStatus
  model: ModelRef

  inputHash: string
  inputPersisted: boolean

  startSequence: number
  endSequence: number

  error?: { message: string }
  usage?: TurnUsage

  createdAt: number
  updatedAt: number
  completedAt?: number
}

export function addTurnUsage(
  current: TurnUsage | undefined,
  usage: ModelUsage,
): TurnUsage {
  return {
    input: (current?.input ?? 0) + usage.input,
    output: (current?.output ?? 0) + usage.output,
    cacheRead: (current?.cacheRead ?? 0) + usage.cacheRead,
    cacheMiss: (current?.cacheMiss ?? 0) + usage.cacheMiss,
    cacheWrite: (current?.cacheWrite ?? 0) + usage.cacheWrite,
    total: (current?.total ?? 0) + usage.total,
    raw: [...(current?.raw ?? []), usage.raw],
  }
}

export async function makeInputHash(input: Array<Sign>): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(input))
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data)
  const bytes = new Uint8Array(digest)

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  )
}
