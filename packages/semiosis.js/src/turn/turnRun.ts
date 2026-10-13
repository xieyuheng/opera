import { agentContinue, agentInterpret } from "../agent/agentInterpret.ts"
import type { Agent } from "../agent/Agent.ts"
import type { SessionStore } from "../database/SessionStore.ts"
import type { Sign } from "../sign/index.ts"
import type { Turn } from "./Turn.ts"
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
  isRetryable?: (error: unknown) => boolean
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
      retryable: options.isRetryable?.(error) ?? false,
      inputPersisted: turn.inputPersisted,
    }
  }
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
