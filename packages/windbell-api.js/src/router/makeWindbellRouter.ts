import process from "node:process"
import { makeHttpFileSystemRouter } from "@windbell/fs-api.js/router"
import {
  makeDustbinSessionsService,
  makeDustbinWorkspacesService,
  makeProvidersService,
  makeSessionsService,
  makeSettingsService,
  makeWorkspacesService,
} from "@windbell/semiosis.js"
import { defaultWindbellRoot } from "@windbell/semiosis.js/node"
import { makeLocalBash, makeLocalPwsh } from "@windbell/sh.js/local-sh"
import { Hono } from "hono"
import { cors } from "hono/cors"
import Path from "node:path"
import { health } from "../service/index.ts"
import type { WindbellRouterOptions } from "./WindbellRouterOptions.ts"
import { makeDomainRouter } from "./makeDomainRouter.ts"
import { makePageRouter } from "./makePageRouter.ts"
import { makeThemesRouter } from "./makeThemesRouter.ts"

export function makeWindbellRouter(options: WindbellRouterOptions): Hono {
  const app = new Hono()
  const windbellRoot = options.windbellRoot ?? defaultWindbellRoot()
  const lockRoot = options.lockRoot ?? Path.join(windbellRoot, "var", "locks")
  const sh = process.platform === "win32" ? makeLocalPwsh() : makeLocalBash()
  const sessions = makeSessionsService({ database: options.database, sh })
  const workspaces = makeWorkspacesService({ database: options.database })
  const dustbinSessions = makeDustbinSessionsService({
    database: options.database,
  })
  const dustbinWorkspaces = makeDustbinWorkspacesService({
    database: options.database,
  })
  const providers = makeProvidersService({ database: options.database })
  const settings = makeSettingsService({ database: options.database })

  if (options.corsOrigin !== undefined) {
    app.use("*", cors({ origin: options.corsOrigin }))
  }

  app.get("/api/health", async (c) => {
    return c.json(await health())
  })

  app.route("/api/fs", makeHttpFileSystemRouter())

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

  app.route(
    "/api/pages",
    makePageRouter({
      database: options.database,
      providers,
      settings,
    }),
  )

  app.route(
    "/api",
    makeDomainRouter({
      database: options.database,
      sessions,
      workspaces,
      dustbinSessions,
      dustbinWorkspaces,
      providers,
      settings,
    }),
  )

  return app
}
