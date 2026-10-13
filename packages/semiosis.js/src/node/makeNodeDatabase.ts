import { makeLocalFileSystem } from "@windbell/fs.js/local-fs"
import { makePath } from "@windbell/std.js/path"
import process from "node:process"
import { makeDatabase, type Database } from "../database/Database.ts"

export function makeNodeDatabase(options: { root: string }): Database {
  return makeDatabase({
    fs: makeLocalFileSystem(),
    path: makePath(process.platform === "win32" ? "win32" : "posix"),
    root: options.root,
  })
}
