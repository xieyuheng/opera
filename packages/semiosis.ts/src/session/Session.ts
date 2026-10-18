import type { Sign } from "../sign/index.ts"
import type { WorkspaceId } from "../workspace/Workspace.ts"

export type SessionId = string

export type Session = {
  id: SessionId
  workspaceId: WorkspaceId
  title: string
  context: Array<Sign>
  createdAt: number
  updatedAt: number
}

export type SessionIndex = Omit<Session, "context">

export type DustbinSessionIndex = SessionIndex & {
  deletedAt: number
  trashedWithWorkspace?: boolean
}
