import { serveStatic } from "@hono/node-server/serve-static"
import fs from "node:fs/promises"
import Path from "node:path"
import { makeWindbellRouter } from "../router/index.ts"
import { serveAndWait, type ServeResult } from "./serveAndWait.ts"
import type { WindbellServerOptions } from "./WindbellServerOptions.ts"

export async function startWindbellServer(
  options: WindbellServerOptions,
): Promise<ServeResult> {
  const app = makeWindbellRouter({
    database: options.database,
    corsOrigin: options.corsOrigin,
    lockRoot: options.lockRoot,
  })

  if (options.webDistRoot !== undefined) {
    const webDistRoot = options.webDistRoot

    app.use(
      "*",
      serveStatic({
        root: webDistRoot,
      }),
    )

    app.get("*", async (c) => {
      const index = await fs.readFile(
        Path.join(webDistRoot, "index.html"),
        "utf8",
      )
      return c.html(index)
    })
  }

  return serveAndWait({
    fetch: app.fetch,
    hostname: options.hostname,
    port: options.port,
  })
}
