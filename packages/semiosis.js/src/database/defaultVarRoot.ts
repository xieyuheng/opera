import Os from "node:os"
import Path from "node:path"
import process from "node:process"

export function defaultVarRoot(): string {
  return process.env.WINDBELL_VAR ?? Path.join(Os.homedir(), ".windbell", "var")
}

export function defaultLockRoot(): string {
  return Path.join(defaultVarRoot(), "locks")
}
