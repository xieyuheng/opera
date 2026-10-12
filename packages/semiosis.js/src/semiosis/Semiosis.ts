import type { FileSystem } from "@windbell/fs.js/fs"
import type { Shell } from "@windbell/sh.js/sh"
import type { Path } from "@windbell/std.js/path"
import type { Sign } from "../sign/index.ts"
import { PersonaSign } from "../sign/index.ts"
import type { Settings } from "../settings/Settings.ts"
import type { ProviderConfig } from "../provider/index.ts"
import type { ProviderModelEntry } from "../models/ProviderModelEntry.ts"
import { providerNames } from "../providers/providerNames.ts"
import { readProviderConfig } from "../provider/index.ts"
import { deleteApiKey, hasApiKey, writeApiKey } from "../database/apiKey.ts"
import { makeDatabase, type Database } from "../database/Database.ts"
import { listProviderModelEntries } from "../models/listProviderModelEntries.ts"
import { makeModel } from "../models/makeModel.ts"
import { pinModel } from "../models/pinModel.ts"
import { setDefaultModel } from "../models/setDefaultModel.ts"
import { unpinModel } from "../models/unpinModel.ts"
import { generateTitle } from "../session/generateTitle.ts"
import { makeAgentFromSession } from "../session/makeAgentFromSession.ts"
import type {
  DustbinSessionIndex,
  Session,
  SessionId,
  SessionIndex,
} from "../session/Session.ts"
import { makeShellToolRouter } from "../tools/makeShellToolRouter.ts"
import { resolveTurn } from "../turn/resolveTurn.ts"
import { turnReplay } from "../turn/turnReplay.ts"
import { turnRun } from "../turn/turnRun.ts"
import type { TurnEvent } from "../turn/TurnEvent.ts"
import type {
  DustbinWorkspace,
  Workspace,
  WorkspaceId,
} from "../workspace/Workspace.ts"

export type SemiosisOptions = {
  fs: FileSystem
  path: Path
  root: string
  sh: Shell
}

export type Semiosis = {
  database: Database
  providers: ProvidersService
  settings: SettingsService
  workspaces: WorkspacesService
  sessions: SessionsService
  dustbin: {
    sessions: DustbinSessionsService
    workspaces: DustbinWorkspacesService
  }
}

export type ProvidersService = {
  list(): Promise<Array<ProviderConfig>>
  get(providerName: string): Promise<ProviderConfig>
  getApiKeyStatus(providerName: string): Promise<boolean>
  listModels(options: {
    providerName: string
    all?: boolean
  }): Promise<Array<ProviderModelEntry>>
  pinModel(options: { providerName: string; modelName: string }): Promise<void>
  unpinModel(options: {
    providerName: string
    modelName: string
  }): Promise<void>
  setDefaultModel(options: {
    providerName: string
    modelName: string
  }): Promise<void>
  putApiKey(options: { providerName: string; key: string }): Promise<void>
  deleteApiKey(providerName: string): Promise<void>
}

export type SettingsService = {
  get(): Promise<Settings>
  put(settings: Settings): Promise<void>
}

export type WorkspacesService = {
  list(): Promise<Array<Workspace>>
  ensure(options: { name: string; root: string }): Promise<Workspace>
  get(id: WorkspaceId): Promise<Workspace | undefined>
  put(workspace: Workspace): Promise<void>
  remove(id: WorkspaceId): Promise<void>
}

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

export type DustbinSessionsService = {
  list(options: {
    workspaceId: WorkspaceId | undefined
  }): Promise<Array<DustbinSessionIndex>>
  get(sessionId: SessionId): Promise<Session | undefined>
  trash(sessionId: SessionId): Promise<void>
  restore(sessionId: SessionId): Promise<void>
  remove(sessionId: SessionId): Promise<void>
}

export type DustbinWorkspacesService = {
  list(): Promise<Array<DustbinWorkspace>>
  get(id: WorkspaceId): Promise<DustbinWorkspace | undefined>
  trash(id: WorkspaceId): Promise<void>
  restore(id: WorkspaceId): Promise<void>
  remove(id: WorkspaceId): Promise<void>
}

const persona = "You are a helpful software engineer assistant."

export function makeSemiosis(options: SemiosisOptions): Semiosis {
  const sh = options.sh
  const database = makeDatabase({
    fs: options.fs,
    path: options.path,
    root: options.root,
  })

  function makeInitialSigns(workspace: Workspace): Array<Sign> {
    const toolRouter = makeShellToolRouter({
      sh: options.sh,
      cwd: workspace.root,
    })

    return [...toolRouter.toolSigns, PersonaSign(persona)]
  }

  const providers: ProvidersService = {
    async list() {
      const configs: Array<ProviderConfig> = []

      for (const providerName of providerNames) {
        configs.push(await readProviderConfig(database, providerName))
      }

      return configs
    },

    async get(providerName) {
      return await readProviderConfig(database, providerName)
    },

    async getApiKeyStatus(providerName) {
      return await hasApiKey(database, providerName)
    },

    async listModels(options) {
      return await listProviderModelEntries(database, options.providerName, {
        all: options.all,
      })
    },

    async pinModel(options) {
      await pinModel(database, options.providerName, options.modelName)
    },

    async unpinModel(options) {
      await unpinModel(database, options.providerName, options.modelName)
    },

    async setDefaultModel(options) {
      await setDefaultModel(database, options.providerName, options.modelName)
    },

    async putApiKey(options) {
      await writeApiKey(database, options.providerName, options.key)
    },

    async deleteApiKey(providerName) {
      await deleteApiKey(database, providerName)
    },
  }

  const settings: SettingsService = {
    async get() {
      return (
        (await database.settings.get()) ?? {
          defaultProvider: null,
          themeId: null,
        }
      )
    },

    async put(value) {
      await database.settings.put(value)
    },
  }

  const workspaces: WorkspacesService = {
    list: () => database.workspaces.list(),
    ensure: (options) => database.workspaces.ensure(options),
    get: (id) => database.workspaces.get(id),
    put: (workspace) => database.workspaces.put(workspace),
    remove: (id) => database.workspaces.remove(id),
  }

  const sessions: SessionsService = {
    list: (options) => database.sessions.list(options),
    get: (id) => database.sessions.get(id),
    put: (session) => database.sessions.put(session),
    remove: (id) => database.sessions.remove(id),

    async make(options) {
      const workspace = await database.workspaces.get(options.workspaceId)
      if (workspace === undefined) {
        throw new Error(`workspace not found: ${options.workspaceId}`)
      }

      const session = await database.sessions.make({
        workspaceId: options.workspaceId,
        title: options.title,
      })
      session.context = makeInitialSigns(workspace)
      await database.sessions.put(session)
      return session
    },

    async generateTitle(options) {
      const session = await database.sessions.get(options.sessionId)
      if (session === undefined) {
        throw new Error(`session not found: ${options.sessionId}`)
      }

      const model = await makeModel(options.model, { database })
      const result = await generateTitle({
        model,
        context: session.context,
      })

      const title = result.kind === "ok" ? result.title : ""
      if (title !== "") {
        await database.sessions.updateTitle(options.sessionId, title)
      }

      return title
    },

    async *interpret(options) {
      const session = await database.sessions.get(options.sessionId)
      if (session === undefined) {
        throw new Error(`session not found: ${options.sessionId}`)
      }

      const workspace = await database.workspaces.get(session.workspaceId)
      if (workspace === undefined) {
        throw new Error(`workspace not found: ${session.workspaceId}`)
      }

      const resolved = await resolveTurn({
        sessions: database.sessions,
        sessionId: options.sessionId,
        turnId: options.turnId,
        model: options.model,
        input: options.input,
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
        sessionId: options.sessionId,
        model,
        shellName: sh.name,
        makeToolRouter: () => toolRouter,
      })

      yield* turnRun({
        sessions: database.sessions,
        agent,
        turn: resolved.turn,
        input: options.input,
        signal: options.signal,
        isRetryable: isRetryableError,
      })
    },
  }

  const dustbinSessions: DustbinSessionsService = {
    list: (options) => database.dustbin.sessions.list(options),
    get: (sessionId) => database.dustbin.sessions.get(sessionId),
    trash: (sessionId) => database.dustbin.sessions.trash(sessionId),
    restore: (sessionId) => database.dustbin.sessions.restore(sessionId),
    remove: (sessionId) => database.dustbin.sessions.remove(sessionId),
  }

  const dustbinWorkspaces: DustbinWorkspacesService = {
    list: () => database.dustbin.workspaces.list(),
    get: (id) => database.dustbin.workspaces.get(id),
    trash: (id) => database.dustbin.workspaces.trash(id),
    restore: (id) => database.dustbin.workspaces.restore(id),
    remove: (id) => database.dustbin.workspaces.remove(id),
  }

  return {
    database,
    providers,
    settings,
    workspaces,
    sessions,
    dustbin: {
      sessions: dustbinSessions,
      workspaces: dustbinWorkspaces,
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
