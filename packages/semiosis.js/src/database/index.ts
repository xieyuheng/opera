import { makeLocalFileSystem } from "@windbell/fs.js/local-fs"
import { makePath } from "@windbell/std.js/path"
import process from "node:process"
import { makeDatabase, type Database } from "./Database.ts"

export * from "./Database.ts"
export * from "./DustbinSessionStore.ts"
export * from "./DustbinWorkspaceStore.ts"
export * from "./ProviderStore.ts"
export * from "./SettingsStore.ts"
export * from "./SessionStore.ts"
export * from "./WorkspaceStore.ts"
export * from "./defaultDatabaseRoot.ts"
export * from "./defaultVarRoot.ts"
export * from "./jsonFile.ts"
export * from "./apiKey.ts"
export * from "./signFile.ts"

export function makeNodeDatabase(options: { root: string }): Database {
  return makeDatabase({
    fs: makeLocalFileSystem(),
    path: makePath(process.platform === "win32" ? "win32" : "posix"),
    root: options.root,
  })
}
