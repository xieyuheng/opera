import type { FileSystem } from "@windbell/fs.js/fs"
import type { Path } from "@windbell/std.js/path"
import {
  makeDustbinSessionStore,
  type DustbinSessionStore,
} from "./DustbinSessionStore.ts"
import {
  makeDustbinWorkspaceStore,
  type DustbinWorkspaceStore,
} from "./DustbinWorkspaceStore.ts"
import { makeFileStore, type FileStore } from "./FileStore.ts"
import { makeProviderStore, type ProviderStore } from "./ProviderStore.ts"
import { makeSessionStore, type SessionStore } from "./SessionStore.ts"
import { makeSettingsStore, type SettingsStore } from "./SettingsStore.ts"
import { makeWorkspaceStore, type WorkspaceStore } from "./WorkspaceStore.ts"

export type DatabaseOptions = {
  fs: FileSystem
  path: Path
  root: string
}

export type Database = {
  fs: FileSystem
  path: Path
  files: FileStore
  root: string
  providersRoot: string
  providers: ProviderStore
  settings: SettingsStore
  workspaces: WorkspaceStore
  sessions: SessionStore
  dustbin: {
    sessions: DustbinSessionStore
    workspaces: DustbinWorkspaceStore
  }
}

export function makeDatabase(options: DatabaseOptions): Database {
  const root = options.path.normalize(options.root)
  const providersRoot = options.path.join(root, "providers")
  const files = makeFileStore({
    fs: options.fs,
    path: options.path,
  })

  const workspaces = makeWorkspaceStore({
    files,
    path: options.path,
    root: options.path.join(root, "workspaces"),
  })

  const sessions = makeSessionStore({
    files,
    path: options.path,
    root: options.path.join(root, "sessions"),
    async onSessionUpdated(session) {
      const workspace = await workspaces.get(session.workspaceId)
      if (workspace === undefined) return

      const updatedAt = Math.max(workspace.updatedAt, session.updatedAt)
      if (updatedAt === workspace.updatedAt) return

      await workspaces.put({
        ...workspace,
        updatedAt,
      })
    },
  })

  return {
    fs: options.fs,
    path: options.path,
    files,
    root,
    providersRoot,
    providers: makeProviderStore({
      files,
      path: options.path,
      root: providersRoot,
    }),
    settings: makeSettingsStore({
      files,
      path: options.path,
      root,
    }),
    workspaces,
    sessions,
    dustbin: {
      sessions: makeDustbinSessionStore({
        files,
        path: options.path,
        sessionsRoot: options.path.join(root, "sessions"),
        dustbinSessionsRoot: options.path.join(root, "dustbin", "sessions"),
      }),
      workspaces: makeDustbinWorkspaceStore({
        files,
        path: options.path,
        workspacesRoot: options.path.join(root, "workspaces"),
        dustbinWorkspacesRoot: options.path.join(root, "dustbin", "workspaces"),
      }),
    },
  }
}
