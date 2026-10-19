import Path from "node:path"
import process from "node:process"

import { makeHttpFileSystemRouter } from "@windbell/fs-api.ts/router"
import {
  makeDustbinSessionService,
  makeDustbinWorkspaceService,
  makeProviderService,
  makeSessionService,
  makeSettingsService,
  makeWorkspaceService,
} from "@windbell/semiosis.ts"
import { defaultAppRoot, resolveAppPaths } from "@windbell/semiosis.ts"
import { makeBash } from "@windbell/sh.ts/bash"
import { makePwsh } from "@windbell/sh.ts/pwsh"
import { Hono } from "hono"
import { cors } from "hono/cors"

import { makeAccessTokenStore } from "../auth/AccessToken.ts"
import { makeBearerAuth } from "../auth/bearerAuth.ts"
import { makeConfigController } from "../controllers/ConfigController.ts"
import { makeHealthController } from "../controllers/HealthController.ts"
import { makeDomainRouter } from "./makeDomainRouter.ts"
import { makePageRouter } from "./makePageRouter.ts"
import { makeThemesRouter } from "./makeThemesRouter.ts"
import type { WindbellRouterOptions } from "./WindbellRouterOptions.ts"

export function makeWindbellRouter(options: WindbellRouterOptions): Hono {
  const app = new Hono()
  const appPaths = resolveAppPaths(options.windbellRoot ?? defaultAppRoot())
  const lockRoot = options.lockRoot ?? appPaths.lockRoot
  const sh = process.platform === "win32" ? makePwsh() : makeBash()
  const sessions = makeSessionService({ database: options.database, sh })
  const workspaces = makeWorkspaceService({ database: options.database })
  const dustbinSessions = makeDustbinSessionService({
    database: options.database,
  })
  const dustbinWorkspaces = makeDustbinWorkspaceService({
    database: options.database,
  })
  const providers = makeProviderService({ database: options.database })
  const settings = makeSettingsService({ database: options.database })

  const health = makeHealthController()
  const config = makeConfigController({
    databaseRoot: options.database.root,
    lockRoot,
    shellName: process.platform === "win32" ? "pwsh" : "bash",
  })

  if (options.corsOrigin !== undefined) {
    app.use(
      "*",
      cors({
        origin: options.corsOrigin,
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      }),
    )
  }

  app.use(
    "/api/*",
    makeBearerAuth({
      store: makeAccessTokenStore({ database: options.database }),
    }),
  )

  app.get("/api/health", () => health.get({}))

  app.route("/api/fs", makeHttpFileSystemRouter())

  app.get("/api/config", () => config.get({}))

  app.route(
    "/api/themes",
    makeThemesRouter({
      files: options.database.files,
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
