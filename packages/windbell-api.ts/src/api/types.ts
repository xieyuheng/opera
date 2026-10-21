import type * as S from "@windbell/semiosis.ts"

export type HomeData = {
  workspaces: Array<S.Workspace>
  sessionsByWorkspaceId: Record<S.WorkspaceId, Array<S.SessionIndex>>
}

export type SignPreview = S.SignPreview

export type WorkspaceSessionPreview = S.SessionIndex & {
  signPreviews: Array<SignPreview>
}

export type WorkspacePageData = {
  workspace: S.Workspace
  sessionPreviews: Array<WorkspaceSessionPreview>
}

export type SessionData = {
  session: S.Session
  workspace: S.Workspace
}

export type DustbinSessionPreview = S.DustbinSessionIndex & {
  signPreviews: Array<SignPreview>
}

export type SessionDustbinPageData = {
  sessionPreviews: Array<DustbinSessionPreview>
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
