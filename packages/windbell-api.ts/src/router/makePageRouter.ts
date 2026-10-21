import type * as S from "@windbell/semiosis.ts"
import { Hono } from "hono"

import { makePageController } from "../controllers/PageController.ts"
import * as PageService from "../services/Page.ts"

export type PageRouterOptions = {
  database: S.Database
  providers: S.ProviderService
  settings: S.SettingsService
}

export function makePageRouter(options: PageRouterOptions): Hono {
  const app = new Hono()
  const pages = makePageController({
    loadHomeData: PageService.LoadHomeData({
      database: options.database,
    }),
    loadWorkspaceData: PageService.LoadWorkspaceData({
      database: options.database,
    }),
    loadSessionData: PageService.LoadSessionData({
      database: options.database,
    }),
    loadSessionDustbinData: PageService.LoadSessionDustbinData({
      database: options.database,
    }),
    loadWorkspaceDustbinData: PageService.LoadWorkspaceDustbinData({
      database: options.database,
    }),
    loadProviderListData: PageService.LoadProviderListData({
      providers: options.providers,
      settings: options.settings,
    }),
    loadProviderData: PageService.LoadProviderData({
      providers: options.providers,
      settings: options.settings,
    }),
  })

  app.get("/home", () => pages.home({}))

  app.get("/workspaces/:workspaceId", (c) =>
    pages.workspace({
      workspaceId: c.req.param("workspaceId"),
      previewLimit: c.req.query("previewLimit"),
      limit: c.req.query("limit"),
      cursor: c.req.query("cursor"),
    }),
  )

  app.get("/sessions/:sessionId", (c) =>
    pages.session({ sessionId: c.req.param("sessionId") }),
  )

  app.get("/session-dustbin", (c) =>
    pages.sessionDustbin({
      workspaceId: c.req.query("workspaceId") || undefined,
      previewLimit: c.req.query("previewLimit"),
    }),
  )

  app.get("/workspace-dustbin", () => pages.workspaceDustbin({}))

  app.get("/provider-list", () => pages.providerList({}))

  app.get("/providers/:providerName", (c) =>
    pages.provider({ providerName: c.req.param("providerName") }),
  )

  app.onError((error) => sendError(error))

  return app
}

function sendError(error: unknown): Response {
  const status = getHttpStatus(error)
  const message = error instanceof Error ? error.message : String(error)
  return Response.json({ error: { message } }, { status })
}

function getHttpStatus(error: unknown): number {
  if (error !== null && typeof error === "object") {
    const status = (error as { status?: unknown }).status
    if (typeof status === "number") return status
  }

  return 500
}
