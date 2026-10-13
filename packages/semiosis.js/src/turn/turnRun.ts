import { agentContinue, agentInterpret } from "../agent/agentInterpret.ts"
import type { Agent } from "../agent/Agent.ts"
import type { SessionStore } from "../database/SessionStore.ts"
import type { ModelError } from "../model/index.ts"
import type { Sign } from "../sign/index.ts"
import { addTurnUsage, type Turn } from "./Turn.ts"
import type { TurnEvent } from "./TurnEvent.ts"
import { turnReplay } from "./turnReplay.ts"
import { unwrap } from "@windbell/std.js/result"

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export type TurnRunOptions = {
  sessions: SessionStore
  agent: Agent
  turn: Turn
  input: Array<Sign>
  signal?: AbortSignal
}

export async function* turnRun(
  options: TurnRunOptions,
): AsyncGenerator<TurnEvent> {
  const { sessions, agent, input, signal } = options
  const turn: Turn = { ...options.turn }

  try {
    for await (const sign of turnReplay({ sessions, turn })) {
      yield { type: "sign", sign }
    }

    const interpreter = turn.inputPersisted
      ? agentContinue(agent, { signal })
      : agentInterpret(agent, input, { signal })

    for await (const event of interpreter) {
      if (event.type === "error") {
        await markFailedTurn(sessions, turn, event.error.message)

        yield {
          type: "error",
          message: event.error.message,
          retryable: isRetryableModelError(event.error),
          inputPersisted: turn.inputPersisted,
        }
        return
      }

      if (event.type === "usage") {
        turn.usage = addTurnUsage(turn.usage, event.usage)
        yield { type: "usage", usage: event.usage }
        continue
      }

      if (event.type === "input-persisted") {
        turn.inputPersisted = true
        turn.endSequence = unwrap(
          await sessions.nextSignSequence(turn.sessionId),
        )
        turn.updatedAt = Date.now()
        unwrap(await sessions.putTurn(turn))
        continue
      }

      if (event.type === "delta") {
        yield { type: "delta", delta: event.delta }
        continue
      }

      turn.endSequence = unwrap(await sessions.nextSignSequence(turn.sessionId))
      turn.updatedAt = Date.now()
      unwrap(await sessions.putTurn(turn))

      yield { type: "sign", sign: event.sign }
    }

    await markCompletedTurn(sessions, turn)
  } catch (error) {
    await markFailedTurn(sessions, turn, error)

    yield {
      type: "error",
      message: errorMessage(error),
      retryable: false,
      inputPersisted: turn.inputPersisted,
    }
  }
}

export function isRetryableModelError(error: ModelError): boolean {
  if (error.type === "network") return true
  if (error.type !== "http") return false
  if (error.status === undefined) return false

  return error.status === 408 || error.status === 429 || error.status >= 500
}

export async function markCompletedTurn(
  sessions: SessionStore,
  turn: Turn,
): Promise<void> {
  turn.status = "completed"
  turn.completedAt = Date.now()
  turn.endSequence = unwrap(await sessions.nextSignSequence(turn.sessionId))
  turn.updatedAt = Date.now()
  unwrap(await sessions.putTurn(turn))
}

export async function markFailedTurn(
  sessions: SessionStore,
  turn: Turn,
  error: unknown,
): Promise<void> {
  turn.status = "failed"
  turn.error = { message: errorMessage(error) }
  turn.endSequence = unwrap(await sessions.nextSignSequence(turn.sessionId))
  turn.updatedAt = Date.now()
  unwrap(await sessions.putTurn(turn))
}
