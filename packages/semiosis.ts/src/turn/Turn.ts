import type { ModelRef, ModelTotalUsage, ModelUsage } from "../model/index.ts"
import type { SessionId } from "../session/Session.ts"
import type { Sign } from "../sign/index.ts"

export type TurnId = string

export type TurnStatus = "pending" | "completed" | "failed"

export type TurnStepStatus = "pending" | "completed" | "failed" | "aborted"

export type TurnStep = {
  sessionId: SessionId
  turnId: TurnId
  sequenceNumber: number

  status: TurnStepStatus

  usage?: ModelUsage

  createdAt: number
  updatedAt: number
  completedAt?: number

  error?: { message: string }
}

export type SessionUsage = {
  totalUsage: ModelTotalUsage
  latestUsage?: ModelUsage
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

  createdAt: number
  updatedAt: number
  completedAt?: number
}

export type TurnDetails = Turn & {
  steps: Array<TurnStep>
}

export async function makeInputHash(input: Array<Sign>): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(input))
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data)
  const bytes = new Uint8Array(digest)

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  )
}
