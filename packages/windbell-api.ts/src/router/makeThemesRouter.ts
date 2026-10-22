import type * as S from "@xieyuheng/semiosis.ts"
import { Hono } from "hono"

import { makeThemeController } from "../controllers/ThemeController.ts"
import { makeThemeStore } from "../theme/ThemeStore.ts"
import { readJsonBody, readRecord, readString } from "./readJson.ts"

export type ThemesRouterOptions = {
  files: S.Database["files"]
  root: string
}

export function makeThemesRouter(options: ThemesRouterOptions): Hono {
  const app = new Hono()
  const store = makeThemeStore({
    files: options.files,
    root: options.root,
  })

  const themes = makeThemeController({ store })

  app.get("/", () => themes.list({}))

  app.get("/:themeId", (c) => themes.get({ themeId: c.req.param("themeId") }))

  app.post("/", async (c) => {
    const body = readRecord(await readJsonBody(c))
    return themes.create({
      name: readString(body, "name"),
      colors: body.colors,
    })
  })

  app.put("/:themeId", async (c) => {
    const body = readRecord(await readJsonBody(c))
    return themes.put({
      themeId: c.req.param("themeId"),
      theme: {
        name: readString(body, "name"),
        colors: body.colors,
      },
    })
  })

  app.delete("/:themeId", (c) =>
    themes.remove({ themeId: c.req.param("themeId") }),
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
