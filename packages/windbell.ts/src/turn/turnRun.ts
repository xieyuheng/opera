import { unwrap } from "@xieyuheng/std.ts/result"

import type { Agent } from "../agent/Agent.ts"
import { agentContinue, agentInterpret } from "../agent/agentInterpret.ts"
import type { SessionStore } from "../database/SessionStore.ts"
import type { ModelError, ModelUsage } from "../model/index.ts"
import type { Sign } from "../sign/index.ts"
import type { Turn, TurnStep, TurnStepStatus } from "./Turn.ts"
import type { TurnEvent } from "./TurnEvent.ts"
import { turnReplay } from "./turnReplay.ts"

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isAbortError(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false

  return (error as { name?: unknown }).name === "AbortError"
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
  let currentStep: TurnStep | undefined

  async function startStep(): Promise<void> {
    const sequenceNumber = unwrap(
      await sessions.nextStepSequence(turn.sessionId, turn.id),
    )
    const now = Date.now()

    currentStep = {
      sessionId: turn.sessionId,
      turnId: turn.id,
      sequenceNumber,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    }

    unwrap(await sessions.putStep(currentStep))
  }

  async function updateStepUsage(usage: ModelUsage): Promise<void> {
    if (currentStep === undefined) return

    currentStep.usage = usage
    currentStep.updatedAt = Date.now()
    unwrap(await sessions.putStep(currentStep))
  }

  async function completeStep(): Promise<void> {
    if (currentStep === undefined) return

    const now = Date.now()
    currentStep.status = "completed"
    currentStep.updatedAt = now
    currentStep.completedAt = now
    unwrap(await sessions.putStep(currentStep))
    currentStep = undefined
  }

  async function failStep(
    error: unknown,
    status: Extract<TurnStepStatus, "failed" | "aborted">,
  ): Promise<void> {
    if (currentStep === undefined) return

    currentStep.status = status
    currentStep.updatedAt = Date.now()
    currentStep.error = { message: errorMessage(error) }
    unwrap(await sessions.putStep(currentStep))
    currentStep = undefined
  }

  try {
    for await (const sign of turnReplay({ sessions, turn })) {
      yield { type: "sign", sign }
    }

    const interpreter = turn.inputPersisted
      ? agentContinue(agent, { signal })
      : agentInterpret(agent, input, { signal })

    for await (const event of interpreter) {
      if (event.type === "error") {
        await failStep(
          event.error.message,
          event.error.type === "aborted" ? "aborted" : "failed",
        )
        await markFailedTurn(sessions, turn, event.error.message)

        yield {
          type: "error",
          message: event.error.message,
          retryable: isRetryableModelError(event.error),
          inputPersisted: turn.inputPersisted,
        }
        return
      }

      if (event.type === "step-start") {
        await startStep()
        continue
      }

      if (event.type === "step-end") {
        await completeStep()
        continue
      }

      if (event.type === "usage") {
        await updateStepUsage(event.usage)
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
    await failStep(error, isAbortError(error) ? "aborted" : "failed")
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
