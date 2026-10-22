import Os from "node:os"
import Path from "node:path"
import process from "node:process"

export type WindbellPaths = {
  databaseRoot: string
  lockRoot: string
}

export type ResolveWindbellPathsOptions = {
  operaHome?: string
  databaseRoot?: string
  lockRoot?: string
}

export function defaultOperaHome(): string {
  return process.env.OPERA_HOME ?? Path.join(Os.homedir(), ".opera")
}

export function resolveWindbellPaths(
  options: ResolveWindbellPathsOptions = {},
): WindbellPaths {
  const operaHome = Path.resolve(options.operaHome ?? defaultOperaHome())

  return {
    databaseRoot:
      options.databaseRoot === undefined
        ? Path.join(operaHome, "var", "windbell", "database")
        : Path.resolve(options.databaseRoot),
    lockRoot:
      options.lockRoot === undefined
        ? Path.join(operaHome, "var", "windbell", "session-locks")
        : Path.resolve(options.lockRoot),
  }
}
