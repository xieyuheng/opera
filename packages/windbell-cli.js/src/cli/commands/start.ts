import type * as Cli from "@windbell/cli.js"
import { makeLocalFileSystem } from "@windbell/fs.js/local-fs"
import { makePath } from "@windbell/std.js/path"
import * as S from "@windbell/semiosis.js"
import { startWindbellServer } from "@windbell/windbell-api.js"
import { existsSync } from "node:fs"
import Path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const defaultHostname = "127.0.0.1"
const defaultPort = 3000
const defaultCorsOrigin: string | undefined = undefined

export function makeStartHandler() {
  return async (context: Cli.HandlerContext) => {
    const hostname =
      readOptionalString(context.options, "--host") ??
      process.env.HOST ??
      defaultHostname

    const port = parsePositiveInt(
      readOptionalString(context.options, "--port") ??
        process.env.PORT ??
        String(defaultPort),
    )

    const corsOrigin =
      readOptionalString(context.options, "--cors-origin") ??
      process.env.CORS_ORIGIN ??
      defaultCorsOrigin

    const appPaths = S.resolveAppPaths(
      readOptionalString(context.options, "--windbell-root") ??
        S.defaultAppRoot(),
    )

    const webDistRoot =
      readOptionalString(context.options, "--web-dist-root") ??
      defaultWebDistRoot()

    if (!existsSync(webDistRoot)) {
      throw new Error(
        `[windbell start] web dist root not found: ${webDistRoot}, run windbell-web build first`,
      )
    }

    const database = S.makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root: appPaths.databaseRoot,
    })

    const { info } = await startWindbellServer({
      database,
      hostname,
      port,
      corsOrigin,
      windbellRoot: appPaths.root,
      lockRoot: appPaths.lockRoot,
      webDistRoot,
    })

    console.log(`windbell listening on http://${info.address}:${info.port}`)
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

function defaultWebDistRoot(): string {
  const currentDir = Path.dirname(fileURLToPath(import.meta.url))
  return Path.resolve(currentDir, "../../../../windbell-web.js/dist")
}
