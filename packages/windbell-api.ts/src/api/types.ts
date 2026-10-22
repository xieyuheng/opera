import type * as W from "@xieyuheng/windbell.ts"

export type HomeData = {
  workspaces: Array<W.Workspace>
  sessionsByWorkspaceId: Record<W.WorkspaceId, Array<W.SessionIndex>>
}

export type SignPreview = W.SignPreview

export type WorkspaceSessionPreview = W.SessionIndex & {
  signPreviews: Array<SignPreview>
}

export type WorkspacePageData = {
  workspace: W.Workspace
  sessionPreviews: Array<WorkspaceSessionPreview>
  nextCursor: string | null
}

export type SessionData = {
  session: W.Session
  workspace: W.Workspace
}

export type DustbinSessionPreview = W.DustbinSessionIndex & {
  signPreviews: Array<SignPreview>
}

export type SessionDustbinPageData = {
  sessionPreviews: Array<DustbinSessionPreview>
}

export type WorkspaceDustbinData = {
  workspaces: Array<W.DustbinWorkspace>
  sessionsByWorkspaceId: Record<W.WorkspaceId, Array<W.DustbinSessionIndex>>
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
  providerConfig: W.ProviderConfig
  apiKeyConfigured: boolean
  isDefaultProvider: boolean
  warning?: string
  models: Array<W.ModelEntry>
}
