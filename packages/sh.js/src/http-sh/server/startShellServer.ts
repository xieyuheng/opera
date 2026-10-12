import { Hono } from "hono"
import type { Shell } from "../../sh/index.ts"
import { makeShellRouter } from "../router/index.ts"
import { serveAndWait } from "./serveAndWait.ts"

export type ShellServerOptions = {
  sh?: Array<Shell>
  hostname: string
  port: number
  basePath?: string
}

export async function startShellServer(options: ShellServerOptions): Promise<{
  server: Awaited<ReturnType<typeof serveAndWait>>["server"]
  url: string
}> {
  const app = new Hono()
  const basePath = normalizeBasePath(options.basePath ?? "/api/sh")

  app.route(
    basePath || "/",
    makeShellRouter({
      sh: options.sh,
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
