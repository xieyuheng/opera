import { makeHttpShell, type HttpShellConfig } from "./makeHttpShell.ts"

export function makeHttpBash(config: HttpShellConfig) {
  return makeHttpShell(config, "bash")
}
