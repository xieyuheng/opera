import type { Shell } from "@windbell/sh.js/sh"
import type { Database } from "../database/Database.ts"
import { makeModel } from "../models/makeModel.ts"
import { PersonaSign, type Sign } from "../sign/index.ts"
import { generateTitle } from "../session/generateTitle.ts"
import { makeAgentFromSession } from "../session/makeAgentFromSession.ts"
import type { Session, SessionId, SessionIndex } from "../session/Session.ts"
import { makeShellToolRouter } from "../tools/makeShellToolRouter.ts"
import { resolveTurn } from "../turn/resolveTurn.ts"
import { turnReplay } from "../turn/turnReplay.ts"
import { turnRun } from "../turn/turnRun.ts"
import type { TurnEvent } from "../turn/TurnEvent.ts"
import type { Workspace, WorkspaceId } from "../workspace/Workspace.ts"

export type SessionsService = {
  list(options: {
    workspaceId: WorkspaceId | undefined
  }): Promise<Array<SessionIndex>>
  make(options: { workspaceId: WorkspaceId; title: string }): Promise<Session>
  get(id: SessionId): Promise<Session | undefined>
  put(session: Session): Promise<void>
  generateTitle(options: {
    sessionId: SessionId
    model: { providerName: string; name: string }
  }): Promise<string>
  interpret(options: {
    sessionId: SessionId
    model: { providerName: string; name: string }
    turnId: string
    input: Array<Sign>
    signal?: AbortSignal
  }): AsyncIterable<TurnEvent>
  remove(id: SessionId): Promise<void>
}

export type SessionsServiceOptions = {
  database: Database
  sh: Shell
}

const persona = "You are a helpful software engineer assistant."

export function makeSessionsService(
  options: SessionsServiceOptions,
): SessionsService {
  const database = options.database
  const sh = options.sh

  function makeInitialSigns(workspace: Workspace): Array<Sign> {
    const toolRouter = makeShellToolRouter({
      sh,
      cwd: workspace.root,
    })

    return [...toolRouter.toolSigns, PersonaSign(persona)]
  }

  return {
    list: (listOptions) => database.sessions.list(listOptions),
    get: (id) => database.sessions.get(id),
    put: (session) => database.sessions.put(session),
    remove: (id) => database.sessions.remove(id),

    async make(makeOptions) {
      const workspace = await database.workspaces.get(makeOptions.workspaceId)
      if (workspace === undefined) {
        throw new Error(`workspace not found: ${makeOptions.workspaceId}`)
      }

      const session = await database.sessions.make({
        workspaceId: makeOptions.workspaceId,
        title: makeOptions.title,
      })
      session.context = makeInitialSigns(workspace)
      await database.sessions.put(session)
      return session
    },

    async generateTitle(titleOptions) {
      const session = await database.sessions.get(titleOptions.sessionId)
      if (session === undefined) {
        throw new Error(`session not found: ${titleOptions.sessionId}`)
      }

      const model = await makeModel(titleOptions.model, { database })
      const result = await generateTitle({
        model,
        context: session.context,
      })

      const title = result.kind === "ok" ? result.title : ""
      if (title !== "") {
        await database.sessions.updateTitle(titleOptions.sessionId, title)
      }

      return title
    },

    async *interpret(interpretOptions) {
      const session = await database.sessions.get(interpretOptions.sessionId)
      if (session === undefined) {
        throw new Error(`session not found: ${interpretOptions.sessionId}`)
      }

      const workspace = await database.workspaces.get(session.workspaceId)
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
        isRetryable: isRetryableError,
      })
    },
  }
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError) return true

  if (error !== null && typeof error === "object") {
    const status = (error as { status?: unknown }).status
    if (typeof status === "number") {
      return status === 408 || status === 429 || status >= 500
    }
  }

  return false
}
