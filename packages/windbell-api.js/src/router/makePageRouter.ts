import type * as S from "@windbell/semiosis.js"
import { Hono } from "hono"
import { makePagesController } from "../controllers/PagesController.ts"
import * as PagesServices from "../services/Pages.ts"

export type PageRouterOptions = {
  database: S.Database
  providers: S.ProvidersService
  settings: S.SettingsService
}

export function makePageRouter(options: PageRouterOptions): Hono {
  const app = new Hono()
  const pages = makePagesController({
    loadHomeData: PagesServices.LoadHomeData({
      database: options.database,
    }),
    loadWorkspaceData: PagesServices.LoadWorkspaceData({
      database: options.database,
    }),
    loadSessionData: PagesServices.LoadSessionData({
      database: options.database,
    }),
    loadSessionDustbinData: PagesServices.LoadSessionDustbinData({
      database: options.database,
    }),
    loadWorkspaceDustbinData: PagesServices.LoadWorkspaceDustbinData({
      database: options.database,
    }),
    loadProviderListData: PagesServices.LoadProviderListData({
      providers: options.providers,
      settings: options.settings,
    }),
    loadProviderData: PagesServices.LoadProviderData({
      providers: options.providers,
      settings: options.settings,
    }),
  })

  app.get("/home", () => pages.home({}))

  app.get("/workspaces/:workspaceId", (c) =>
    pages.workspace({ workspaceId: c.req.param("workspaceId") }),
  )

  app.get("/sessions/:sessionId", (c) =>
    pages.session({ sessionId: c.req.param("sessionId") }),
  )

  app.get("/session-dustbin", (c) =>
    pages.sessionDustbin({
      workspaceId: c.req.query("workspaceId") || undefined,
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
