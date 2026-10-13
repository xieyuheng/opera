import process from "node:process"
import { makeHttpFileSystemRouter } from "@windbell/fs.js/http-fs/router"
import { defaultWindbellRoot } from "@windbell/semiosis.js/node"
import { makeShellRouter } from "@windbell/sh.js/http-sh/router"
import { Hono } from "hono"
import { cors } from "hono/cors"
import Path from "node:path"
import { health } from "../service/index.ts"
import type { WindbellRouterOptions } from "./WindbellRouterOptions.ts"
import { makeThemesRouter } from "./makeThemesRouter.ts"

export function makeWindbellRouter(options: WindbellRouterOptions): Hono {
  const app = new Hono()
  const windbellRoot = options.windbellRoot ?? defaultWindbellRoot()
  const lockRoot = options.lockRoot ?? Path.join(windbellRoot, "var", "locks")

  if (options.corsOrigin !== undefined) {
    app.use("*", cors({ origin: options.corsOrigin }))
  }

  app.get("/api/health", async (c) => {
    return c.json(await health())
  })

  app.route("/api/fs", makeHttpFileSystemRouter())

  app.route("/api/sh", makeShellRouter())

  app.get("/api/config", (c) => {
    return c.json({
      databaseRoot: options.database.root,
      lockRoot,
      shellName: process.platform === "win32" ? "pwsh" : "bash",
    })
  })

  app.route(
    "/api/themes",
    makeThemesRouter({
      root: Path.join(options.database.root, "themes"),
    }),
  )

  return app
}
