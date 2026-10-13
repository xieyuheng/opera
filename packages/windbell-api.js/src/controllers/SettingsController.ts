import type * as S from "@windbell/semiosis.js"
import { ok } from "@windbell/std.js/result"
import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"

export type SettingsControllerOptions = {
  settings: S.SettingsService
}

export const PutSettingsInputSchema = z.object({
  settings: z.custom<S.Settings>(),
})

export function makeSettingsController(options: SettingsControllerOptions) {
  return {
    get: makeAction(z.object({}), async () => {
      return ok(await options.settings.get())
    }),

    put: makeAction(PutSettingsInputSchema, async (input) => {
      await options.settings.put(input.settings)
      return ok(null)
    }),
  }
}
