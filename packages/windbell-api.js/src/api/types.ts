import type * as S from "@windbell/semiosis.js"

export type HomeData = {
  workspaces: Array<S.Workspace>
  sessionsByWorkspaceId: Record<S.WorkspaceId, Array<S.SessionIndex>>
}

export type WorkspaceData = {
  workspace: S.Workspace
  sessions: Array<S.Session>
}

export type SessionData = {
  session: S.Session
  workspace: S.Workspace
}

export type DustbinSessionDataItem = S.DustbinSessionIndex & {
  context: Array<S.Sign>
}

export type SessionDustbinData = {
  sessions: Array<DustbinSessionDataItem>
}

export type WorkspaceDustbinData = {
  workspaces: Array<S.DustbinWorkspace>
  sessionsByWorkspaceId: Record<S.WorkspaceId, Array<S.DustbinSessionIndex>>
}

export type ProviderListModelData = {
  name: string
  pinned: boolean
  isDefault: boolean
}

export type ProviderListProviderData = {
  name: string
  baseUrl: string
  defaultModel: string | null
  apiKeyConfigured: boolean
  isDefaultProvider: boolean
  models: Array<ProviderListModelData>
}

export type ProviderListData = {
  providers: Array<ProviderListProviderData>
}

export type ProviderData = {
  providerConfig: S.ProviderConfig
  apiKeyConfigured: boolean
  isDefaultProvider: boolean
  warning?: string
  models: Array<S.ModelEntry>
}
