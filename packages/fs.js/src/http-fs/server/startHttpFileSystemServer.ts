import { Hono } from "hono"
import type { FileSystem } from "../../fs/index.ts"
import { makeHttpFileSystemRouter } from "../router/index.ts"
import { serveAndWait } from "./serveAndWait.ts"

export type HttpFileSystemServerOptions = {
  fs?: FileSystem
  hostname: string
  port: number
  basePath?: string
}

export async function startHttpFileSystemServer(
  options: HttpFileSystemServerOptions,
): Promise<{
  server: Awaited<ReturnType<typeof serveAndWait>>["server"]
  url: string
}> {
  const app = new Hono()
  const basePath = normalizeBasePath(options.basePath ?? "/api/fs")

  app.route(
    basePath || "/",
    makeHttpFileSystemRouter({
      fs: options.fs,
    }),
  )

  const { server, info } = await serveAndWait({
    fetch: app.fetch,
    hostname: options.hostname,
    port: options.port,
  })

  return {
    server,
    url: `http://${options.hostname}:${info.port}${basePath}`,
  }
}

function normalizeBasePath(basePath: string): string {
  if (basePath === "" || basePath === "/") return ""
  return `/${basePath.replace(/^\/+|\/+$/g, "")}`
}
