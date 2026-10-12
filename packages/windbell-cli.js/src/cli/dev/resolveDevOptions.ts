import * as S from "@windbell/semiosis.js/node"
import Path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

export type DevOptions = {
  hostname: string
  apiPort: number
  webPort: number
  databaseRoot: string
  webSourceRoot: string
}

export function resolveDevOptions(
  options: Record<string, unknown>,
): DevOptions {
  const hostname =
    readOptionalString(options, "--host") ?? process.env.HOST ?? "127.0.0.1"

  const apiPort = parsePositiveInt(
    readOptionalString(options, "--api-port") ?? process.env.API_PORT ?? "3000",
  )

  const webPort = parsePositiveInt(
    readOptionalString(options, "--web-port") ?? process.env.WEB_PORT ?? "5173",
  )

  const databaseRoot =
    readOptionalString(options, "--database-root") ?? S.defaultDatabaseRoot()

  const webSourceRoot =
    readOptionalString(options, "--web-source-root") ?? defaultWebSourceRoot()

  return {
    hostname,
    apiPort,
    webPort,
    databaseRoot,
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

function parsePositiveInt(value: string): number {
  const number = Number(value)
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`invalid positive integer: ${value}`)
  }

  return number
}

function defaultWebSourceRoot(): string {
  const currentDir = Path.dirname(fileURLToPath(import.meta.url))
  return Path.resolve(currentDir, "../../../../windbell-web.js")
}
