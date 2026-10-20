import type { AddressInfo } from "node:net"
import Path from "node:path"
import process from "node:process"

import type { ServerType } from "@hono/node-server"
import { makeLocalFileSystem } from "@windbell/fs.ts/local-fs"
import * as S from "@windbell/semiosis.ts"
import { makePath } from "@windbell/std.ts/path"
import {
  closeServer,
  makeAccessTokenStore,
  startWindbellServer,
} from "@windbell/windbell-api.ts"
import { createServer, type ViteDevServer } from "vite"

import {
  formatLocalDateTime,
  makeAccessTokenUrl,
  makeServerUrl,
} from "../startLog.ts"
import type { DevOptions } from "./resolveDevOptions.ts"

const defaultWebPort = 5173

export async function runDev(options: DevOptions): Promise<void> {
  const database = S.makeDatabase({
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
    windbellRoot: options.windbellRoot,
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
            target: `http://${options.hostname}:${apiInfo.port}`,
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

    const webUrl = makeAccessTokenUrl({
      hostname: options.hostname,
      port: webPort,
      token: accessToken.value,
    })

    console.log(`${timestamp} windbell dev api: ${apiUrl}`)
    console.log(`${timestamp} windbell dev web: ${webUrl}`)

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
