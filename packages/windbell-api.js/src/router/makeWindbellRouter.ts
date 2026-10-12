import { makeHttpFileSystemRouter } from "@windbell/fs.js/http-fs/router"
import { makeSemiosisRouter } from "@windbell/semiosis-api.js"
import { Hono } from "hono"
import { cors } from "hono/cors"
import Path from "node:path"
import { health } from "../service/index.ts"
import type { WindbellRouterOptions } from "./WindbellRouterOptions.ts"
import { makeThemesRouter } from "./makeThemesRouter.ts"

export function makeWindbellRouter(options: WindbellRouterOptions): Hono {
  const app = new Hono()

  if (options.corsOrigin !== undefined) {
    app.use("*", cors({ origin: options.corsOrigin }))
  }

  app.get("/api/health", async (c) => {
    return c.json(await health())
  })

  app.route("/api/fs", makeHttpFileSystemRouter())

  app.route(
    "/api/semiosis",
    makeSemiosisRouter({
      database: options.database,
    }),
  )

  app.route(
    "/api/themes",
    makeThemesRouter({
      root: Path.join(options.database.root, "themes"),
    }),
  )

  return app
}
