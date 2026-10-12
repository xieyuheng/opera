import type { FileSystem } from "@windbell/fs.js/fs"
import type { Shell } from "@windbell/sh.js/sh"
import type { Path } from "@windbell/std.js/path"
import { makeDatabase, type Database } from "../database/Database.ts"
import {
  makeDustbinSessionsService,
  type DustbinSessionsService,
} from "./DustbinSessionsService.ts"
import {
  makeDustbinWorkspacesService,
  type DustbinWorkspacesService,
} from "./DustbinWorkspacesService.ts"
import {
  makeProvidersService,
  type ProvidersService,
} from "./ProvidersService.ts"
import { makeSessionsService, type SessionsService } from "./SessionsService.ts"
import { makeSettingsService, type SettingsService } from "./SettingsService.ts"
import {
  makeWorkspacesService,
  type WorkspacesService,
} from "./WorkspacesService.ts"

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

export function makeSemiosis(options: SemiosisOptions): Semiosis {
  const database = makeDatabase({
    fs: options.fs,
    path: options.path,
    root: options.root,
  })

  return {
    database,
    providers: makeProvidersService({ database }),
    settings: makeSettingsService({ database }),
    workspaces: makeWorkspacesService({ database }),
    sessions: makeSessionsService({
      database,
      sh: options.sh,
    }),
    dustbin: {
      sessions: makeDustbinSessionsService({ database }),
      workspaces: makeDustbinWorkspacesService({ database }),
    },
  }
}
