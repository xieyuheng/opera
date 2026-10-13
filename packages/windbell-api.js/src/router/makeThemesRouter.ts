import { Hono } from "hono"
import { makeThemesController } from "../controllers/ThemesController.ts"
import * as ThemesServices from "../services/Themes.ts"
import { makeThemeStore } from "../theme/ThemeStore.ts"
import { readJsonBody, readRecord, readString } from "./readJson.ts"

export type ThemesRouterOptions = {
  root: string
}

export function makeThemesRouter(options: ThemesRouterOptions): Hono {
  const app = new Hono()
  const store = makeThemeStore({ root: options.root })

  const themes = makeThemesController({
    listThemes: ThemesServices.ListThemes({ store }),
    getTheme: ThemesServices.GetTheme({ store }),
    createTheme: ThemesServices.CreateTheme({ store }),
    putTheme: ThemesServices.PutTheme({ store }),
    removeTheme: ThemesServices.RemoveTheme({ store }),
  })

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
