import {
  makeServiceError,
  makeServiceErrorFromDatabaseError,
  makeSignPreview,
} from "@xieyuheng/semiosis.ts"
import type * as S from "@xieyuheng/semiosis.ts"
import { err, isError, ok, type Result } from "@xieyuheng/std.ts/result"

import {
  encodeWorkspaceSessionCursor,
  type WorkspaceSessionCursor,
} from "../api/cursor.ts"
import type {
  DustbinSessionPreview,
  HomeData,
  ProviderData,
  ProviderListData,
  SessionData,
  SessionDustbinPageData,
  WorkspaceDustbinData,
  WorkspacePageData,
  WorkspaceSessionPreview,
} from "../api/types.ts"

export type PageDataServiceOptions = {
  database: S.Database
}

export type PageProviderServiceOptions = {
  providers: S.ProviderService
  settings: S.SettingsService
}

function fromDatabase<Output>(
  result: Result<Output, S.DatabaseError>,
): Result<Output, S.ServiceError> {
  if (isError(result)) {
    return err(makeServiceErrorFromDatabaseError(result.error))
  }
  return ok(result.value)
}

export function LoadHomeData(options: PageDataServiceOptions) {
  return async (): Promise<Result<HomeData, S.ServiceError>> => {
    const workspacesResult = fromDatabase(
      await options.database.workspaces.list(),
    )
    if (isError(workspacesResult)) return workspacesResult

    const sessionsResult = fromDatabase(
      await options.database.sessions.list({ workspaceId: undefined }),
    )
    if (isError(sessionsResult)) return sessionsResult

    return ok({
      workspaces: workspacesResult.value,
      sessionsByWorkspaceId: groupSessionsByWorkspace(sessionsResult.value),
    })
  }
}

export function LoadWorkspaceData(options: PageDataServiceOptions) {
  return async (input: {
    workspaceId: S.WorkspaceId
    previewLimit: number
    limit: number
    cursor?: WorkspaceSessionCursor
  }): Promise<Result<WorkspacePageData, S.ServiceError>> => {
    const workspaceResult = fromDatabase(
      await options.database.workspaces.get(input.workspaceId),
    )
    if (isError(workspaceResult)) return workspaceResult
    const workspace = workspaceResult.value

    if (workspace === undefined) {
      return err(
        makeServiceError({
          type: "workspace-not-found",
          message: "workspace not found",
          info: { workspaceId: input.workspaceId },
        }),
      )
    }

    const pageResult = fromDatabase(
      await options.database.sessions.listPage({
        workspaceId: input.workspaceId,
        limit: input.limit,
        cursor: input.cursor,
      }),
    )
    if (isError(pageResult)) return pageResult

    const previewResults = await Promise.all(
      pageResult.value.indexes.map(async (index) => {
        const signsResult = fromDatabase(
          await options.database.sessions.getContextTail(
            index.id,
            input.previewLimit,
          ),
        )
        if (isError(signsResult)) return signsResult

        return ok<WorkspaceSessionPreview>({
          ...index,
          signPreviews: signsResult.value.map((sign) => makeSignPreview(sign)),
        })
      }),
    )

    const sessionPreviews: Array<WorkspaceSessionPreview> = []

    for (const previewResult of previewResults) {
      if (isError(previewResult)) return previewResult
      sessionPreviews.push(previewResult.value)
    }

    return ok({
      workspace,
      sessionPreviews,
      nextCursor:
        pageResult.value.nextCursor === null
          ? null
          : encodeWorkspaceSessionCursor(pageResult.value.nextCursor),
    })
  }
}

export function LoadSessionData(options: PageDataServiceOptions) {
  return async (input: {
    sessionId: S.SessionId
  }): Promise<Result<SessionData, S.ServiceError>> => {
    const sessionResult = fromDatabase(
      await options.database.sessions.get(input.sessionId),
    )
    if (isError(sessionResult)) return sessionResult
    const session = sessionResult.value

    if (session === undefined) {
      return err(
        makeServiceError({
          type: "session-not-found",
          message: "session not found",
          info: { sessionId: input.sessionId },
        }),
      )
    }

    const workspaceResult = fromDatabase(
      await options.database.workspaces.get(session.workspaceId),
    )
    if (isError(workspaceResult)) return workspaceResult
    const workspace = workspaceResult.value

    if (workspace === undefined) {
      return err(
        makeServiceError({
          type: "workspace-not-found",
          message: "workspace not found",
          info: { workspaceId: session.workspaceId },
        }),
      )
    }

    return ok({ session, workspace })
  }
}

export function LoadSessionDustbinData(options: PageDataServiceOptions) {
  return async (input: {
    workspaceId: S.WorkspaceId | undefined
    previewLimit: number
  }): Promise<Result<SessionDustbinPageData, S.ServiceError>> => {
    const indexesResult = fromDatabase(
      await options.database.dustbin.sessions.list({
        workspaceId: input.workspaceId,
      }),
    )
    if (isError(indexesResult)) return indexesResult

    const previewResults = await Promise.all(
      indexesResult.value.map(async (index) => {
        const signsResult = fromDatabase(
          await options.database.dustbin.sessions.getContextTail(
            index.id,
            input.previewLimit,
          ),
        )
        if (isError(signsResult)) return signsResult

        return ok<DustbinSessionPreview>({
          ...index,
          signPreviews: signsResult.value.map((sign) => makeSignPreview(sign)),
        })
      }),
    )

    const sessionPreviews: Array<DustbinSessionPreview> = []

    for (const previewResult of previewResults) {
      if (isError(previewResult)) return previewResult
      sessionPreviews.push(previewResult.value)
    }

    return ok({ sessionPreviews })
  }
}

export function LoadWorkspaceDustbinData(options: PageDataServiceOptions) {
  return async (): Promise<Result<WorkspaceDustbinData, S.ServiceError>> => {
    const workspacesResult = fromDatabase(
      await options.database.dustbin.workspaces.list(),
    )
    if (isError(workspacesResult)) return workspacesResult

    const sessionsResult = fromDatabase(
      await options.database.dustbin.sessions.list({
        workspaceId: undefined,
      }),
    )
    if (isError(sessionsResult)) return sessionsResult

    return ok({
      workspaces: workspacesResult.value,
      sessionsByWorkspaceId: groupSessionsByWorkspace(sessionsResult.value),
    })
  }
}

export function LoadProviderListData(options: PageProviderServiceOptions) {
  return async (): Promise<Result<ProviderListData, S.ServiceError>> => {
    const providerConfigsResult = await options.providers.list()
    if (isError(providerConfigsResult)) return providerConfigsResult

    const currentSettingsResult = await options.settings.get()
    if (isError(currentSettingsResult)) return currentSettingsResult
    const currentSettings = currentSettingsResult.value

    const entries = []

    for (const providerConfig of providerConfigsResult.value) {
      const apiKeyConfiguredResult = await options.providers.getApiKeyStatus(
        providerConfig.name,
      )
      if (isError(apiKeyConfiguredResult)) return apiKeyConfiguredResult

      const modelsResult = await options.providers.listModels({
        providerName: providerConfig.name,
      })
      if (isError(modelsResult)) return modelsResult

      entries.push({
        name: providerConfig.name,
        baseUrl: providerConfig.baseUrl,
        defaultModel: providerConfig.defaultModel,
        apiKeyConfigured: apiKeyConfiguredResult.value,
        isDefaultProvider:
          currentSettings.defaultProvider === providerConfig.name,
        models: modelsResult.value.map((model) => ({
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
  }): Promise<Result<ProviderData, S.ServiceError>> => {
    const providerConfigsResult = await options.providers.list()
    if (isError(providerConfigsResult)) return providerConfigsResult

    const currentSettingsResult = await options.settings.get()
    if (isError(currentSettingsResult)) return currentSettingsResult
    const currentSettings = currentSettingsResult.value

    const apiKeyConfiguredResult = await options.providers.getApiKeyStatus(
      input.providerName,
    )
    if (isError(apiKeyConfiguredResult)) return apiKeyConfiguredResult

    const localModelsResult = await options.providers.listModels({
      providerName: input.providerName,
    })
    if (isError(localModelsResult)) return localModelsResult

    const providerConfig = providerConfigsResult.value.find(
      (config) => config.name === input.providerName,
    )

    if (providerConfig === undefined) {
      return err(
        makeServiceError({
          type: "provider-not-found",
          message: "provider not found",
          info: { providerName: input.providerName },
        }),
      )
    }

    let models = localModelsResult.value
    let warning: string | undefined

    if (apiKeyConfiguredResult.value) {
      const allModelsResult = await options.providers.listModels({
        providerName: input.providerName,
        all: true,
      })
      if (isError(allModelsResult)) {
        warning = allModelsResult.error.message
      } else {
        models = allModelsResult.value
      }
    } else {
      warning = "api key is not configured; showing local models only"
    }

    return ok({
      providerConfig,
      apiKeyConfigured: apiKeyConfiguredResult.value,
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
