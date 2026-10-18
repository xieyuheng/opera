import type * as Cli from "@windbell/cli.ts"
import { makeLocalFileSystem } from "@windbell/fs.ts/local-fs"
import { makePath } from "@windbell/std.ts/path"
import * as S from "@windbell/semiosis.ts"
import {
  makeAccessTokenStore,
  startWindbellServer,
} from "@windbell/windbell-api.ts"
import { formatLocalDateTime, makeAccessTokenUrl } from "../startLog.ts"
import { existsSync } from "node:fs"
import Path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const defaultHostname = "localhost"
const defaultPort = 4090
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

    const accessTokenStore = makeAccessTokenStore({ database })
    const accessToken = await accessTokenStore.create()

    const { info } = await startWindbellServer({
      database,
      hostname,
      port,
      corsOrigin,
      windbellRoot: appPaths.root,
      lockRoot: appPaths.lockRoot,
      webDistRoot,
    })

    const url = makeAccessTokenUrl({
      hostname,
      port: info.port,
      token: accessToken.value,
    })

    console.log(`${formatLocalDateTime(new Date())} windbell start: ${url}`)
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
  return Path.resolve(currentDir, "../../../../windbell-web.vue/dist")
}
