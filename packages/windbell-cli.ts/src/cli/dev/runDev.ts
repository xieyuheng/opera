import type { AddressInfo } from "node:net"
import Path from "node:path"
import process from "node:process"

import type { ServerType } from "@hono/node-server"
import { makeLocalFileSystem } from "@xieyuheng/fs.ts/local-fs"
import { makePath } from "@xieyuheng/std.ts/path"
import {
  closeServer,
  makeAccessTokenStore,
  startWindbellServer,
} from "@xieyuheng/windbell-api.ts"
import * as W from "@xieyuheng/windbell.ts"
import { createServer, type ViteDevServer } from "vite"

import { printQrCode } from "../qrCode.ts"
import {
  formatLocalDateTime,
  formatServerUrlInfo,
  listServerUrlInfos,
  makeAccessTokenUrl,
  makeServerUrl,
} from "../startLog.ts"
import type { DevOptions } from "./resolveDevOptions.ts"

const defaultWebPort = 5173

export async function runDev(options: DevOptions): Promise<void> {
  const database = W.makeDatabase({
    fs: makeLocalFileSystem(),
    path: makePath(process.platform === "win32" ? "win32" : "posix"),
    root: options.databaseRoot,
  })

  const accessTokenStore = makeAccessTokenStore({ database })
  const accessToken = await accessTokenStore.create()

  const { server: apiServer, info: apiInfo } = await startWindbellServer({
    database,
    hostname: options.hostname,
    port: options.apiPort ?? 0,
    corsOrigin: undefined,
    lockRoot: options.lockRoot,
    webDistRoot: undefined,
  })

  let viteServer: ViteDevServer | undefined

  try {
    viteServer = await createServer({
      root: options.webSourceRoot,
      configFile: Path.join(options.webSourceRoot, "vite.config.ts"),
      server: {
        host: options.hostname,
        port: options.webPort ?? defaultWebPort,
        strictPort: options.webPort !== undefined,
        proxy: {
          "/api": {
            target: `http://127.0.0.1:${apiInfo.port}`,
            changeOrigin: true,
          },
        },
      },
    })

    await viteServer.listen()

    const webPort = readServerPort(viteServer)
    const timestamp = formatLocalDateTime(new Date())

    const apiUrl = makeServerUrl({
      hostname: options.hostname,
      port: apiInfo.port,
    })

    console.log(`[${timestamp}] [windbell dev] api local (IPv4): ${apiUrl}`)

    const urls = listServerUrlInfos(options.hostname, {
      ipv6: options.ipv6,
    }).map((urlInfo) => ({
      info: urlInfo,
      url: makeAccessTokenUrl({
        hostname: urlInfo.hostname,
        port: webPort,
        token: accessToken.value,
      }),
    }))

    for (const { info: urlInfo, url: webUrl } of urls) {
      console.log(
        `[${timestamp}] [windbell dev] web ${formatServerUrlInfo(urlInfo)}: ${webUrl}`,
      )

      if (options.qrCode && urlInfo.kind === "exposed") {
        await printQrCode(webUrl)
      }
    }

    installShutdownHandlers({
      apiServer,
      viteServer,
    })
  } catch (error) {
    await viteServer?.close()
    await closeServer(apiServer)
    throw error
  }
}

function readServerPort(server: ViteDevServer): number {
  const address: AddressInfo | string | null | undefined =
    server.httpServer?.address()

  if (
    address === undefined ||
    address === null ||
    typeof address === "string"
  ) {
    throw new Error("windbell dev: failed to read web server port")
  }

  return address.port
}

function installShutdownHandlers(options: {
  apiServer: ServerType
  viteServer: ViteDevServer
}) {
  let stopped = false

  async function shutdown() {
    if (stopped) return
    stopped = true

    await options.viteServer.close()
    await closeServer(options.apiServer)
  }

  process.once("SIGINT", async () => {
    await shutdown()
    process.exit(0)
  })

  process.once("SIGTERM", async () => {
    await shutdown()
    process.exit(0)
  })
}
