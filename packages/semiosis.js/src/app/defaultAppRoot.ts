import Os from "node:os"
import Path from "node:path"
import process from "node:process"

export function defaultAppRoot(): string {
  return process.env.WINDBELL_HOME ?? Path.join(Os.homedir(), ".windbell")
}

export type AppPaths = {
  root: string
  databaseRoot: string
  lockRoot: string
}

export function resolveAppPaths(root: string): AppPaths {
  const normalized = Path.resolve(root)

  return {
    root: normalized,
    databaseRoot: Path.join(normalized, "database"),
    lockRoot: Path.join(normalized, "var", "locks"),
  }
}
