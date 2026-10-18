import * as S from "@windbell/semiosis.js"
import { makeLocalFileSystem } from "@windbell/fs.js/local-fs"
import { makePath } from "@windbell/std.js/path"
import {
  closeServer,
  makeAccessTokenStore,
  startWindbellServer,
} from "@windbell/windbell-api.js"
import { formatLocalDateTime, makeAccessTokenUrl } from "../startLog.ts"
import Path from "node:path"
import process from "node:process"
import { createServer, type ViteDevServer } from "vite"
import type { DevOptions } from "./resolveDevOptions.ts"
import type { ServerType } from "@hono/node-server"

export async function runDev(options: DevOptions): Promise<void> {
  const database = S.makeDatabase({
    fs: makeLocalFileSystem(),
    path: makePath(process.platform === "win32" ? "win32" : "posix"),
    root: options.databaseRoot,
  })

  const accessTokenStore = makeAccessTokenStore({ database })
  const accessToken = await accessTokenStore.create()

  const { server: apiServer } = await startWindbellServer({
    database,
    hostname: options.hostname,
    port: options.apiPort,
    corsOrigin: undefined,
    windbellRoot: options.windbellRoot,
    lockRoot: options.lockRoot,
    webDistRoot: undefined,
  })

  const viteServer = await createServer({
    root: options.webSourceRoot,
    configFile: Path.join(options.webSourceRoot, "vite.config.ts"),
    server: {
      host: options.hostname,
      port: options.webPort,
      strictPort: true,
      proxy: {
        "/api": {
          target: `http://${options.hostname}:${options.apiPort}`,
          changeOrigin: true,
        },
      },
    },
  })

  await viteServer.listen()

  const url = makeAccessTokenUrl({
    hostname: options.hostname,
    port: options.webPort,
    token: accessToken.value,
  })

  console.log(`${formatLocalDateTime(new Date())} windbell dev: ${url}`)

  installShutdownHandlers({
    apiServer,
    viteServer,
  })
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
