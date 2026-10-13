import Os from "node:os"
import Path from "node:path"
import process from "node:process"

export function defaultWindbellRoot(): string {
  return process.env.WINDBELL_HOME ?? Path.join(Os.homedir(), ".windbell")
}

export function defaultDatabaseRoot(): string {
  return Path.join(defaultWindbellRoot(), "database")
}

export function defaultLockRoot(): string {
  return Path.join(defaultWindbellRoot(), "var", "locks")
}
