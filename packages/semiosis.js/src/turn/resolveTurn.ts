import type { SessionStore } from "../database/SessionStore.ts"
import type { ModelRef } from "../model/index.ts"
import type { SessionId } from "../session/Session.ts"
import type { Sign } from "../sign/index.ts"
import type { Turn, TurnId } from "./Turn.ts"
import { makeInputHash } from "./Turn.ts"

export type ResolveTurnOptions = {
  sessions: SessionStore
  sessionId: SessionId
  turnId: TurnId
  model: ModelRef
  input: Array<Sign>
}

export type ResolveTurnResult =
  | { kind: "replay"; turn: Turn }
  | { kind: "run"; turn: Turn }
  | { kind: "error"; message: string }

export async function resolveTurn(
  options: ResolveTurnOptions,
): Promise<ResolveTurnResult> {
  const inputHash = await makeInputHash(options.input)
  const existingTurn = await options.sessions.getTurn(
    options.sessionId,
    options.turnId,
  )

  if (existingTurn !== undefined) {
    if (existingTurn.inputHash !== inputHash) {
      return {
        kind: "error",
        message: `turn input mismatch: ${options.turnId}`,
      }
    }

    if (
      existingTurn.model.providerName !== options.model.providerName ||
      existingTurn.model.name !== options.model.name
    ) {
      return {
        kind: "error",
        message: `turn model mismatch: ${options.turnId}`,
      }
    }
  }

  if (existingTurn?.status === "completed") {
    return { kind: "replay", turn: existingTurn }
  }

  const now = Date.now()

  if (existingTurn === undefined) {
    const startSequence = await options.sessions.nextSignSequence(
      options.sessionId,
    )
    const turn: Turn = {
      id: options.turnId,
      sessionId: options.sessionId,
      status: "pending",
      model: options.model,
      inputHash,
      inputPersisted: false,
      startSequence,
      endSequence: startSequence,
      createdAt: now,
      updatedAt: now,
    }

    await options.sessions.putTurn(turn)
    return { kind: "run", turn }
  }

  const turn: Turn = {
    ...existingTurn,
    status: "pending",
    error: undefined,
    updatedAt: now,
  }

  await options.sessions.putTurn(turn)
  return { kind: "run", turn }
}
