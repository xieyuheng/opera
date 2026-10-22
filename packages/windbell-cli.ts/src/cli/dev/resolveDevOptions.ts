import Path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

import * as S from "@xieyuheng/semiosis.ts"

export type DevOptions = {
  hostname: string
  apiPort: number | undefined
  webPort: number | undefined
  windbellRoot: string
  databaseRoot: string
  lockRoot: string
  webSourceRoot: string
}

export function resolveDevOptions(
  options: Record<string, unknown>,
): DevOptions {
  const hostname =
    readOptionalString(options, "--host") ?? process.env.HOST ?? "localhost"

  const apiPort = readOptionalPort(
    readOptionalString(options, "--api-port") ?? process.env.API_PORT,
  )

  const webPort = readOptionalPort(
    readOptionalString(options, "--web-port") ?? process.env.WEB_PORT,
  )

  const appPaths = S.resolveAppPaths(
    readOptionalString(options, "--windbell-root") ?? S.defaultAppRoot(),
  )

  const webSourceRoot =
    readOptionalString(options, "--web-source-root") ?? defaultWebSourceRoot()

  return {
    hostname,
    apiPort,
    webPort,
    windbellRoot: appPaths.root,
    databaseRoot: appPaths.databaseRoot,
    lockRoot: appPaths.lockRoot,
    webSourceRoot,
  }
}

function readOptionalString(
  options: Record<string, unknown>,
  name: string,
): string | undefined {
  const value = options[name]
  if (typeof value !== "string" || value === "") {
    return undefined
  }

  return value
}

function readOptionalPort(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  return parsePositiveInt(value)
}

function parsePositiveInt(value: string): number {
  const number = Number(value)
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`invalid positive integer: ${value}`)
  }

  return number
}

function defaultWebSourceRoot(): string {
  const currentDir = Path.dirname(fileURLToPath(import.meta.url))
  return Path.resolve(currentDir, "../../../../windbell-web.vue")
}
