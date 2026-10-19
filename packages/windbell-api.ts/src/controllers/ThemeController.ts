import { makeServiceError } from "@windbell/semiosis.ts"
import { err, ok } from "@windbell/std.ts/result"
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
      try {
        return ok(await options.store.list())
      } catch (error) {
        return err(unknownServiceError(error))
      }
    }),

    get: makeAction(GetThemeInputSchema, async (input) => {
      try {
        const theme = await options.store.get(input.themeId)
        if (theme === undefined) {
          return err(
            makeServiceError({
              type: "theme-not-found",
              message: "theme not found",
              info: { themeId: input.themeId },
            }),
          )
        }
        return ok(theme)
      } catch (error) {
        return err(unknownServiceError(error))
      }
    }),

    create: makeAction(
      ThemeInputSchema,
      async (input) => {
        try {
          return ok(await options.store.create(input))
        } catch (error) {
          return err(unknownServiceError(error))
        }
      },
      { status: 201 },
    ),

    put: makeAction(PutThemeInputSchema, async (input) => {
      try {
        const current = await options.store.get(input.themeId)
        if (current === undefined) {
          return err(
            makeServiceError({
              type: "theme-not-found",
              message: "theme not found",
              info: { themeId: input.themeId },
            }),
          )
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
      } catch (error) {
        return err(unknownServiceError(error))
      }
    }),

    remove: makeAction(
      RemoveThemeInputSchema,
      async (input) => {
        try {
          const current = await options.store.get(input.themeId)
          if (current === undefined) {
            return err(
              makeServiceError({
                type: "theme-not-found",
                message: "theme not found",
                info: { themeId: input.themeId },
              }),
            )
          }

          await options.store.remove(input.themeId)
          return ok(null)
        } catch (error) {
          return err(unknownServiceError(error))
        }
      },
      { status: 204 },
    ),
  }
}

function unknownServiceError(error: unknown) {
  return makeServiceError({
    type: "unknown",
    message: error instanceof Error ? error.message : String(error),
  })
}
