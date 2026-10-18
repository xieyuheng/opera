import type { LockService } from "@windbell/lock.ts/lock"
import type { Shell } from "@windbell/sh.ts/sh"
import { err, isError, ok, unwrap, type Result } from "@windbell/std.ts/result"
import type { Database } from "../database/Database.ts"
import type { ModelTotalUsage, ModelUsage } from "../model/index.ts"
import { makeModel } from "../models/makeModel.ts"
import { PersonaSign, type Sign } from "../sign/index.ts"
import { generateTitle } from "../session/generateTitle.ts"
import { makeAgentFromSession } from "../session/makeAgentFromSession.ts"
import type { Session, SessionId, SessionIndex } from "../session/Session.ts"
import { makeShellToolRouter } from "../tools/makeShellToolRouter.ts"
import { resolveTurn } from "../turn/resolveTurn.ts"
import { turnReplay } from "../turn/turnReplay.ts"
import type { SessionUsage, Turn, TurnDetails } from "../turn/Turn.ts"
import { turnRun } from "../turn/turnRun.ts"
import type { TurnEvent } from "../turn/TurnEvent.ts"
import type { Workspace, WorkspaceId } from "../workspace/Workspace.ts"
import {
  makeServiceError,
  makeServiceErrorFromDatabaseError,
  type ServiceError,
} from "./ServiceError.ts"

export type SessionService = {
  list(options: {
    workspaceId: WorkspaceId | undefined
  }): Promise<Result<Array<SessionIndex>, ServiceError>>
  make(options: {
    workspaceId: WorkspaceId
    title: string
  }): Promise<Result<Session, ServiceError>>
  get(id: SessionId): Promise<Result<Session | undefined, ServiceError>>
  getUsage(options: {
    sessionId: SessionId
  }): Promise<Result<SessionUsage, ServiceError>>
  listTurns(options: {
    sessionId: SessionId
    details?: boolean
  }): Promise<Result<Array<Turn> | Array<TurnDetails>, ServiceError>>
  put(session: Session): Promise<Result<void, ServiceError>>
  generateTitle(options: {
    sessionId: SessionId
    model: { providerName: string; name: string }
  }): Promise<Result<string, ServiceError>>
  interpret(options: {
    sessionId: SessionId
    model: { providerName: string; name: string }
    turnId: string
    input: Array<Sign>
    signal?: AbortSignal
  }): AsyncIterable<TurnEvent>
  remove(id: SessionId): Promise<Result<void, ServiceError>>
}

export type SessionServiceOptions = {
  database: Database
  sh: Shell
  lock?: LockService
}

const persona = "You are a helpful software engineer assistant."
const lockTtlMs = 60_000
const lockRenewIntervalMs = 20_000

export function makeSessionService(
  options: SessionServiceOptions,
): SessionService {
  const database = options.database
  const sh = options.sh

  function makeInitialSigns(workspace: Workspace): Array<Sign> {
    const toolRouter = makeShellToolRouter({
      sh,
      cwd: workspace.root,
    })

    return [...toolRouter.toolSigns, PersonaSign(persona)]
  }

  async function* interpretWithLock(
    interpretOptions: Parameters<SessionService["interpret"]>[0],
  ): AsyncGenerator<TurnEvent> {
    const lockService = options.lock

    if (lockService === undefined) {
      yield* interpretUnlocked(interpretOptions)
      return
    }

    const lockResult = await lockService.tryLock(
      `session:${interpretOptions.sessionId}`,
      { ttlMs: lockTtlMs },
    )

    if (lockResult.kind === "ErrorResult") {
      yield lockErrorEvent(lockResult.error.message)
      return
    }

    const lock = lockResult.value
    if (lock === undefined) {
      yield lockErrorEvent("session is already running")
      return
    }

    const renewTimer = setInterval(() => {
      void lock.renew().catch(() => undefined)
    }, lockRenewIntervalMs)

    try {
      yield* interpretUnlocked(interpretOptions)
    } finally {
      clearInterval(renewTimer)
      await lock.release().catch(() => undefined)
    }
  }

  async function* interpretUnlocked(
    interpretOptions: Parameters<SessionService["interpret"]>[0],
  ): AsyncGenerator<TurnEvent> {
    const session = unwrap(
      await database.sessions.get(interpretOptions.sessionId),
    )
    if (session === undefined) {
      throw new Error(`session not found: ${interpretOptions.sessionId}`)
    }

    const workspace = unwrap(await database.workspaces.get(session.workspaceId))
    if (workspace === undefined) {
      throw new Error(`workspace not found: ${session.workspaceId}`)
    }

    const resolved = await resolveTurn({
      sessions: database.sessions,
      sessionId: interpretOptions.sessionId,
      turnId: interpretOptions.turnId,
      model: interpretOptions.model,
      input: interpretOptions.input,
    })

    if (resolved.kind === "error") {
      throw new Error(resolved.message)
    }

    if (resolved.kind === "replay") {
      for await (const sign of turnReplay({
        sessions: database.sessions,
        turn: resolved.turn,
      })) {
        yield { type: "sign", sign }
      }

      return
    }

    const model = await makeModel(resolved.turn.model, { database })
    const toolRouter = makeShellToolRouter({
      sh,
      cwd: workspace.root,
    })

    const agent = await makeAgentFromSession({
      database,
      sessionId: interpretOptions.sessionId,
      model,
      shellName: sh.name,
      makeToolRouter: () => toolRouter,
    })

    yield* turnRun({
      sessions: database.sessions,
      agent,
      turn: resolved.turn,
      input: interpretOptions.input,
      signal: interpretOptions.signal,
    })
  }

  async function readSessionTurns(
    sessionId: SessionId,
  ): Promise<Result<Array<Turn>, ServiceError>> {
    const sessionResult = await database.sessions.get(sessionId)
    if (isError(sessionResult)) {
      return err(makeServiceErrorFromDatabaseError(sessionResult.error))
    }
    if (sessionResult.value === undefined) {
      return err(
        makeServiceError({
          type: "session-not-found",
          message: "session not found",
          info: { sessionId },
        }),
      )
    }

    const turnsResult = await database.sessions.listTurns(sessionId)
    if (isError(turnsResult)) {
      return err(makeServiceErrorFromDatabaseError(turnsResult.error))
    }

    return ok(turnsResult.value)
  }

  return {
    async list(listOptions) {
      const result = await database.sessions.list(listOptions)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(result.value)
    },

    async get(id) {
      const result = await database.sessions.get(id)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(result.value)
    },

    async getUsage(usageOptions) {
      const sessionResult = await database.sessions.get(usageOptions.sessionId)
      if (isError(sessionResult)) {
        return err(makeServiceErrorFromDatabaseError(sessionResult.error))
      }
      if (sessionResult.value === undefined) {
        return err(
          makeServiceError({
            type: "session-not-found",
            message: "session not found",
            info: { sessionId: usageOptions.sessionId },
          }),
        )
      }

      const turnsResult = await database.sessions.listTurns(
        usageOptions.sessionId,
      )
      if (isError(turnsResult)) {
        return err(makeServiceErrorFromDatabaseError(turnsResult.error))
      }

      const totalUsage = makeEmptyModelTotalUsage()
      let latestUsage: ModelUsage | undefined

      for (const turn of turnsResult.value) {
        const stepsResult = await database.sessions.listSteps(
          turn.sessionId,
          turn.id,
        )
        if (isError(stepsResult)) {
          return err(makeServiceErrorFromDatabaseError(stepsResult.error))
        }

        for (const step of stepsResult.value) {
          if (step.usage === undefined) continue

          totalUsage.input += step.usage.input
          totalUsage.output += step.usage.output
          totalUsage.cacheRead += step.usage.cacheRead
          totalUsage.cacheMiss += step.usage.cacheMiss
          totalUsage.cacheWrite += step.usage.cacheWrite
          totalUsage.total += step.usage.total
          latestUsage = step.usage
        }
      }

      return ok({ totalUsage, latestUsage })
    },

    async listTurns(turnOptions) {
      const turnsResult = await readSessionTurns(turnOptions.sessionId)
      if (isError(turnsResult)) return turnsResult
      if (!turnOptions.details) return turnsResult

      const turns: Array<TurnDetails> = []

      for (const turn of turnsResult.value) {
        const stepsResult = await database.sessions.listSteps(
          turn.sessionId,
          turn.id,
        )
        if (isError(stepsResult)) {
          return err(makeServiceErrorFromDatabaseError(stepsResult.error))
        }

        turns.push({ ...turn, steps: stepsResult.value })
      }

      return ok(turns)
    },

    async put(session) {
      const result = await database.sessions.put(session)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(undefined)
    },

    async remove(id) {
      const result = await database.sessions.remove(id)
      if (isError(result)) {
        return err(makeServiceErrorFromDatabaseError(result.error))
      }
      return ok(undefined)
    },

    async make(makeOptions) {
      const workspaceResult = await database.workspaces.get(
        makeOptions.workspaceId,
      )
      if (isError(workspaceResult)) {
        return err(makeServiceErrorFromDatabaseError(workspaceResult.error))
      }
      if (workspaceResult.value === undefined) {
        return err(
          makeServiceError({
            type: "workspace-not-found",
            message: "workspace not found",
            info: { workspaceId: makeOptions.workspaceId },
          }),
        )
      }

      const sessionResult = await database.sessions.make({
        workspaceId: makeOptions.workspaceId,
        title: makeOptions.title,
      })
      if (isError(sessionResult)) {
        return err(makeServiceErrorFromDatabaseError(sessionResult.error))
      }

      const session = sessionResult.value
      session.context = makeInitialSigns(workspaceResult.value)

      const putResult = await database.sessions.put(session)
      if (isError(putResult)) {
        return err(makeServiceErrorFromDatabaseError(putResult.error))
      }

      return ok(session)
    },

    async generateTitle(titleOptions) {
      const sessionResult = await database.sessions.get(titleOptions.sessionId)
      if (isError(sessionResult)) {
        return err(makeServiceErrorFromDatabaseError(sessionResult.error))
      }
      if (sessionResult.value === undefined) {
        return err(
          makeServiceError({
            type: "session-not-found",
            message: "session not found",
            info: { sessionId: titleOptions.sessionId },
          }),
        )
      }

      try {
        const model = await makeModel(titleOptions.model, { database })
        const result = await generateTitle({
          model,
          context: sessionResult.value.context,
        })

        if (result.kind === "error") {
          return err(
            makeServiceError({
              type: "model-error",
              message: result.error.message,
            }),
          )
        }

        const title = result.kind === "ok" ? result.title : ""
        if (title !== "") {
          const updateResult = await database.sessions.updateTitle(
            titleOptions.sessionId,
            title,
          )
          if (isError(updateResult)) {
            return err(makeServiceErrorFromDatabaseError(updateResult.error))
          }
        }

        return ok(title)
      } catch (error) {
        return err(
          makeServiceError({
            type: "model-error",
            message: error instanceof Error ? error.message : String(error),
          }),
        )
      }
    },

    interpret: (interpretOptions) => interpretWithLock(interpretOptions),
  }
}

function makeEmptyModelTotalUsage(): ModelTotalUsage {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheMiss: 0,
    cacheWrite: 0,
    total: 0,
  }
}

function lockErrorEvent(message: string): TurnEvent {
  return {
    type: "error",
    message,
    retryable: false,
    inputPersisted: false,
  }
}
