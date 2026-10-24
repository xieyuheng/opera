import { existsSync } from "node:fs"
import Path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

import type * as Cli from "@xieyuheng/cli.ts"
import { makeLocalFileSystem } from "@xieyuheng/fs.ts/local-fs"
import { makePath } from "@xieyuheng/std.ts/path"
import {
  makeAccessTokenStore,
  startWindbellServer,
} from "@xieyuheng/windbell-api.ts"
import * as W from "@xieyuheng/windbell.ts"

import { resolveHostname } from "../resolveHostname.ts"
import {
  formatLocalDateTime,
  formatServerUrlInfo,
  listServerUrlInfos,
  makeAccessTokenUrl,
} from "../startLog.ts"

const defaultPort = 4090
const defaultCorsOrigin: string | undefined = undefined

export function makeStartHandler() {
  return async (context: Cli.HandlerContext) => {
    const hostname = resolveHostname(context.options)

    const port = parsePositiveInt(
      readOptionalString(context.options, "--port") ??
        process.env.PORT ??
        String(defaultPort),
    )

    const corsOrigin =
      readOptionalString(context.options, "--cors-origin") ??
      process.env.CORS_ORIGIN ??
      defaultCorsOrigin

    const paths = W.resolveWindbellPaths({
      databaseRoot: readOptionalString(context.options, "--database-root"),
      lockRoot: readOptionalString(context.options, "--session-lock-root"),
    })

    const webDistRoot =
      readOptionalString(context.options, "--web-dist-root") ??
      defaultWebDistRoot()

    if (!existsSync(webDistRoot)) {
      throw new Error(
        `[windbell start] web dist root not found: ${webDistRoot}, run windbell-web build first`,
      )
    }

    const database = W.makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root: paths.databaseRoot,
    })

    const accessTokenStore = makeAccessTokenStore({ database })
    const accessToken = await accessTokenStore.create()

    const { info } = await startWindbellServer({
      database,
      hostname,
      port,
      corsOrigin,
      lockRoot: paths.lockRoot,
      webDistRoot,
    })

    const timestamp = formatLocalDateTime(new Date())

    for (const urlInfo of listServerUrlInfos(hostname)) {
      const url = makeAccessTokenUrl({
        hostname: urlInfo.hostname,
        port: info.port,
        token: accessToken.value,
      })

      console.log(
        `[${timestamp}] [windbell start] ${formatServerUrlInfo(urlInfo)}: ${url}`,
      )
    }
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
