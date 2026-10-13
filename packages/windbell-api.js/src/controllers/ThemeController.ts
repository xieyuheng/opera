import { err, ok } from "@windbell/std.js/result"
import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"
import type { Theme } from "../theme/Theme.ts"
import type { ThemeStore } from "../theme/ThemeStore.ts"

export type ThemeControllerOptions = {
  store: ThemeStore
}

const ThemeColorRecordInputSchema = z.record(
  z.string(),
  z.string().trim().min(1),
)

export const ThemeInputSchema = z.object({
  name: z.string().trim().min(1),
  colors: z.object({
    light: ThemeColorRecordInputSchema,
    dark: ThemeColorRecordInputSchema,
  }),
})

export const GetThemeInputSchema = z.object({
  themeId: z.string(),
})

export const PutThemeInputSchema = z.object({
  themeId: z.string(),
  theme: ThemeInputSchema,
})

export const RemoveThemeInputSchema = z.object({
  themeId: z.string(),
})

export function makeThemeController(options: ThemeControllerOptions) {
  return {
    list: makeAction(z.object({}), async () => {
      return ok(await options.store.list())
    }),

    get: makeAction(GetThemeInputSchema, async (input) => {
      const theme = await options.store.get(input.themeId)

      if (theme === undefined) {
        return err({
          type: "theme-not-found",
          status: 404,
          message: "theme not found",
          info: { themeId: input.themeId },
        })
      }

      return ok(theme)
    }),

    create: makeAction(
      ThemeInputSchema,
      async (input) => {
        return ok(await options.store.create(input))
      },
      { status: 201 },
    ),

    put: makeAction(PutThemeInputSchema, async (input) => {
      const current = await options.store.get(input.themeId)

      if (current === undefined) {
        return err({
          type: "theme-not-found",
          status: 404,
          message: "theme not found",
          info: { themeId: input.themeId },
        })
      }

      const theme: Theme = {
        id: input.themeId,
        name: input.theme.name,
        colors: input.theme.colors,
        createdAt: current.createdAt,
        updatedAt: Date.now(),
      }

      await options.store.put(theme)
      return ok(theme)
    }),

    remove: makeAction(
      RemoveThemeInputSchema,
      async (input) => {
        const current = await options.store.get(input.themeId)

        if (current === undefined) {
          return err({
            type: "theme-not-found",
            status: 404,
            message: "theme not found",
            info: { themeId: input.themeId },
          })
        }

        await options.store.remove(input.themeId)
        return ok(null)
      },
      { status: 204 },
    ),
  }
}
