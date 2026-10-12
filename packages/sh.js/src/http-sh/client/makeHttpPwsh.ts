import { makeHttpShell, type HttpShellConfig } from "./makeHttpShell.ts"

export function makeHttpPwsh(config: HttpShellConfig) {
  return makeHttpShell(config, "pwsh")
}
