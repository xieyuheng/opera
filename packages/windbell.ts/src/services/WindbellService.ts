import type { FileSystem } from "@xieyuheng/fs.ts/fs"
import { makeFileLockService } from "@xieyuheng/lock.ts/file-lock"
import type { LockService } from "@xieyuheng/lock.ts/lock"
import type { Shell } from "@xieyuheng/sh.ts/sh"
import type { Path } from "@xieyuheng/std.ts/path"

import { makeDatabase, type Database } from "../database/Database.ts"
import {
  makeDustbinSessionService,
  type DustbinSessionService,
} from "./DustbinSessionService.ts"
import {
  makeDustbinWorkspaceService,
  type DustbinWorkspaceService,
} from "./DustbinWorkspaceService.ts"
import { makeProviderService, type ProviderService } from "./ProviderService.ts"
import { makeSessionService, type SessionService } from "./SessionService.ts"
import { makeSettingsService, type SettingsService } from "./SettingsService.ts"
import {
  makeWorkspaceService,
  type WorkspaceService,
} from "./WorkspaceService.ts"

export type WindbellServiceOptions = {
  fs: FileSystem
  path: Path
  root: string
  sh: Shell
  lock?: LockService
  lockRoot?: string
}

export type WindbellService = {
  database: Database
  providers: ProviderService
  settings: SettingsService
  workspaces: WorkspaceService
  sessions: SessionService
  dustbin: {
    sessions: DustbinSessionService
    workspaces: DustbinWorkspaceService
  }
}

export function makeWindbellService(
  options: WindbellServiceOptions,
): WindbellService {
  const database = makeDatabase({
    fs: options.fs,
    path: options.path,
    root: options.root,
  })
  const lock =
    options.lock ??
    (options.lockRoot === undefined
      ? undefined
      : makeFileLockService({
          fs: options.fs,
          path: options.path,
          root: options.lockRoot,
        }))

  return {
    database,
    providers: makeProviderService({ database }),
    settings: makeSettingsService({ database }),
    workspaces: makeWorkspaceService({ database }),
    sessions: makeSessionService({
      database,
      sh: options.sh,
      lock,
    }),
    dustbin: {
      sessions: makeDustbinSessionService({ database }),
      workspaces: makeDustbinWorkspaceService({ database }),
    },
  }
}
