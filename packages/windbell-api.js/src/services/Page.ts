import type * as S from "@windbell/semiosis.js"
import { err, ok, type Result } from "@windbell/std.js/result"
import type {
  DustbinSessionDataItem,
  HomeData,
  ProviderData,
  ProviderListData,
  SessionData,
  SessionDustbinData,
  WorkspaceData,
  WorkspaceDustbinData,
} from "../api/types.ts"
import type { ServiceError } from "../errors/ServiceError.ts"

export type PageDataServiceOptions = {
  database: S.Database
}

export type PageProviderServiceOptions = {
  providers: S.ProviderService
  settings: S.SettingsService
}

export function LoadHomeData(options: PageDataServiceOptions) {
  return async (): Promise<Result<HomeData, ServiceError>> => {
    const [workspaces, sessions] = await Promise.all([
      options.database.workspaces.list(),
      options.database.sessions.list({ workspaceId: undefined }),
    ])

    return ok({
      workspaces,
      sessionsByWorkspaceId: groupSessionsByWorkspace(sessions),
    })
  }
}

export function LoadWorkspaceData(options: PageDataServiceOptions) {
  return async (input: {
    workspaceId: S.WorkspaceId
  }): Promise<Result<WorkspaceData, ServiceError>> => {
    const workspace = await options.database.workspaces.get(input.workspaceId)

    if (workspace === undefined) {
      return err({
        type: "workspace-not-found",
        status: 404,
        message: "workspace not found",
        info: { workspaceId: input.workspaceId },
      })
    }

    const indexes = await options.database.sessions.list({
      workspaceId: input.workspaceId,
    })
    const sessions: Array<S.Session> = []

    for (const index of indexes) {
      const session = await options.database.sessions.get(index.id)
      if (session !== undefined) sessions.push(session)
    }

    return ok({ workspace, sessions })
  }
}

export function LoadSessionData(options: PageDataServiceOptions) {
  return async (input: {
    sessionId: S.SessionId
  }): Promise<Result<SessionData, ServiceError>> => {
    const session = await options.database.sessions.get(input.sessionId)

    if (session === undefined) {
      return err({
        type: "session-not-found",
        status: 404,
        message: "session not found",
        info: { sessionId: input.sessionId },
      })
    }

    const workspace = await options.database.workspaces.get(session.workspaceId)

    if (workspace === undefined) {
      return err({
        type: "workspace-not-found",
        status: 404,
        message: "workspace not found",
        info: { workspaceId: session.workspaceId },
      })
    }

    return ok({ session, workspace })
  }
}

export function LoadSessionDustbinData(options: PageDataServiceOptions) {
  return async (input: {
    workspaceId: S.WorkspaceId | undefined
  }): Promise<Result<SessionDustbinData, ServiceError>> => {
    const indexes = await options.database.dustbin.sessions.list(input)
    const sessions: Array<DustbinSessionDataItem> = []

    for (const index of indexes) {
      const session = await options.database.dustbin.sessions.get(index.id)
      sessions.push({
        ...index,
        context: session?.context ?? [],
      })
    }

    return ok({ sessions })
  }
}

export function LoadWorkspaceDustbinData(options: PageDataServiceOptions) {
  return async (): Promise<Result<WorkspaceDustbinData, ServiceError>> => {
    const [workspaces, sessions] = await Promise.all([
      options.database.dustbin.workspaces.list(),
      options.database.dustbin.sessions.list({ workspaceId: undefined }),
    ])

    return ok({
      workspaces,
      sessionsByWorkspaceId: groupSessionsByWorkspace(sessions),
    })
  }
}

export function LoadProviderListData(options: PageProviderServiceOptions) {
  return async (): Promise<Result<ProviderListData, ServiceError>> => {
    const [providerConfigs, currentSettings] = await Promise.all([
      options.providers.list(),
      options.settings.get(),
    ])
    const entries = []

    for (const providerConfig of providerConfigs) {
      const [apiKeyConfigured, models] = await Promise.all([
        options.providers.getApiKeyStatus(providerConfig.name),
        options.providers.listModels({ providerName: providerConfig.name }),
      ])

      entries.push({
        name: providerConfig.name,
        baseUrl: providerConfig.baseUrl,
        defaultModel: providerConfig.defaultModel,
        apiKeyConfigured,
        isDefaultProvider:
          currentSettings.defaultProvider === providerConfig.name,
        models: models.map((model) => ({
          name: model.name,
          pinned: model.pinned,
          isDefault: providerConfig.defaultModel === model.name,
        })),
      })
    }

    return ok({ providers: entries })
  }
}

export function LoadProviderData(options: PageProviderServiceOptions) {
  return async (input: {
    providerName: string
  }): Promise<Result<ProviderData, ServiceError>> => {
    const [providerConfigs, currentSettings, apiKeyConfigured, localModels] =
      await Promise.all([
        options.providers.list(),
        options.settings.get(),
        options.providers.getApiKeyStatus(input.providerName),
        options.providers.listModels({ providerName: input.providerName }),
      ])
    const providerConfig = providerConfigs.find(
      (config) => config.name === input.providerName,
    )

    if (providerConfig === undefined) {
      return err({
        type: "provider-not-found",
        status: 404,
        message: "provider not found",
        info: { providerName: input.providerName },
      })
    }

    let models = localModels
    let warning: string | undefined

    if (apiKeyConfigured) {
      try {
        models = await options.providers.listModels({
          providerName: input.providerName,
          all: true,
        })
      } catch (error) {
        warning = error instanceof Error ? error.message : String(error)
      }
    } else {
      warning = "api key is not configured; showing local models only"
    }

    return ok({
      providerConfig,
      apiKeyConfigured,
      isDefaultProvider: currentSettings.defaultProvider === input.providerName,
      warning,
      models,
    })
  }
}

function groupSessionsByWorkspace<T extends { workspaceId: S.WorkspaceId }>(
  sessions: Array<T>,
): Record<S.WorkspaceId, Array<T>> {
  const grouped: Record<S.WorkspaceId, Array<T>> = {}

  for (const session of sessions) {
    grouped[session.workspaceId] ??= []
    grouped[session.workspaceId].push(session)
  }

  return grouped
}
